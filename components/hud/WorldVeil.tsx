"use client";

import { WORLDS } from "@/lib/themes";
import { useWorld } from "@/lib/useWorld";

/**
 * The blackout between worlds: the screen fades to the incoming world's colour
 * with its number, name and tagline; underneath, set, light, outfit, UI and score
 * change; then the new world is revealed.
 */
const WorldVeil = () => {
  const { transition, pendingTheme } = useWorld("transition");
  const next = WORLDS[pendingTheme];

  return (
    <div
      aria-hidden={!transition}
      data-phase={transition ?? undefined}
      className="world-veil fixed inset-0 z-[140] grid place-items-center bg-ink"
    >
      <div className="world-title px-edge text-center" role="status" aria-live="polite">
        {transition === "out" && (
          <>
            <p className="t-eyebrow !text-signal">
              World {next.index}/{String(WORLDS.length).padStart(2, "0")}
            </p>
            <p className="t-h1 mt-5 !text-[clamp(2.4rem,6vw,5rem)]">{next.name}</p>
            <p className="t-body mt-4">{next.tagline}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default WorldVeil;
