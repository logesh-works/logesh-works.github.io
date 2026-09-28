import type { CSSProperties } from "react";

import { award } from "@/constants";

import Beat from "../Beat";
import Heading from "../Heading";

const Research = () => (
  <section id="research" data-chapter="research" aria-labelledby="research-title">
    <Beat id="research" side="left">
      <Heading index="05" eyebrow="Research" id="research-title" lines={[award.title]} size="lg" />
      <p className="rv mt-4" style={{ "--i": 2 } as CSSProperties}>
        <span className="inline-flex rounded-full border border-signal/50 px-3 py-1 font-mono text-[0.7rem] text-signal">{award.event}</span>
      </p>
      <p className="rv mt-6 max-w-lg font-display text-lg font-semibold leading-snug text-fg/85 md:text-xl" style={{ "--i": 3 } as CSSProperties}>
        &ldquo;{award.paper}&rdquo;
      </p>
    </Beat>
  </section>
);

export default Research;
