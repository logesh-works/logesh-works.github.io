import Link from "next/link";
import type { CSSProperties } from "react";

import CopyCommand from "@/components/story/CopyCommand";
import { postmanMcp } from "@/constants";

import Beat from "../Beat";
import Heading from "../Heading";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** Postman MCP in one screen: what it is, the pipeline it runs, how to get it. */
const OpenSource = () => (
  <section id="open-source" data-chapter="open-source" aria-labelledby="oss-title">
    <Beat id="oss-intro" side="left">
      <Heading index="04" eyebrow="Open source" id="oss-title" lines={[postmanMcp.name]} size="xl" />
      <p className="rv mt-5 max-w-md text-[0.98rem] leading-relaxed text-fg/80" style={i(2)}>
        {postmanMcp.summary}
      </p>
      <ol aria-label="Pipeline" className="rv mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[0.68rem]" style={i(3)}>
        {postmanMcp.stages.map((s, k) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className={k === postmanMcp.stages.length - 1 ? "text-signal" : "text-fg/80"}>{s.label}</span>
            {k < postmanMcp.stages.length - 1 && (
              <span aria-hidden className="text-signal/60">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="rv mt-6 max-w-sm" style={i(4)}>
        <CopyCommand command={postmanMcp.install} />
      </div>
      <div className="rv mt-5 flex flex-wrap gap-2" style={i(5)}>
        <a href={postmanMcp.links.github} target="_blank" rel="noopener noreferrer" className="hud-pill hud-pill--solid">
          GitHub <span aria-hidden>↗</span>
        </a>
        <a href={postmanMcp.links.pypi} target="_blank" rel="noopener noreferrer" className="hud-pill">
          PyPI <span aria-hidden>↗</span>
        </a>
        <a href={postmanMcp.links.docs} target="_blank" rel="noopener noreferrer" className="hud-pill">
          Docs <span aria-hidden>↗</span>
        </a>
      </div>
      <p className="rv mt-6 text-sm text-muted" style={i(6)}>
        <Link href="/activities" className="link-underline text-fg/80 hover:text-fg">
          Recent GitHub activity →
        </Link>
      </p>
    </Beat>
  </section>
);

export default OpenSource;
