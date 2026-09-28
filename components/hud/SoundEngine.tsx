"use client";

import { useEffect } from "react";

import { chapters } from "@/constants";
import { ambient } from "@/lib/audio/ambient";
import { readSoundPref, setSound } from "@/lib/audio/sound";
import { on, pulse, world } from "@/lib/world";

/**
 * Mounted once. Browsers only allow audio after a gesture, so the first click or
 * key press anywhere starts the score (unless the visitor switched it off before).
 * Also wires musical accents and levels into the world, and a soft swell on each
 * chapter change.
 */
const SoundEngine = () => {
  useEffect(() => {
    ambient.onAccent = (kind) => {
      if (kind !== "chord") pulse();
    };
    ambient.onLevel = (level) => {
      world.audioLevel = level;
    };
    const offChapter = on("chapter", () => {
      ambient.setDepth(world.chapterIndex / (chapters.length - 1));
      ambient.whoosh();
    });

    if (readSoundPref() === "off") return offChapter;
    const first = (e: Event) => {
      const el = e.target as Element | null;
      if (el?.closest?.("[data-sound-toggle]")) return cleanup();
      if (!world.soundOn) void setSound(true, false);
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener("pointerdown", first, true);
      document.removeEventListener("keydown", first, true);
    };
    document.addEventListener("pointerdown", first, true);
    document.addEventListener("keydown", first, true);
    return () => {
      offChapter();
      cleanup();
    };
  }, []);

  return null;
};

export default SoundEngine;
