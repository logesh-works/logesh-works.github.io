"use client";

import Link from "next/link";

import { IconArrow } from "@/components/hud/icons";
import SoundToggle from "@/components/hud/SoundToggle";
import { moreLinks, profile, socials } from "@/constants";

/** Footer (docs/design-spec.md §2.6), rising out of the scene at the end of the scroll. */
const HomeFooter = () => (
  <footer
    id="site-footer"
    data-beat="end"
    data-chapter="contact"
    className="relative z-[30] px-edge pt-[30vh]"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[140%] bg-gradient-to-t from-black from-[35%] to-transparent"
    />

    <div className="flex flex-col gap-12 border-b border-white/10 pb-14 lg:flex-row lg:items-start lg:pb-5">
      <blockquote className="lg:w-col-5 lg:shrink-0">
        <p className="t-h2 max-w-sm">{profile.tagline}</p>
        <cite className="mt-3 block text-[0.75rem] not-italic leading-relaxed text-fg/60">
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
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="tlink text-[0.75rem] text-fg/55 hover:!text-fg"
              >
                {s.label}
                <IconArrow />
              </a>
            </li>
          ))}
        </ul>
        <ul className="space-y-4">
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="tlink text-[0.75rem] text-fg/55 hover:!text-fg"
            >
              Email
              <IconArrow />
            </a>
          </li>
          {moreLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="tlink text-[0.75rem] text-fg/55 hover:!text-fg"
              >
                {l.label}
                <IconArrow />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="t-micro flex flex-col items-center gap-6 pb-[70px] pt-8 text-fg/60 lg:flex-row lg:pb-[65px]">
      <p>
        © {new Date().getFullYear()} · {profile.name}
      </p>
      <p className="lg:ml-[calc(var(--col)*2)]">{profile.location}</p>
      <a
        href={profile.github}
        target="_blank"
        rel="noopener noreferrer"
        className="text-signal transition-colors hover:text-fg lg:ml-auto"
      >
        GitHub
      </a>
      <SoundToggle className="lg:ml-6" />
    </div>
  </footer>
);

export default HomeFooter;
