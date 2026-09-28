import type { ReactNode } from "react";

import Reveal from "./Reveal";

interface SectionHeadingProps {
  index: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2";
  id?: string;
}

const SectionHeading = ({ index, label, title, intro, as: H = "h2", id }: SectionHeadingProps) => (
  <Reveal className="mb-12 grid gap-6 md:mb-16 lg:grid-cols-12 lg:gap-10">
    <p className="t-eyebrow flex items-center gap-3 self-start lg:col-span-3 lg:pt-4">
      <span className="text-signal">{index}</span>
      {label}
    </p>
    <div className="lg:col-span-9">
      <H id={id} className="wide font-display text-[clamp(2.1rem,5vw,4.25rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.02em]">
        {title}
      </H>
      {intro && <p className="t-body mt-5 max-w-2xl">{intro}</p>}
    </div>
  </Reveal>
);

export default SectionHeading;
