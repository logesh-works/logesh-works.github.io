"use client";

import Image from "next/image";
import { useEffect, type CSSProperties, type ReactNode } from "react";

import CopyCommand from "@/components/hud/CopyCommand";
import { IconArrow, IconDoc, IconTimeline, IconUser } from "@/components/hud/icons";
import Pill from "@/components/hud/Pill";
import { SocialIcon } from "@/components/site";
import { award, experience, postmanMcp, profile, skillLayers, socials } from "@/constants";
import portrait from "@/public/images/me-sidelook.jpeg";
import { useWorld } from "@/lib/useWorld";
import { emit, nav, setPanel, world } from "@/lib/world";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

interface BlockProps {
  id: string;
  index: number;
  side: "left" | "right";
  eyebrow?: string;
  title: ReactNode[];
  children: ReactNode;
  active: boolean;
}

/**
 * One fixed text block (docs/design-spec.md §2.4). Every block stays in the DOM so
 * screen readers and search engines get the whole story; only the active one is
 * visible. Tabbing into a hidden block scrolls the camera to it.
 */
const Block = ({ id, index, side, eyebrow, title, children, active }: BlockProps) => (
  <section
    aria-labelledby={`${id}-title`}
    className="cblock"
    data-side={side}
    data-active={active ? "" : undefined}
    data-block={id}
    onFocusCapture={() => !active && nav.toBeat(id)}
  >
    <p className="t-eyebrow fade" style={i(0)}>
      {String(index).padStart(2, "0")}/{eyebrow && <span className="ml-3 !tracking-[0.3em]">{eyebrow}</span>}
    </p>
    <h2 id={`${id}-title`} className="block-title t-h1 mt-6 lg:mt-[30px]">
      {title.map((t, k) => (
        <span key={k} className="line" style={i(k)}>
          {t}
        </span>
      ))}
    </h2>
    <div className="block-body t-body mt-3 lg:mt-[15px]">{children}</div>
  </section>
);

const Blocks = () => {
  const { chapter, footer } = useWorld("chapter", "footer");
  const [cyces] = experience;

  // The footer takes over the screen: fixed blocks and the toolbar step aside.
  useEffect(() => {
    const el = document.getElementById("site-footer");
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = entry.isIntersecting;
        if (v === world.footer) return;
        world.footer = v;
        if (v) document.documentElement.dataset.footer = "";
        else delete document.documentElement.dataset.footer;
        emit("footer");
      },
      { rootMargin: "0px 0px -35% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const is = (id: string) => chapter === id && !footer;

  return (
    <div className="blocks">
      <div aria-hidden className="block-scrim" data-on={chapter !== "top" && !footer ? "" : undefined} />

      <Block id="about" index={1} side="right" eyebrow="About" active={is("about")} title={["I build the", "systems behind", <b key="b">the product.</b>]}>
        <p className="fade max-w-[34rem]" style={i(1)}>
          {profile.statement}
        </p>
        <div className="fade mt-5 flex items-center gap-3" style={i(2)}>
          <Image src={portrait} alt="Portrait of Logesh Kumar" placeholder="blur" sizes="44px" className="h-11 w-11 rounded-full object-cover" />
          <p className="text-[0.75rem] leading-snug text-fg/80">
            {profile.name}
            <span className="block text-fg/45">{profile.location}</span>
          </p>
        </div>
        <div className="fade mt-6" style={i(3)}>
          <Pill label="Full profile" icon={<IconUser />} onClick={() => setPanel("profile")} />
        </div>
      </Block>

      <Block id="stack" index={2} side="left" eyebrow="Systems" active={is("stack")} title={["Skills, arranged", <span key="s">like <b>systems.</b></span>]}>
        <p className="fade" style={i(1)}>
          Grouped by the layer of an architecture each one lives in.
        </p>
        <ol className="fade mt-4 hidden space-y-1.5 lg:block" style={i(2)}>
          {skillLayers.map((l, k) => (
            <li key={l.id} className="flex gap-3 text-[0.78rem] leading-snug">
              <span className="t-label w-[5.5rem] shrink-0 pt-0.5 text-fg">
                <span className="text-signal">{String(k + 1).padStart(2, "0")}</span> {l.layer}
              </span>
              <span className="text-fg/55">{l.tech.slice(0, 5).join(" · ")}</span>
            </li>
          ))}
        </ol>
        <ul className="fade mt-4 flex flex-wrap gap-1.5 lg:hidden" style={i(2)}>
          {skillLayers.map((l) => (
            <li key={l.id} className="chip">
              {l.role}
            </li>
          ))}
        </ul>
        <div className="fade mt-6" style={i(3)}>
          <Pill label="Full stack" icon={<IconArrow />} onClick={() => setPanel("profile")} />
        </div>
      </Block>

      <Block
        id="experience"
        index={3}
        side="right"
        eyebrow={`${cyces.start} — ${cyces.end}`}
        active={is("experience")}
        title={["Cyces", <b key="b">Innovation Labs</b>]}
      >
        <p className="fade text-fg" style={i(1)}>
          {cyces.role} · {cyces.location}
        </p>
        <p className="fade mt-2 max-w-[32rem]" style={i(2)}>
          {cyces.highlights[0]}
        </p>
        <div className="fade mt-6" style={i(3)}>
          <Pill label="View timeline" icon={<IconTimeline />} onClick={() => setPanel("timeline")} />
        </div>
      </Block>

      <Block id="open-source" index={4} side="left" eyebrow="Open source" active={is("open-source")} title={["Postman", <b key="b">MCP</b>]}>
        <p className="fade max-w-[30rem]" style={i(1)}>
          {postmanMcp.summary}
        </p>
        <p className="fade mt-3 hidden text-[0.72rem] text-fg/60 sm:block" style={i(2)}>
          {postmanMcp.stages.map((s) => s.label).join("  →  ")}
        </p>
        <div className="fade mt-4 max-w-[22rem]" style={i(3)}>
          <CopyCommand command={postmanMcp.install} />
        </div>
        <div className="fade mt-4 flex flex-wrap items-center gap-2.5" style={i(4)}>
          <Pill label="GitHub" icon={<IconArrow />} href={postmanMcp.links.github} external ariaLabel="Postman MCP on GitHub" />
          <Pill label="PyPI" icon={<IconArrow />} href={postmanMcp.links.pypi} external ariaLabel="Postman MCP on PyPI" />
          <a href={postmanMcp.links.docs} target="_blank" rel="noopener noreferrer" className="t-label tlink ml-2 text-fg">
            Docs
            <IconArrow />
          </a>
        </div>
      </Block>

      <Block id="research" index={5} side="right" eyebrow={award.event} active={is("research")} title={["Best paper", <b key="b">award</b>]}>
        <p className="fade max-w-[30rem] text-[0.95rem] text-fg/80 lg:text-[1.05rem]" style={i(1)}>
          &ldquo;{award.paper}&rdquo;
        </p>
        <p className="fade mt-3" style={i(2)}>
          {award.event}
        </p>
      </Block>

      <Block id="contact" index={6} side="left" eyebrow="Contact" active={is("contact")} title={["Have a system", <b key="b">to build?</b>]}>
        <a href={`mailto:${profile.email}`} className="fade t-h2 link-underline mt-2 inline-block break-all !normal-case !tracking-normal text-fg" style={i(1)}>
          {profile.email}
        </a>
        <p className="fade mt-2" style={i(2)}>
          <a href={profile.phoneHref} className="link-underline hover:text-fg">
            {profile.phone}
          </a>{" "}
          · {profile.location}
        </p>
        <ul className="fade mt-4 flex flex-wrap gap-4" style={i(3)}>
          {socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="t-label tlink text-fg">
                <SocialIcon icon={s.icon} className="text-sm text-signal" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="fade mt-6" style={i(4)}>
          <Pill label="Download resume" icon={<IconDoc />} href={profile.resume} external solid />
        </div>
      </Block>
    </div>
  );
};

export default Blocks;
