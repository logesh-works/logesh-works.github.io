import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface HeadingProps {
  /** Chapter number, e.g. "03". Rendered as "03/". */
  index?: string;
  eyebrow?: string;
  /** Each entry is one line of the heading; lines reveal in sequence. */
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3";
  id?: string;
  size?: "xl" | "lg" | "md";
  className?: string;
}

const sizes = {
  xl: "text-[clamp(2.3rem,5vw,4.6rem)]",
  lg: "text-[clamp(1.9rem,3.6vw,3.3rem)]",
  md: "text-[clamp(1.5rem,2.6vw,2.35rem)]",
};

/** Heavy, uppercase display heading whose lines tilt up into place when the beat arrives. */
const Heading = ({ index, eyebrow, lines, as: H = "h2", id, size = "lg", className }: HeadingProps) => (
  <div className={className}>
    {(index || eyebrow) && (
      <p className="rv eyebrow mb-5 flex items-center gap-3" style={{ "--i": 0 } as CSSProperties}>
        {index && <span className="text-signal">{index}/</span>}
        {eyebrow && (
          <span>
            <span aria-hidden className="text-muted/60">~/logesh $ </span>
            cd {eyebrow.toLowerCase().replace(/\s+/g, "-")}
          </span>
        )}
      </p>
    )}
    <H id={id} className={cn("font-display font-extralight uppercase leading-[1.02] tracking-[0.01em]", sizes[size])}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <span className="rv-line block" style={{ "--i": i + 1 } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </H>
  </div>
);

export default Heading;
