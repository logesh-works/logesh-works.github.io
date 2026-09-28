"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";

import { IconArrow } from "@/components/hud/icons";
import SoundToggle from "@/components/hud/SoundToggle";
import { collaborations, experience, moreLinks, profile, socials } from "@/constants";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** Everyone worked with or for, as slider cards (the reference's partners row). */
const cards = [
  ...experience.map((e) => ({ name: e.company, role: e.role, years: `${e.start} — ${e.end}`, place: e.location })),
  ...collaborations.map((c) => ({ name: c.organisation, role: c.role, years: `${c.start} — ${c.end}`, place: "Collaboration" })),
];

/** Footer (docs/design-spec.md §2.6), rising out of the scene at the end of the scroll. */
const HomeFooter = () => {
  const track = useRef<HTMLUListElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  // Custom scrollbar: the thumb mirrors the slider's scroll position and width.
  useEffect(() => {
    const t = track.current;
    const th = thumb.current;
    if (!t || !th) return;
    const sync = () => {
      const ratio = t.clientWidth / t.scrollWidth;
      const max = t.scrollWidth - t.clientWidth;
      const p = max > 0 ? t.scrollLeft / max : 0;
      th.style.width = `${Math.min(ratio, 1) * 100}%`;
      th.style.transform = `translateX(${p * (1 / Math.min(ratio, 1) - 1) * 100}%)`;
    };
    sync();
    t.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      t.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <footer id="site-footer" data-beat="end" data-chapter="contact" className="relative z-[30] px-edge pt-[30vh]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[140%] bg-gradient-to-t from-black from-[35%] to-transparent" />

      <p className="t-eyebrow">07/</p>
      <h2 className="t-h1 mt-6">
        Worked
        <br />
        with
      </h2>

      <ul
        ref={track}
        className="slider -mx-edge mt-8 flex snap-x gap-5 overflow-x-auto px-edge pb-12"
        aria-label="Companies and collaborations"
      >
        {cards.map((c, k) => (
          <li key={c.name} className="group relative w-[235px] shrink-0 snap-start" style={i(k)}>
            <div className="relative flex aspect-[235/202] flex-col justify-between bg-black/30 p-5 transition-colors duration-300 ease-out group-hover:bg-black/50">
              <p className="t-eyebrow !tracking-[0.25em]">{c.years}</p>
              <div>
                <p className="t-h2">{c.name}</p>
                <p className="mt-2 text-[0.72rem] text-fg/50">{c.place}</p>
              </div>
            </div>
            <span className="t-label absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-5 py-3 text-black opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
              {c.role}
            </span>
          </li>
        ))}
      </ul>
      <div aria-hidden className="relative h-px bg-white/10">
        <span ref={thumb} className="absolute left-0 top-[-0.5px] block h-[2px] origin-left bg-signal" />
      </div>

      <div className="mt-16 flex flex-col gap-12 border-b border-white/10 pb-14 lg:flex-row lg:items-start lg:pb-5">
        <blockquote className="lg:w-col-5 lg:shrink-0">
          <p className="t-h2 max-w-sm">{profile.tagline}</p>
          <cite className="mt-3 block text-[0.75rem] not-italic leading-relaxed text-fg/40">
            {profile.name} · {profile.role}
          </cite>
        </blockquote>
        <div className="flex flex-col gap-8 sm:flex-row lg:ml-auto lg:gap-16">
          <p className="t-h2">
            Connect
            <br className="hidden lg:block" /> with me
          </p>
          <ul className="space-y-4">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="tlink text-[0.75rem] text-fg/55 hover:!text-fg">
                  {s.label}
                  <IconArrow />
                </a>
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            <li>
              <a href={`mailto:${profile.email}`} className="tlink text-[0.75rem] text-fg/55 hover:!text-fg">
                Email
                <IconArrow />
              </a>
            </li>
            {moreLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="tlink text-[0.75rem] text-fg/55 hover:!text-fg">
                  {l.label}
                  <IconArrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="t-micro flex flex-col items-center gap-6 pb-[70px] pt-8 text-fg/40 lg:flex-row lg:pb-[65px]">
        <p>© {new Date().getFullYear()} · {profile.name}</p>
        <p className="lg:ml-[calc(var(--col)*2)]">
          {profile.location}
        </p>
        <a href={profile.resume} target="_blank" rel="noopener" className="text-signal transition-colors hover:text-fg lg:ml-auto">
          Resume
        </a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-signal transition-colors hover:text-fg">
          GitHub
        </a>
        <SoundToggle className="lg:ml-6" />
      </div>
    </footer>
  );
};

export default HomeFooter;
