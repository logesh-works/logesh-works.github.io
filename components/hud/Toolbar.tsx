"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";

import { WORLDS } from "@/lib/themes";
import { useWorld } from "@/lib/useWorld";
import { on, setPanel, world } from "@/lib/world";
import { pressSwitch, releaseSwitch, switchWorld } from "@/lib/worldSwitch";
import { cn } from "@/lib/utils";

import { IconArrow, IconSwap, IconTimeline, IconUser } from "./icons";
import Pill from "./Pill";
import SoundToggle from "./SoundToggle";

/** Press-and-hold handlers for a switch button; a keyboard "click" runs the whole switch. */
const holdProps = {
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pressSwitch();
  },
  onPointerUp: () => releaseSwitch(),
  onPointerCancel: () => releaseSwitch(),
  onLostPointerCapture: () => releaseSwitch(),
  onClick: (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) switchWorld();
  },
  onContextMenu: (e: MouseEvent<HTMLButtonElement>) => e.preventDefault(),
};

/**
 * Bottom frame (docs/design-spec.md §2.5): Timeline pill + profile button on the
 * left, "hold space to switch world" in the middle, Blog link + sound on the right.
 */
const Toolbar = () => {
  const { theme, panel } = useWorld("theme", "panel");
  const current = WORLDS[theme];
  const [flash, setFlash] = useState(false);

  const fills = useRef<HTMLSpanElement[]>([]);
  const fill = (el: HTMLSpanElement | null) => {
    if (el && !fills.current.includes(el)) fills.current.push(el);
  };

  // Holding Space switches world (when nothing interactive has focus); letting go early cancels.
  useEffect(() => {
    const free = () => {
      const el = document.activeElement;
      return !world.panel && (!el || el === document.body || el.tagName === "CANVAS");
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || !free()) return;
      e.preventDefault();
      if (!e.repeat) pressSwitch();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") releaseSwitch();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseSwitch);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseSwitch);
    };
  }, []);

  // The switch buttons fill with gold as the switch is held: half while arming, the rest as it reveals.
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      fills.current.forEach((el) => (el.style.transform = `scaleX(${world.transition ? (world.reveal > 0 ? 0.5 + world.reveal * 0.5 : world.warp * 0.5) : 0})`));
      if (world.transition) raf = requestAnimationFrame(paint);
    };
    const off = on("transition", () => {
      cancelAnimationFrame(raf);
      paint();
    });
    return () => {
      off();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Briefly show the new world's name after each switch (not on first render).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [theme]);

  return (
    <nav aria-label="Stage controls" className="toolbar pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-edge pb-5 lg:pb-[45px]">
      <div className="flex items-end justify-between gap-3">
        <div className="toolbar-side pointer-events-auto flex items-end gap-2.5 lg:w-col-5 lg:gap-[15px]">
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

        <div className="pointer-events-auto hidden flex-1 flex-col items-center gap-3 pb-2 lg:flex">
          <p className="t-eyebrow">
            World <span className="text-signal">{current.index}</span>/{String(WORLDS.length).padStart(2, "0")} · {current.name}
          </p>
          <div className="flex items-center gap-4">
            <span aria-hidden className="switch-aside t-label text-fg/60">
              Hold
            </span>
            <button
              type="button"
              {...holdProps}
              className="switch-btn t-label relative h-11 min-w-[170px] touch-none select-none overflow-hidden rounded-full bg-black px-7 text-fg shadow-[0_3px_0_rgb(0_0_0/0.9),0_3px_0_1px_rgb(255_255_255/0.08)] transition-[color,transform] hover:text-signal active:translate-y-[2px]"
            >
              <span ref={fill} aria-hidden className="absolute inset-0 origin-left scale-x-0 rounded-full bg-signal" />
              <span className="sr-only">Switch world (or hold the space bar). Current: {current.name}. </span>
              <span aria-hidden className={cn("relative transition-opacity", flash ? "opacity-0" : "opacity-100")}>
                Space
              </span>
              <span aria-hidden className={cn("absolute inset-0 grid place-items-center text-signal transition-opacity", flash ? "opacity-100" : "opacity-0")}>
                {current.name}
              </span>
            </button>
            <span aria-hidden className="switch-aside t-label text-fg/60">
              To switch world
            </span>
          </div>
        </div>

        <button
          type="button"
          {...holdProps}
          className="switch-btn pill pointer-events-auto relative touch-none select-none overflow-hidden lg:hidden"
          aria-label={`Switch world (press and hold). Current: ${current.name}`}
        >
          <span ref={fill} aria-hidden className="absolute inset-0 origin-left scale-x-0 rounded-full bg-signal" />
          <span className="relative whitespace-nowrap">
            {flash ? (
              current.name
            ) : (
              <>
                {/* The narrowest phones drop "Hold ·" so the sound toggle stays on screen. */}
                <span className="hidden xs:inline">Hold · </span>World {current.index}
              </>
            )}
          </span>
          <span className="pill-icon relative">
            <IconSwap />
          </span>
        </button>

        <div className="toolbar-side pointer-events-auto flex items-center justify-end gap-6 lg:w-col-5">
          <Link href="/blog" className="t-label tlink -my-3 hidden px-2 py-3 md:inline-flex">
            Blog
            <IconArrow />
          </Link>
          <SoundToggle />
        </div>
      </div>
    </nav>
  );
};

export default Toolbar;
