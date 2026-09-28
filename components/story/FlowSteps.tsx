import type { SystemFlow } from "@/interfaces";

/** Accessible, text version of a system flow (the 3D rail is decorative). */
const FlowSteps = ({ flow }: { flow: SystemFlow }) => (
  <ol aria-label={flow.caption} className="flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[0.72rem]">
    {flow.steps.map((s, i) => (
      <li key={s.label} className="flex items-center gap-2">
        <span className={i === flow.steps.length - 1 ? "rounded-full border border-signal/50 px-2.5 py-1 text-signal" : "rounded-full border border-line/15 px-2.5 py-1 text-fg/85"}>
          {s.label}
        </span>
        {i < flow.steps.length - 1 && (
          <span aria-hidden className="text-signal/70">
            →
          </span>
        )}
      </li>
    ))}
  </ol>
);

export default FlowSteps;
