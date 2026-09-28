import Image from "next/image";

import { education, focusAreas, origins, profile } from "@/constants";
import portrait from "@/public/images/me-sidelook.jpeg";

import Beat from "../Beat";
import Heading from "../Heading";

const Identity = () => (
  <section id="about" data-chapter="about" aria-labelledby="about-title">
    <Beat id="about-1" side="left">
      <Heading index="01" eyebrow="Identity" id="about-title" lines={["I build the", "systems behind", <span key="p" className="text-signal">the product.</span>]} />
      <p className="rv mt-6 text-[0.98rem] leading-relaxed text-fg/80" style={{ ["--i" as string]: 4 }}>
        {profile.statement}
      </p>
      <ul className="rv mt-8 grid grid-cols-2 gap-x-6 gap-y-4" style={{ ["--i" as string]: 5 }}>
        {focusAreas.map((f, i) => (
          <li key={f.title}>
            <p className="font-mono text-[0.62rem] text-signal">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-1 text-sm font-semibold">{f.title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{f.body}</p>
          </li>
        ))}
      </ul>
    </Beat>

    <Beat id="about-2" side="right">
      <div className="rv mb-6 flex items-center gap-4">
        <Image
          src={portrait}
          alt="Portrait of Logesh Kumar"
          placeholder="blur"
          sizes="80px"
          className="h-20 w-20 rounded-full border border-signal/40 object-cover"
        />
        <div>
          <p className="font-display text-lg font-light uppercase tracking-[0.12em]">{profile.name}</p>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
            {profile.role} · {profile.location}
          </p>
        </div>
      </div>
      <p className="rv eyebrow mb-4">In short</p>
      <p className="rv font-display text-lg font-semibold leading-snug md:text-xl" style={{ ["--i" as string]: 1 }}>
        {profile.summary}
      </p>
      <ul className="rv mt-6 space-y-2" style={{ ["--i" as string]: 2 }}>
        {origins.map((o) => (
          <li key={o} className="flex gap-3 text-sm text-fg/75">
            <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-signal" />
            {o}
          </li>
        ))}
      </ul>
      <div className="rv mt-8" style={{ ["--i" as string]: 3 }}>
        <h3 className="eyebrow">Education</h3>
        <ul className="mt-3 divide-y divide-line/10 border-y border-line/10">
          {education.map((e) => (
            <li key={e.degree} className="flex items-start justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm">{e.degree}</p>
                <p className="text-xs leading-relaxed text-muted">{e.institute}</p>
              </div>
              <div className="shrink-0 text-right font-mono text-[0.68rem] text-muted">
                <p className="text-fg/85">{e.score}</p>
                <p>
                  {e.start} – {e.end}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Beat>
  </section>
);

export default Identity;
