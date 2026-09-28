"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ambient } from "@/lib/audio/ambient";
import { useWorld } from "@/lib/useWorld";
import { emit, on, pulse, world } from "@/lib/world";
import { chapters } from "@/constants";
import { cn } from "@/lib/utils";

const PREF = "lk-sound";

const readPref = () => {
  try {
    return window.localStorage.getItem(PREF);
  } catch {
    return null;
  }
};
const writePref = (v: "on" | "off") => {
  try {
    window.localStorage.setItem(PREF, v);
  } catch {
    /* storage unavailable: preference just isn't remembered */
  }
};

/**
 * Owns the ambient score: starts it on the first user gesture (never autoplays),
 * exposes a minimal equaliser toggle, and feeds accents/levels to the world.
 */
const SoundController = () => {
  const { soundOn, ready } = useWorld("sound", "ready");
  const [hint, setHint] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const setOn = useCallback(async (next: boolean, remember: boolean) => {
    if (next) {
      try {
        await ambient.start();
      } catch {
        return;
      }
    } else {
      void ambient.stop();
    }
    world.soundOn = next;
    emit("sound");
    setHint(false);
    if (remember) writePref(next ? "on" : "off");
  }, []);

  useEffect(() => {
    ambient.onAccent = (kind) => {
      if (kind !== "chord") pulse();
    };
    ambient.onLevel = (level) => {
      world.audioLevel = level;
    };
    const offChapter = on("chapter", () => {
      ambient.setDepth(world.chapterIndex / (chapters.length - 1));
      ambient.whoosh();
    });
    return offChapter;
  }, []);

  // Browsers only allow audio after a gesture: the first click/keypress anywhere enables it,
  // unless the visitor previously switched sound off.
  useEffect(() => {
    if (readPref() === "off") return;
    const first = (e: Event) => {
      if (button.current?.contains(e.target as Node)) return;
      if ((e.target as Element | null)?.closest?.('[data-sound-choice="off"]')) {
        cleanup();
        return;
      }
      if (world.soundOn) return;
      void setOn(true, false);
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener("pointerdown", first, true);
      document.removeEventListener("keydown", first, true);
    };
    document.addEventListener("pointerdown", first, true);
    document.addEventListener("keydown", first, true);
    return cleanup;
  }, [setOn]);

  useEffect(() => {
    if (!ready || world.soundOn || readPref() === "off") return;
    const show = window.setTimeout(() => setHint(true), 1200);
    const hide = window.setTimeout(() => setHint(false), 9000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [ready]);

  return (
    <div className="pointer-events-auto relative">
      <p
        aria-hidden
        className={cn(
          "absolute right-0 top-full mt-3 hidden whitespace-nowrap rounded-full border border-line/10 bg-ink/70 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted backdrop-blur transition-all duration-700 sm:block",
          hint && !soundOn ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        Click anywhere to enable sound
      </p>
      <button
        ref={button}
        type="button"
        onClick={() => void setOn(!soundOn, true)}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}
        data-cursor-label={soundOn ? "Sound off" : "Sound on"}
        className={cn("hud-icon !h-12 !w-12", soundOn && "!border-signal/50")}
      >
        <span aria-hidden className="flex h-4 items-center gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn("eq-bar w-[2px] rounded-full bg-current", soundOn ? "eq-on text-signal" : "h-[2px]")}
              style={{ animationDelay: `${i * -0.23}s` }}
            />
          ))}
        </span>
      </button>
    </div>
  );
};

export default SoundController;
