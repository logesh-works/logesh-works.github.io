"use client";

import { skillLayers } from "@/constants";
import { useWorld } from "@/lib/useWorld";
import { setHoveredLayer } from "@/lib/world";
import { cn } from "@/lib/utils";

/**
 * Skills grouped by architecture layer. Pointing at (or focusing) a row lights
 * the same layer in the 3D system graph, and hovering the graph lights the row.
 */
const StackList = () => {
  const { hoveredLayer } = useWorld("hover");

  return (
    <ol className="divide-y divide-line/10 border-y border-line/10" onMouseLeave={() => setHoveredLayer(null)}>
      {skillLayers.map((l, i) => {
        const on = hoveredLayer === l.id;
        return (
          <li
            key={l.id}
            tabIndex={0}
            onMouseEnter={() => setHoveredLayer(l.id)}
            onFocus={() => setHoveredLayer(l.id)}
            onBlur={() => setHoveredLayer(null)}
            data-cursor-label={l.layer}
            className={cn(
              "grid gap-2 py-3 transition-colors duration-300 sm:grid-cols-[9.5rem_1fr] sm:gap-4",
              on && "bg-signal/[0.06]"
            )}
          >
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em]">
              <span className="text-signal">{String(i + 1).padStart(2, "0")}</span>{" "}
              <span className={on ? "text-fg" : "text-muted"}>{l.layer}</span>
              <span className="mt-0.5 block normal-case tracking-normal text-fg/85 sm:text-[0.72rem]">{l.role}</span>
            </p>
            <p className={cn("text-[0.8rem] leading-relaxed transition-colors", on ? "text-fg" : "text-fg/65")}>{l.tech.join(" · ")}</p>
          </li>
        );
      })}
    </ol>
  );
};

export default StackList;
