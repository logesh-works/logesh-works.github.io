import { toolbelt } from "@/constants";

import Beat from "../Beat";
import Heading from "../Heading";
import StackList from "../StackList";

const Systems = () => (
  <section id="stack" data-chapter="stack" aria-labelledby="stack-title">
    <Beat id="stack" side="left">
      <Heading index="02" eyebrow="Systems" id="stack-title" lines={["Skills, arranged", "the way systems are."]} size="md" />
      <p className="rv mt-4 text-sm leading-relaxed text-muted" style={{ ["--i" as string]: 3 }}>
        Grouped by the layer of an architecture each one lives in. Point at a layer to light it up in the system.
      </p>
      <div className="rv mt-6" style={{ ["--i" as string]: 4 }}>
        <StackList />
      </div>
      <dl className="rv mt-5 space-y-1.5 text-[0.78rem]" style={{ ["--i" as string]: 5 }}>
        {Object.entries(toolbelt).map(([k, items]) => (
          <div key={k} className="flex gap-3">
            <dt className="eyebrow w-20 shrink-0 pt-0.5">{k}</dt>
            <dd className="text-fg/70">{items.join(" · ")}</dd>
          </div>
        ))}
      </dl>
    </Beat>
  </section>
);

export default Systems;
