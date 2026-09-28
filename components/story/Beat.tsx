import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BeatProps {
  id: string;
  /** Where the copy sits; the camera frames the character on the opposite side. */
  side?: "left" | "right" | "center";
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Shorter beats for rapid sequences (e.g. pipeline stages). */
  short?: boolean;
  /** Optional fragment id for in-page links. */
  anchor?: string;
  /** Camera framing override when it should differ from the copy side. */
  frame?: "left" | "right" | "center";
}

/**
 * One screen of the journey. Its position drives the camera and character; its
 * copy drifts with scroll (`--t`) and reveals the first time it reaches centre.
 */
const Beat = ({ id, side = "left", children, className, innerClassName, short, anchor, frame }: BeatProps) => (
  <div
    id={anchor}
    data-beat={id}
    data-side={side}
    data-frame={frame ?? side}
    className={cn(
      "beat relative flex items-end pb-28 pt-24 md:items-center md:pb-24",
      short ? "min-h-[82svh]" : "min-h-[100svh]",
      className
    )}
  >
    <div data-beat-inner className="beat-inner container">
      <div
        className={cn(
          "beat-copy",
          side === "left" && "md:max-w-[34rem] lg:max-w-[36rem]",
          side === "right" && "md:ml-auto md:max-w-[34rem] lg:max-w-[36rem]",
          side === "center" && "mx-auto max-w-3xl md:text-center",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  </div>
);

export default Beat;
