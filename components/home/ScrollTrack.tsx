import { chapters } from "@/constants";

/**
 * Invisible scroll length. Each chapter is one camera stop; scroll position between
 * stops drives the camera along its path. The anchor marker sits so that jumping to
 * `#about` lands with that stop exactly at the viewport centre.
 */
const ScrollTrack = () => (
  <div aria-hidden className="scroll-track pointer-events-none">
    {chapters.map((c, k) => (
      <div
        key={c.id}
        data-chapter={c.id}
        data-beat={c.id}
        className="relative"
        style={{ height: k === 0 ? "100svh" : "150svh" }}
      >
        <span id={c.id} className="absolute left-0 block h-px w-px" style={{ top: k === 0 ? 0 : "calc(50% - 50svh)" }} />
      </div>
    ))}
  </div>
);

export default ScrollTrack;
