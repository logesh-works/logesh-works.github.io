"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { chapters, moreLinks, profile, socials } from "@/constants";
import { useWorld } from "@/lib/useWorld";
import { setPanel } from "@/lib/world";
import { cn } from "@/lib/utils";

import { IconArrow, IconClose, IconDoc } from "./icons";
import Overlay from "./Overlay";
import Pill from "./Pill";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** Full-screen menu (docs/design-spec.md §2.7). */
const SiteMenu = () => {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { chapterIndex } = useWorld("chapter");
  const close = () => setPanel(null);
  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <Overlay id="menu" label="Site menu">
      <div className="flex min-h-[100svh] flex-col px-edge pb-10 lg:min-h-[calc(100svh-100px)]">
        <div className="flex h-[92px] items-center justify-between lg:h-[112px]">
          <Link href="/" onClick={close} className="wide font-display text-[0.8rem] font-semibold uppercase tracking-[0.2em]">
            {profile.name}
          </Link>
          <Pill label="Close" icon={<IconClose />} onClick={close} className="-mr-2.5" />
        </div>

        <div className="flex flex-1 flex-col gap-12 pt-4 lg:flex-row lg:items-start lg:gap-8">
          <nav aria-label="Chapters" className="lg:flex-1">
            <ol className="t-menu">
              {chapters.map((c, k) => (
                <li key={c.id} className="stagger" style={i(k)}>
                  <span>
                    <a
                      href={href(c.id)}
                      onClick={close}
                      aria-current={onHome && k === chapterIndex ? "true" : undefined}
                      className={cn(
                        "inline-block py-[5px] transition-colors duration-300 ease-out hover:text-signal",
                        onHome && k === chapterIndex && "text-signal"
                      )}
                    >
                      {c.label}
                      <small className="t-eyebrow ml-2 inline-block align-top text-signal lg:mt-2">
                        {String(k + 1).padStart(2, "0")}/
                      </small>
                    </a>
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid gap-10 sm:grid-cols-2 lg:w-col-4 lg:grid-cols-1 lg:pt-3">
            <ul className="t-label space-y-6 text-fg/50">
              {socials.map((s, k) => (
                <li key={s.label} className="stagger" style={i(k + 1)}>
                  <span>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="tlink hover:text-fg">
                      {s.label}
                      <IconArrow />
                    </a>
                  </span>
                </li>
              ))}
            </ul>
            <ul className="t-label space-y-6 text-fg/50">
              {moreLinks.map((l, k) => (
                <li key={l.href} className="stagger" style={i(k + 2)}>
                  <span>
                    <Link href={l.href} onClick={close} className="tlink hover:text-fg">
                      {l.label}
                      <IconArrow />
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative mt-12 pt-6">
          <span aria-hidden className="rule absolute inset-x-0 top-0 h-px bg-black" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Pill label="Resume" icon={<IconDoc />} href={profile.resume} external />
            <p className="t-micro text-signal">
              {profile.role} · {profile.location}
            </p>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default SiteMenu;
