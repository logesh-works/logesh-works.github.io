import type { CSSProperties } from "react";

import { collaborations, experience } from "@/constants";
import type { ExperienceItem } from "@/interfaces";

import Beat from "../Beat";
import FlowSteps from "../FlowSteps";
import Heading from "../Heading";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

const Dates = ({ job }: { job: ExperienceItem }) => (
  <p className="font-mono text-[0.7rem] text-muted">
    {job.start} — <span className={job.end === "Present" ? "text-signal" : "text-fg/80"}>{job.end}</span> · {job.location}
  </p>
);

const Highlights = ({ items, start = 3 }: { items: string[]; start?: number }) => (
  <ul className="space-y-2.5">
    {items.map((h, k) => (
      <li key={h} className="rv flex gap-3 text-[0.9rem] leading-relaxed text-fg/80" style={i(start + k)}>
        <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-signal/70" />
        {h}
      </li>
    ))}
  </ul>
);

const Experience = () => {
  const [cyces, freelance, educator] = experience;
  const engagements = cyces.engagements ?? [];
  const [sync, events] = engagements.filter((e) => e.flow);
  const others = engagements.filter((e) => !e.flow);

  return (
    <section id="experience" data-chapter="experience" aria-labelledby="experience-title">
      <Beat id="exp-cyces" side="left">
        <Heading index="03" eyebrow="Experience" id="experience-title" lines={["Cyces", "Innovation Labs"]} />
        <p className="rv mt-4 text-lg" style={i(3)}>
          {cyces.role}
        </p>
        <div className="rv mt-1" style={i(3)}>
          <Dates job={cyces} />
        </div>
        <div className="mt-6">
          <Highlights items={cyces.highlights} start={4} />
        </div>
      </Beat>

      {sync?.flow && (
        <Beat id="exp-sync" side="right">
          <p className="rv eyebrow mb-3">Pattern · Cyces Innovation Labs</p>
          <Heading as="h3" lines={[sync.name]} size="md" />
          <p className="rv mt-3 text-[0.95rem] text-fg/80" style={i(2)}>
            {sync.flow.caption}.
          </p>
          <div className="rv mt-5" style={i(3)}>
            <FlowSteps flow={sync.flow} />
          </div>
        </Beat>
      )}

      {events?.flow && (
        <Beat id="exp-events" side="left">
          <p className="rv eyebrow mb-3">Pattern · Cyces Innovation Labs</p>
          <Heading as="h3" lines={[events.name]} size="md" />
          <p className="rv mt-3 text-[0.95rem] text-fg/80" style={i(2)}>
            {events.flow.caption}.
          </p>
          <div className="rv mt-5" style={i(3)}>
            <FlowSteps flow={events.flow} />
          </div>
          <p className="rv mt-6 max-w-md font-mono text-[0.66rem] leading-relaxed text-muted" style={i(4)}>
            Client work is confidential: shown here as the architecture built, without client names, screens or data. Happy to go deeper in conversation.
          </p>
        </Beat>
      )}

      <Beat id="exp-more" side="right">
        <p className="rv eyebrow mb-3">Also at Cyces</p>
        <ul className="rv flex flex-wrap gap-2" style={i(1)}>
          {others.map((e) => (
            <li key={e.name} className="hud-pill cursor-default">
              {e.name}
              {e.context && <span className="text-muted">· {e.context}</span>}
            </li>
          ))}
        </ul>
        <h3 className="rv eyebrow mb-4 mt-10" style={i(2)}>
          Worked with
        </h3>
        <ul className="space-y-6">
          {collaborations.map((c, k) => (
            <li key={c.organisation} className="rv" style={i(3 + k)}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-display text-base font-normal uppercase tracking-tight">{c.organisation}</p>
                <p className="shrink-0 font-mono text-[0.68rem] text-muted">
                  {c.start} – {c.end}
                </p>
              </div>
              <p className="text-xs text-muted">{c.role}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg/75">{c.description}</p>
            </li>
          ))}
        </ul>
      </Beat>

      <Beat id="exp-before" side="left">
        <p className="rv eyebrow mb-6">Before Cyces</p>
        {[freelance, educator].map((job, k) => (
          <article key={job.company} className={k ? "mt-9" : undefined}>
            <h3 className="rv font-display text-xl font-light uppercase tracking-tight md:text-2xl" style={i(1 + k * 4)}>
              {job.company}
            </h3>
            <p className="rv mt-1 text-sm" style={i(1 + k * 4)}>
              {job.role}
            </p>
            <div className="rv mb-3 mt-0.5" style={i(1 + k * 4)}>
              <Dates job={job} />
            </div>
            <Highlights items={job.highlights} start={2 + k * 4} />
          </article>
        ))}
      </Beat>
    </section>
  );
};

export default Experience;
