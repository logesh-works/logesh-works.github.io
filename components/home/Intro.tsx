import type { CSSProperties } from "react";

import { profile } from "@/constants";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** Wordmark sized to exactly fill its box, whatever the width. */
const Word = ({ text, height }: { text: string; height: number }) => (
  <svg viewBox={`0 0 1000 ${height}`} className="block w-full fill-current" aria-hidden>
    <text
      x="0"
      y={height}
      textLength="1000"
      lengthAdjust="spacingAndGlyphs"
      className="wide font-display"
      style={{ fontWeight: 600, fontSize: height * 1.39 }}
    >
      {text}
    </text>
  </svg>
);

/**
 * Opening screen copy (docs/design-spec.md §2.3): the name as a full-width
 * wordmark, then two short statements. Scrolls away with the first step.
 */
const Intro = () => (
  <div className="pointer-events-none absolute inset-x-0 top-0 z-[25] px-edge pt-[92px] lg:pt-[112px]">
    <h1 className="wordmark">
      <span className="sr-only">
        {profile.name}, {profile.role}
      </span>
      <span className="hidden md:block">
        <Word text={profile.name.toUpperCase()} height={86} />
      </span>
      <span className="block md:hidden">
        <Word text="LOGESH" height={170} />
        <span className="mt-[2%] block">
          <Word text="KUMAR" height={170} />
        </span>
      </span>
    </h1>

    <div className="mt-6 flex flex-wrap items-start justify-between gap-y-6 lg:mt-10 lg:justify-start">
      <p className="t-h3 w-[140px] xs:w-[170px] lg:w-col-4" aria-label="Engineering products from ideas">
        <span className="reveal-line block overflow-hidden" style={i(0)}>
          <span>
            <b>Engineering</b>
          </span>
        </span>
        <span className="reveal-line block overflow-hidden" style={i(1)}>
          <span>
            <b>products</b> from
          </span>
        </span>
        <span className="reveal-line block overflow-hidden" style={i(2)}>
          <span>ideas</span>
        </span>
      </p>
      <p
        className="t-h3 mt-[18svh] w-[150px] text-right xs:w-[180px] lg:ml-[calc(var(--col)*2+var(--gutter)*3)] lg:mt-0 lg:w-col-4 lg:text-left"
        aria-label="Designing distributed systems and low-latency APIs"
      >
        <span className="reveal-line block overflow-hidden" style={i(1)}>
          <span>Designing</span>
        </span>
        <span className="reveal-line block overflow-hidden" style={i(2)}>
          <span>
            <b>distributed systems</b>
          </span>
        </span>
        <span className="reveal-line block overflow-hidden" style={i(3)}>
          <span>and low-latency APIs</span>
        </span>
      </p>
    </div>
  </div>
);

export default Intro;
