"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { LOOKS } from "@/components/world/character/looks";
import { useWorld } from "@/lib/useWorld";
import { emit, setPanel, world } from "@/lib/world";
import { cn } from "@/lib/utils";

import { IconArrow, IconSwap, IconTimeline, IconUser } from "./icons";
import Pill from "./Pill";
import SoundToggle from "./SoundToggle";

export const switchLook = () => {
  world.look = (world.look + 1) % LOOKS.length;
  emit("look");
};

/**
 * Bottom frame (docs/design-spec.md §2.5): Timeline pill + profile button on the
 * left, "press space to switch look" in the middle, Blog link + sound on the right.
 */
const Toolbar = () => {
  const { look, panel } = useWorld("look", "panel");
  const [flash, setFlash] = useState(false);

  // Space switches the look when nothing interactive has focus (as the reference's key-cap hint).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || world.panel) return;
      const el = document.activeElement;
      if (el && el !== document.body && el.tagName !== "CANVAS") return;
      e.preventDefault();
      switchLook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Briefly show the new look's name after each switch (not on first render).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [look]);

  return (
    <div className="toolbar pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-edge pb-5 lg:pb-[45px]">
      <div className="flex items-end justify-between gap-3">
        <div className="pointer-events-auto flex items-end gap-2.5 lg:w-col-5 lg:gap-[15px]">
          <Pill
            label="Timeline"
            icon={<IconTimeline />}
            onClick={() => setPanel("timeline")}
            ariaLabel="Open career timeline"
            delay={0.35}
            className="hud-in !hidden xs:!inline-flex"
          />
          <button
            type="button"
            onClick={() => setPanel("timeline")}
            aria-label="Open career timeline"
            className="round hud-in xs:!hidden"
            style={{ "--d": "0.35s" } as CSSProperties}
          >
            <IconTimeline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPanel("profile")}
            aria-label="Open full profile"
            aria-expanded={panel === "profile"}
            className="round round--ghost hud-in"
            style={{ "--d": "0.45s" } as CSSProperties}
          >
            <IconUser className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-auto hidden flex-1 items-center justify-center gap-4 pb-2 lg:flex">
          <span aria-hidden className="t-label text-fg/60">
            Press
          </span>
          <button
            type="button"
            onClick={switchLook}
            className="t-label relative h-11 min-w-[150px] rounded-full bg-black px-7 text-fg shadow-[0_3px_0_rgb(0_0_0/0.9),0_3px_0_1px_rgb(255_255_255/0.08)] transition-colors hover:text-signal"
          >
            <span className="sr-only">Switch look (or press the space bar). Current: </span>
            <span className={cn("transition-opacity", flash ? "opacity-0" : "opacity-100")}>Space</span>
            <span aria-live="polite" className={cn("absolute inset-0 grid place-items-center text-signal transition-opacity", flash ? "opacity-100" : "opacity-0")}>
              {LOOKS[look].name}
            </span>
          </button>
          <span aria-hidden className="t-label text-fg/60">
            To switch look
          </span>
        </div>

        <button
          type="button"
          onClick={switchLook}
          className="pill pointer-events-auto lg:hidden"
          aria-label={`Switch look. Current: ${LOOKS[look].name}`}
        >
          <span>{flash ? LOOKS[look].name : "Switch"}</span>
          <span className="pill-icon">
            <IconSwap />
          </span>
        </button>

        <div className="pointer-events-auto flex items-center justify-end gap-6 lg:w-col-5">
          <Link href="/blog" className="t-label tlink hidden lx:inline-flex">
            Blog
            <IconArrow />
          </Link>
          <SoundToggle />
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
