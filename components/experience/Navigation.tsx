"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { chapters, moreLinks, profile, socials } from "@/constants";
import { useWorld } from "@/lib/useWorld";
import { cn } from "@/lib/utils";

import SoundController from "./SoundController";

/** Chapters worth a top-level link (the opening and systems are reached by scrolling). */
const LINKS = ["experience", "open-source", "about", "contact"];

/**
 * Minimal HUD: wordmark, a few chapter links and sound on top; a chapter rail on
 * the right; a CLI-style status line at the bottom; a full-screen menu on small screens.
 */
const Navigation = () => {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { chapterIndex } = useWorld("chapter");
  const [open, setOpen] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    document.documentElement.dataset.menu = "open";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burger.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.documentElement.dataset.menu;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const chapter = chapters[chapterIndex] ?? chapters[0];
  const current = onHome ? chapter.id : null;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[60]">
        <nav aria-label="Primary" className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="pointer-events-auto font-display text-[0.82rem] font-normal uppercase tracking-[0.32em] text-fg"
          >
            Logesh Kumar
          </Link>

          <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
            <ul className="mr-2 hidden items-center gap-7 lg:flex">
              {chapters
                .filter((c) => LINKS.includes(c.id))
                .map((c) => (
                  <li key={c.id}>
                    <a
                      href={href(c.id)}
                      aria-current={current === c.id ? "true" : undefined}
                      className={cn(
                        "font-display text-[0.7rem] uppercase tracking-[0.22em] transition-colors duration-300",
                        current === c.id ? "text-signal" : "text-fg/75 hover:text-fg"
                      )}
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
            </ul>
            <a href={profile.resume} target="_blank" rel="noopener" className="hud-pill hidden sm:inline-flex">
              Resume <span aria-hidden>↗</span>
            </a>
            <SoundController />
            <button
              ref={burger}
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              data-cursor-label={open ? "Close" : "Menu"}
              onClick={() => setOpen((o) => !o)}
              className="hud-icon !h-12 !w-12 lg:hidden"
            >
              <span aria-hidden className="relative block h-2.5 w-5">
                <span className={cn("absolute left-0 top-0 h-[1.5px] w-5 bg-fg transition-transform duration-500 ease-out", open && "translate-y-[4.5px] rotate-45")} />
                <span className={cn("absolute bottom-0 left-0 h-[1.5px] w-5 bg-fg transition-transform duration-500 ease-out", open && "-translate-y-[4.5px] -rotate-45")} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {onHome && (
        <>
          {/* Chapter rail: where you are in the journey. */}
          <nav aria-label="Chapters" className={cn("pointer-events-none fixed right-5 top-1/2 z-[60] hidden -translate-y-1/2 transition-opacity duration-700 lg:block xl:right-8", chapterIndex === 0 && "opacity-0")}>
            <ol className="pointer-events-auto flex flex-col items-end gap-3">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="group flex items-center gap-3" aria-current={i === chapterIndex ? "step" : undefined}>
                    <span
                      className={cn(
                        "font-mono text-[0.58rem] uppercase tracking-[0.2em] transition-all duration-500",
                        i === chapterIndex ? "text-signal opacity-100" : "translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      )}
                    >
                      {c.label}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "block rounded-full transition-all duration-500",
                        i === chapterIndex ? "h-2.5 w-2.5 border border-signal bg-signal/30" : "h-1.5 w-1.5 bg-fg/30 group-hover:bg-fg/70"
                      )}
                    />
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Status line, in the spirit of a coding agent's CLI. */}
          <p
            aria-live="polite"
            className={cn(
              "pointer-events-none fixed bottom-4 left-4 z-[60] flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted transition-opacity duration-700 sm:bottom-6 sm:left-8 lg:left-12",
              chapterIndex === 0 ? "opacity-0 md:opacity-0" : "opacity-100"
            )}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
            <span className="text-fg/80">main</span>
            <span aria-hidden>·</span>
            <span>
              <span className="text-fg">{String(chapterIndex + 1).padStart(2, "0")}</span>/{String(chapters.length).padStart(2, "0")}
            </span>
            <span aria-hidden>·</span>
            <span>{chapter.label}</span>
          </p>
        </>
      )}

      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className="menu fixed inset-0 z-[55] overflow-y-auto bg-ink/95 backdrop-blur-xl"
      >
        <div className="flex min-h-full flex-col justify-between px-4 pb-24 pt-24 sm:px-8 lg:flex-row lg:items-end lg:gap-16 lg:pb-16">
          <ol className="flex-1">
            {chapters.map((c, i) => (
              <li key={c.id} className="menu-item" style={{ ["--i" as string]: i }}>
                <a
                  ref={i === 0 ? firstLink : undefined}
                  href={href(c.id)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-baseline gap-4 py-3 font-display text-[clamp(1.6rem,4.6vw,3.2rem)] font-extralight uppercase leading-none tracking-[0.04em] transition-colors sm:py-4",
                    current === c.id ? "text-signal" : "hover:text-signal"
                  )}
                >
                  <span className="w-10 shrink-0 font-mono text-[0.7rem] font-normal text-muted">{String(i + 1).padStart(2, "0")}/</span>
                  {c.label}
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-0 lg:w-80 lg:grid-cols-1">
            <ul className="space-y-2 text-sm">
              {moreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="link-underline text-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={profile.resume} target="_blank" rel="noopener" className="link-underline text-muted hover:text-fg">
                  Resume ↗
                </a>
              </li>
            </ul>
            <ul className="space-y-2 text-sm">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-underline text-muted hover:text-fg">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
