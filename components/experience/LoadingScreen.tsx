"use client";

import { useEffect, useRef, useState } from "react";

import { profile } from "@/constants";
import { cn } from "@/lib/utils";

const CAPTION = "Compiling the engineer";
const R = 29;
const C = 2 * Math.PI * R; // 182.212

interface LoadingScreenProps {
  /** Real loading progress 0 → 1 (fonts, stage code, first rendered frames). */
  progress: number;
  onDone: () => void;
}

/**
 * Loader (docs/design-spec.md §3.5): bronze wordmark, progress ring, a caption
 * whose words rise in, then the whole screen slides up out of the way as soon as
 * loading finishes — no extra action needed to enter.
 */
const LoadingScreen = ({ progress, onDone }: LoadingScreenProps) => {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const shownRef = useRef(0);
  const target = useRef(progress);
  target.current = progress;

  // Ease the visible counter toward the real progress; never jump backwards.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const next = shownRef.current + (Math.max(target.current, shownRef.current) - shownRef.current) * 0.06 + 0.0012;
      shownRef.current = Math.min(next, target.current >= 1 ? 1 : Math.min(target.current + 0.04, 0.97));
      setShown(shownRef.current);
      if (shownRef.current < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const ready = shown >= 1;

  useEffect(() => {
    if (ready) setLeaving(true);
  }, [ready]);

  useEffect(() => {
    if (!leaving) return;
    const done = window.setTimeout(onDone, 250);
    const hide = window.setTimeout(() => setGone(true), 1300);
    return () => {
      window.clearTimeout(done);
      window.clearTimeout(hide);
    };
  }, [leaving, onDone]);

  if (gone) return null;
  const pct = Math.round(shown * 100);

  return (
    <div className={cn("loader fixed inset-0 z-[150] flex-col items-center justify-center overflow-hidden", leaving && "is-leaving")}>
      <div aria-hidden className="noise pointer-events-none absolute inset-0" />

      <p aria-hidden className="wide relative px-edge text-center font-display text-[clamp(1.9rem,6vw,4.2rem)] font-semibold uppercase leading-none tracking-[-0.01em] text-signal">
        {profile.name}
      </p>

      <div className="absolute bottom-[30px] left-1/2 flex -translate-x-1/2 flex-col items-center">
        <div className="relative mb-[15px] h-[62px] w-[62px]">
          <svg viewBox="0 0 62 62" className="-rotate-90" aria-hidden>
            <circle cx="31" cy="31" r={R} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="2" />
            <circle cx="31" cy="31" r={R} fill="none" stroke="rgb(var(--accent))" strokeWidth="3" strokeDasharray={C} strokeDashoffset={C * (1 - shown)} />
          </svg>
          <span aria-hidden className="wide absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[0.8125rem] font-extrabold tracking-[-0.02em]">
            {pct}%
          </span>
        </div>
        <p aria-hidden className="semi-wide overflow-hidden text-center text-[0.75rem] leading-[1.5] tracking-[-0.02em] text-fg/50">
          {CAPTION.split(" ").map((w, k) => (
            <span key={w} className="loader-word mr-[0.25em]" style={{ ["--i" as string]: k }}>
              {w}
            </span>
          ))}
        </p>
        <p role="status" className="sr-only">
          {pct < 100 ? `Loading, ${pct} percent` : "Loaded"}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
