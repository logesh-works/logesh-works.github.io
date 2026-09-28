"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { profile } from "@/constants";
import { useWorld } from "@/lib/useWorld";
import { setPanel } from "@/lib/world";
import { cn } from "@/lib/utils";

import { Burger, IconArrow, IconDoc } from "./icons";
import Pill from "./Pill";

/**
 * Top frame (docs/design-spec.md §2.2). In the opening shot: Resume pill left, role
 * label centre, GitHub pill + burger right. Once the visitor scrolls on (and on
 * every other page) it settles to the wordmark and the burger.
 */
const Header = () => {
  const pathname = usePathname();
  const { chapterIndex, panel } = useWorld("chapter", "panel");
  const opening = pathname === "/" && chapterIndex === 0;
  const menuOpen = panel === "menu";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[80]">
      <nav aria-label="Primary" className="flex items-center px-edge pt-[30px] lg:pt-10">
        <div className="relative flex h-10 items-center lg:h-[52px]">
          <div className={cn("transition-opacity duration-500 ease-out", opening ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}>
            <Pill label="Resume" icon={<IconDoc />} href={profile.resume} external delay={0.1} className="hud-in" />
          </div>
          <Link
            href="/"
            aria-hidden={opening}
            tabIndex={opening ? -1 : 0}
            className={cn(
              "wide absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[0.78rem] font-semibold uppercase tracking-[0.2em] transition-opacity duration-500 ease-out",
              opening ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
            )}
          >
            {profile.name}
          </Link>
        </div>

        <div
          className={cn(
            "ml-[calc(var(--col)*5+var(--gutter)*5-184px)] hidden transition-opacity duration-500 lg:block",
            opening ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!opening}
        >
          <p className="t-h3 hud-in !font-semibold" style={{ "--d": "0.3s" } as CSSProperties}>
            {profile.role}
          </p>
        </div>

        <div className="pointer-events-auto ml-auto flex items-center gap-4 lg:gap-6">
          <div className={cn("hidden transition-opacity duration-500 ease-out sm:block", opening ? "opacity-100" : "pointer-events-none opacity-0")}>
            <Pill label="GitHub" icon={<IconArrow />} href={profile.github} external delay={0.2} ariaLabel="GitHub (opens in a new tab)" />
          </div>
          <button
            type="button"
            onClick={() => setPanel(menuOpen ? null : "menu")}
            aria-expanded={menuOpen}
            aria-controls="overlay-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="round !h-10 !w-10 lg:!h-[52px] lg:!w-[52px]"
            style={{ "--d": "0.25s" } as CSSProperties}
          >
            <Burger open={menuOpen} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
