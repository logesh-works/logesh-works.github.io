"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { collaborations, education, experience, focusAreas, origins, profile, skillLayers, toolbelt } from "@/constants";
import portrait from "@/public/images/me-sidelook.jpeg";
import { setPanel } from "@/lib/world";

import { IconClose, IconTimeline, IconUser } from "./icons";
import Overlay from "./Overlay";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

const PanelHeader = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="sticky top-0 z-10 flex items-center justify-between bg-panel/90 px-edge py-5 backdrop-blur lg:px-12 lg:py-8">
    <h2 className="flex items-center gap-3 t-h2">
      <span className="text-signal">{icon}</span>
      {title}
    </h2>
    <button type="button" onClick={() => setPanel(null)} className="round" aria-label={`Close ${title.toLowerCase()}`}>
      <IconClose className="h-3 w-3" />
    </button>
  </div>
);

const Phase = ({ eyebrow, title, sub, children, k }: { eyebrow: string; title: string; sub?: string; children: ReactNode; k: number }) => (
  <section className="relative pb-14 pl-10 lg:pl-14" style={i(k)}>
    <span aria-hidden className="timeline-dot" />
    <p className="t-eyebrow !text-signal">{eyebrow}</p>
    <h3 className="t-h1 mt-4">{title}</h3>
    {sub && <p className="mt-2 text-sm text-fg/80">{sub}</p>}
    <div className="mt-6 space-y-5">{children}</div>
  </section>
);

const Item = ({ title, children }: { title?: string; children: ReactNode }) => (
  <div className="relative pl-6">
    <span aria-hidden className="timeline-item-dot !-left-[37px] lg:!-left-[53px]" />
    {title && <h4 className="t-label mb-2">{title}</h4>}
    <div className="t-body max-w-2xl">{children}</div>
  </div>
);

/** Career timeline (the reference's roadmap modal, docs/design-spec.md §2.8). */
export const TimelinePanel = () => {
  const [cyces, ...earlier] = experience;

  return (
    <Overlay id="timeline" label="Career timeline">
      <PanelHeader icon={<IconTimeline className="h-4 w-4" />} title="Timeline" />
      <div className="timeline mx-edge mt-6 max-w-4xl lg:mx-12">
        <Phase k={0} eyebrow={`${cyces.start} — ${cyces.end} · ${cyces.location}`} title={cyces.company} sub={cyces.role}>
          {cyces.highlights.map((h) => (
            <Item key={h}>{h}</Item>
          ))}
        </Phase>

        {earlier.map((job, k) => (
          <Phase key={job.company} k={k + 1} eyebrow={`${job.start} — ${job.end} · ${job.location}`} title={job.company} sub={job.role}>
            {job.highlights.map((h) => (
              <Item key={h}>{h}</Item>
            ))}
          </Phase>
        ))}

        <Phase k={earlier.length + 1} eyebrow="Collaborations" title="Worked with">
          {collaborations.map((c) => (
            <Item key={c.organisation} title={`${c.organisation} · ${c.start}–${c.end}`}>
              <span className="text-fg/70">{c.role}.</span> {c.description}
            </Item>
          ))}
        </Phase>

        <Phase k={earlier.length + 2} eyebrow="Education" title="Education">
          {education.map((e) => (
            <Item key={e.degree} title={`${e.degree} · ${e.score}`}>
              {e.institute} · {e.start} – {e.end}
            </Item>
          ))}
        </Phase>
      </div>
    </Overlay>
  );
};

/** Full profile: summary, focus, stack by architecture layer, origins. */
export const ProfilePanel = () => (
  <Overlay id="profile" label="Full profile">
    <PanelHeader icon={<IconUser className="h-4 w-4" />} title="Profile" />
    <div className="mx-edge mt-4 max-w-5xl pb-16 lg:mx-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Image src={portrait} alt="Portrait of Logesh Kumar" placeholder="blur" sizes="112px" className="h-28 w-28 rounded-full object-cover" />
        <div>
          <p className="t-h1">{profile.name}</p>
          <p className="t-eyebrow mt-3">
            {profile.role} · {profile.location}
          </p>
        </div>
      </div>
      <p className="mt-8 max-w-3xl text-[0.95rem] leading-relaxed text-fg/80">{profile.summary}</p>

      <h3 className="t-eyebrow mt-14">Focus</h3>
      <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {focusAreas.map((f, k) => (
          <li key={f.title}>
            <p className="t-eyebrow !text-signal">{String(k + 1).padStart(2, "0")}/</p>
            <h4 className="t-label mt-3">{f.title}</h4>
            <p className="t-body mt-2">{f.body}</p>
          </li>
        ))}
      </ul>

      <h3 id="profile-stack" className="t-eyebrow mt-14">
        Stack, by architecture layer
      </h3>
      <ol className="mt-5 divide-y divide-line/10 border-y border-line/10">
        {skillLayers.map((l, k) => (
          <li key={l.id} className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <p className="t-label">
              <span className="text-signal">{String(k + 1).padStart(2, "0")}</span> {l.layer}
              <span className="semi-wide mt-1.5 block text-[0.75rem] font-normal normal-case text-fg/60">{l.role}</span>
            </p>
            <p className="t-body">{l.tech.join(" · ")}</p>
          </li>
        ))}
      </ol>
      <dl className="mt-6 space-y-2">
        {Object.entries(toolbelt).map(([k, items]) => (
          <div key={k} className="flex gap-4">
            <dt className="t-label w-24 shrink-0 pt-1 text-fg/60">{k}</dt>
            <dd className="t-body">{items.join(" · ")}</dd>
          </div>
        ))}
      </dl>

      <h3 className="t-eyebrow mt-14">Origins</h3>
      <ul className="mt-5 space-y-2">
        {origins.map((o) => (
          <li key={o} className="flex gap-3 text-sm text-fg/75">
            <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-signal" />
            {o}
          </li>
        ))}
      </ul>
    </div>
  </Overlay>
);
