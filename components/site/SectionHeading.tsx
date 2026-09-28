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
    <p className="eyebrow flex items-center gap-3 self-start lg:col-span-3 lg:pt-4">
      <span className="text-signal">{index}</span>
      <span aria-hidden className="h-px w-8 bg-line/20" />
      {label}
    </p>
    <div className="lg:col-span-9">
      <H id={id} className="font-display text-[clamp(2.1rem,5vw,4rem)] font-medium leading-[1.02] tracking-tightest">
        {title}
      </H>
      {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{intro}</p>}
    </div>
  </Reveal>
);

export default SectionHeading;
