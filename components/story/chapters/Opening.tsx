import type { CSSProperties } from "react";

import { SocialIcon } from "@/components/site";
import { profile, socials } from "@/constants";

import Beat from "../Beat";

const d = (i: number) => ({ "--i": i }) as CSSProperties;
const quick = socials.filter((s) => s.icon === "github" || s.icon === "linkedin");

/**
 * Opening shot. The engineer and his world carry the frame; the copy stays at the
 * edges: the statement on the left, the core stack on the right, location and
 * contact at the base. Everything rises in after the loader.
 */
const Opening = () => (
  <section id="top" data-chapter="top" aria-labelledby="hero-title">
    <Beat id="hero" side="left" frame="center" className="!items-stretch !pb-0 !pt-0" innerClassName="!max-w-none">
      <div className="relative flex min-h-[100svh] flex-col justify-end pb-28 pt-24 md:justify-center md:pb-24">
        <div className="max-w-[34rem]">
          <h1 id="hero-title" className="hero-block eyebrow !text-[0.7rem] !tracking-[0.22em] text-signal" style={d(0)}>
            {profile.name} <span className="text-muted/70">·</span> {profile.role}
          </h1>
          <p className="mt-5 font-display text-[clamp(2.5rem,5.4vw,5rem)] font-extralight uppercase leading-[0.98] tracking-[0.01em]">
            <span className="hero-word block" style={d(1)}>
              <span className="gilded">Engineering</span>
            </span>
            <span className="hero-word block" style={d(2)}>
              <span className="gilded">products</span>
            </span>
            <span className="hero-word block" style={d(3)}>
              from ideas
            </span>
          </p>
          <p className="hero-block mt-6 max-w-sm text-[0.95rem] leading-relaxed text-fg/75" style={d(4)}>
            {profile.intro}
          </p>
          <div className="hero-block mt-8 flex flex-wrap items-center gap-3" style={d(5)}>
            <a
              href="#experience"
              data-cursor-label="Begin"
              className="group inline-flex items-center gap-4 rounded-full border border-line/25 bg-ink/40 py-1.5 pl-6 pr-1.5 font-display text-[0.72rem] uppercase tracking-[0.2em] backdrop-blur-md transition-colors hover:border-signal/70"
            >
              Explore my work
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-fg/10 text-signal transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </a>
            <a href={profile.resume} target="_blank" rel="noopener" className="hud-pill hud-pill--solid !py-3" data-cursor-label="Resume">
              Resume <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        {/* Core stack, set like instrument readouts on the right edge. */}
        <ul aria-label="Core stack" className="hero-block absolute right-0 top-[24svh] hidden space-y-2.5 lg:block" style={d(4)}>
          {profile.core.map((t) => (
            <li key={t} className="flex items-center gap-2.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-fg/70">
              <span aria-hidden className="h-1 w-1 rounded-full bg-signal" />
              {t}
            </li>
          ))}
        </ul>

        <div className="hero-block absolute inset-x-0 bottom-7 hidden items-center justify-between md:flex" style={d(6)}>
          <p className="flex items-center gap-2.5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg/70">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_10px_rgb(222_164_90)]" />
            {profile.location}
          </p>
          <a href="#about" className="flex flex-col items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted hover:text-fg">
            <span aria-hidden className="scroll-mouse" />
            Scroll to explore
          </a>
          <ul className="flex gap-2" aria-label="Elsewhere">
            {quick.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hud-icon" aria-label={s.label}>
                  <SocialIcon icon={s.icon} className="text-sm" />
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${profile.email}`} className="hud-icon" aria-label="Email">
                <SocialIcon icon="mail" className="text-sm" />
              </a>
            </li>
            <li>
              <a href={profile.resume} target="_blank" rel="noopener" className="hud-icon" aria-label="Resume (PDF)">
                <span aria-hidden className="text-sm">
                  ↗
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </Beat>
  </section>
);

export default Opening;
