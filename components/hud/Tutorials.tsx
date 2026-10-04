"use client";

import { useEffect, useRef, useState } from "react";

import { useWorld } from "@/lib/useWorld";
import { cn } from "@/lib/utils";

/**
 * First-visit hints (docs/design-spec.md §3.4): enable sound, scroll to explore,
 * drag to rotate. Each disappears once the visitor has done the thing.
 */
const Tutorials = () => {
  const world = useWorld("ready", "sound", "chapter", "drag", "footer");
  const { entered, soundOn, chapterIndex, dragged, footer } = world;
  const [soundHint, setSoundHint] = useState(false);
  const [fine, setFine] = useState(false);

  const hint = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  // With a mouse, the sound hint rides along beside the cursor until the first click.
  useEffect(() => {
    if (!fine || !soundHint) return;
    const move = (e: PointerEvent) => {
      if (hint.current) hint.current.style.transform = `translate3d(${e.clientX + 18}px, ${e.clientY + 14}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [fine, soundHint]);

  useEffect(() => {
    if (!entered || soundOn) return;
    const show = window.setTimeout(() => setSoundHint(true), 1400);
    const hide = () => setSoundHint(false);
    document.addEventListener("pointerdown", hide, { once: true, capture: true });
    return () => {
      window.clearTimeout(show);
      document.removeEventListener("pointerdown", hide, { capture: true });
    };
  }, [entered, soundOn]);

  const opening = entered && chapterIndex === 0 && !footer;

  return (
    <>
      <p
        ref={hint}
        aria-hidden
        className={cn(
          "pointer-events-none fixed z-[160] hidden items-center gap-2.5 rounded-full bg-black/25 px-4 py-2.5 text-[0.8rem] backdrop-blur-md transition-opacity duration-500 ease-out lg:flex",
          fine ? "left-0 top-0 will-change-transform" : "bottom-[112px] left-edge",
          soundHint && !soundOn ? "opacity-100" : "opacity-0"
        )}
        style={fine ? { transform: "translate3d(50px, calc(100vh - 160px), 0)" } : undefined}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
          <path d="M2 5.5h3L9 2v12L5 10.5H2zM11 5a4 4 0 0 1 0 6l-1-1a2.6 2.6 0 0 0 0-4zm2-2a7 7 0 0 1 0 10l-1-1a5.6 5.6 0 0 0 0-8z" />
        </svg>
        Click anywhere to enable the sound
      </p>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-[118px] z-[60] flex flex-col items-center gap-3 transition-opacity duration-500 ease-out lg:bottom-[150px]",
          opening ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="scroll-mouse" />
        <span className="text-[0.85rem] text-fg/50 lg:text-[0.95rem]">Scroll to explore.</span>
      </div>

      {fine && (
        <p
          aria-hidden
          className={cn(
            "pointer-events-none fixed right-edge top-[58vh] z-[60] hidden items-center gap-2 text-[0.8rem] text-fg/50 transition-opacity duration-500 lg:flex",
            opening && !dragged && !world.static ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-signal">⟲</span> Drag to rotate
        </p>
      )}
    </>
  );
};

export default Tutorials;
