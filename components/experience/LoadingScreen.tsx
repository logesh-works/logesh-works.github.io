"use client";

import { useEffect, useRef, useState } from "react";

import { profile } from "@/constants";
import { cn } from "@/lib/utils";

/** Boot log shown while the world loads; each line completes as progress passes it. */
const BOOT = [
  { at: 0.12, text: "resolving dependencies" },
  { at: 0.3, text: "loading fonts" },
  { at: 0.55, text: "mounting the world" },
  { at: 0.75, text: "compiling shaders" },
  { at: 0.9, text: "waking the engineer" },
  { at: 1, text: "ready" },
];

interface LoadingScreenProps {
  /** Real loading progress 0 → 1 (fonts, world code, first rendered frames). */
  progress: number;
  /** Wait for an explicit "enter" (which also starts the music) instead of leaving automatically. */
  gate: boolean;
  onDone: () => void;
}

/**
 * Initialisation screen: wordmark, a progress ring driven by real loading steps and
 * a short terminal boot log. Leaves with an upward wipe once everything is ready.
 */
const LoadingScreen = ({ progress, gate, onDone }: LoadingScreenProps) => {
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
  const enterRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ready && !gate) setLeaving(true);
    if (ready && gate) enterRef.current?.focus();
  }, [ready, gate]);

  useEffect(() => {
    if (!leaving) return;
    const done = window.setTimeout(onDone, 350);
    const hide = window.setTimeout(() => setGone(true), 1300);
    return () => {
      window.clearTimeout(done);
      window.clearTimeout(hide);
    };
  }, [leaving, onDone]);

  if (gone) return null;
  const pct = Math.round(shown * 100);
  const R = 26;
  const C = 2 * Math.PI * R;
  const visible = BOOT.filter((_, i) => i === 0 || shown >= BOOT[i - 1].at);

  return (
    <div className={cn("loader fixed inset-0 z-[150] flex-col items-center justify-center bg-ink", leaving && "is-leaving")}>
      {profile.enterArt && (
        // eslint-disable-next-line @next/next/no-img-element -- full-bleed key art, shown only on this screen
        <img src={profile.enterArt} alt="" className="loader-art pointer-events-none absolute inset-0 h-full w-full object-cover object-top" />
      )}
      <div aria-hidden className="loader-vignette pointer-events-none absolute inset-0" />
      <div aria-hidden className="loader-mark flex flex-col items-center">
        <p className="font-display text-[clamp(1.5rem,3.6vw,2.4rem)] font-extralight uppercase tracking-[0.34em]">
          <span className="gilded">Logesh</span> Kumar
        </p>
        <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-muted">Software Development Engineer</p>
      </div>
      {gate && (
        <div className={cn("loader-gate absolute bottom-[9vh] flex flex-col items-center gap-4 transition-all duration-700", ready ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0")}>
          <div className="flex items-center gap-4 font-display text-[0.72rem] uppercase tracking-[0.24em] text-fg/80">
            <span aria-hidden>Press</span>
            <button
              ref={enterRef}
              type="button"
              disabled={!ready}
              onClick={() => setLeaving(true)}
              data-cursor-label="Enter"
              className="rounded-full border border-signal/60 bg-ink/70 px-9 py-4 font-display text-[0.8rem] font-normal uppercase tracking-[0.24em] text-signal shadow-[0_0_30px_rgb(222_164_90/0.18)] backdrop-blur transition-colors hover:bg-signal hover:text-ink"
            >
              <span className="sr-only">Enter the experience as </span>
              {profile.name}
            </button>
            <span aria-hidden>to enter</span>
          </div>
          <button
            type="button"
            data-sound-choice="off"
            disabled={!ready}
            onClick={() => setLeaving(true)}
            className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Enter without sound
          </button>
        </div>
      )}
      <div className={cn("loader-meta absolute bottom-[10vh] flex w-[min(22rem,80vw)] flex-col items-center gap-5 transition-opacity duration-500", gate && ready && "pointer-events-none opacity-0")}>
        <div className="relative grid h-16 w-16 place-items-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgb(239 233 225 / 0.12)" strokeWidth="1.5" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="#dea45a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - shown)}
            />
          </svg>
          <span className="font-mono text-[0.7rem] text-fg" aria-hidden>
            {pct}%
          </span>
        </div>
        <div aria-hidden className="h-[4.2rem] w-full overflow-hidden font-mono text-[0.64rem] leading-[1.4rem] text-muted">
          <ol
            style={{ transform: `translateY(${-Math.max(0, visible.length - 3) * 1.4}rem)`, transition: "transform .4s ease" }}
          >
            {visible.map((l) => {
              const done = shown >= l.at;
              return (
                <li key={l.text} className="flex justify-between gap-4">
                  <span>
                    <span className="text-signal">›</span> {l.text}
                  </span>
                  <span className={done ? "text-fg/80" : "text-muted/60"}>{done ? "done" : "…"}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p role="status" className="sr-only">
          {pct < 100 ? `Loading the experience, ${pct} percent` : "Loaded"}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
