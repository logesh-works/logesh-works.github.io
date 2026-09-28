"use client";

import { setSound } from "@/lib/audio/sound";
import { useWorld } from "@/lib/useWorld";
import { cn } from "@/lib/utils";

/** Five-bar equaliser toggle (docs/design-spec.md §3.2). No visible label. */
const SoundToggle = ({ className }: { className?: string }) => {
  const { soundOn } = useWorld("sound");
  return (
    <button
      type="button"
      data-sound-toggle
      onClick={() => void setSound(!soundOn, true)}
      aria-pressed={soundOn}
      aria-label={soundOn ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}
      className={cn("grid h-10 w-10 place-items-center text-fg transition-colors duration-300 ease-out hover:text-signal", className)}
    >
      <span aria-hidden className="sound-bars" data-on={soundOn ? "" : undefined}>
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    </button>
  );
};

export default SoundToggle;
