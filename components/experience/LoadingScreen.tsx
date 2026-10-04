"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";

import { profile } from "@/constants";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  /** Real loading progress 0 → 1 (fonts, stage code, first rendered frames). */
  progress: number;
  onDone: () => void;
}

/**
 * Loader: the name resolving letter by letter on black, with a hairline of progress
 * beneath it. When loading finishes it closes like a cinema shutter onto the world
 * behind it; no extra action needed to enter.
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
    if (!ready) return;
    // A beat at 100% before the shutter closes.
    const t = window.setTimeout(() => setLeaving(true), 350);
    return () => window.clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!leaving) return;
    const done = window.setTimeout(onDone, 300);
    const hide = window.setTimeout(() => setGone(true), 1400);
    return () => {
      window.clearTimeout(done);
      window.clearTimeout(hide);
    };
  }, [leaving, onDone]);

  if (gone) return null;
  const pct = Math.round(shown * 100);
  const words = profile.name.toUpperCase().split(" ");
  const announced = Math.floor(pct / 25) * 25;

  return (
    <div className={cn("loader fixed inset-0 z-[150] flex-col items-center justify-center overflow-hidden", leaving && "is-leaving")}>
      <div aria-hidden className="noise pointer-events-none absolute inset-0" />

      <div aria-hidden className="relative flex flex-col items-center px-edge">
        <p className="loader-name wide text-center font-display text-[clamp(2rem,6vw,4.6rem)] font-semibold uppercase leading-none tracking-[0.04em]">
          {words.map((word, w) => {
            const start = words.slice(0, w).reduce((n, x) => n + x.length + 1, 0);
            return (
              <Fragment key={w}>
                {w > 0 && " "}
                <span className="inline-block whitespace-nowrap">
                  {word.split("").map((ch, k) => (
                    <span key={k} className="loader-letter" style={{ "--i": start + k } as CSSProperties}>
                      {ch}
                    </span>
                  ))}
                </span>
              </Fragment>
            );
          })}
        </p>
        {/* A hairline of progress the width of the name, and the count beside it. */}
        <div className="loader-bar mt-8 flex w-full items-center gap-4">
          <div className="relative h-px flex-1 bg-white/10">
            <span className="absolute inset-y-0 left-0 w-full origin-left bg-signal" style={{ transform: `scaleX(${shown})` }} />
          </div>
          <span className="w-[3ch] text-right font-display text-[0.75rem] tabular-nums text-fg/50">{pct}</span>
        </div>
      </div>

      <p role="status" className="sr-only">
        {pct < 100 ? `Loading, ${announced} percent` : "Loaded"}
      </p>
    </div>
  );
};

export default LoadingScreen;
