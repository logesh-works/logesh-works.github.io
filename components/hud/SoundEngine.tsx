"use client";

import { useEffect } from "react";

import { chapters } from "@/constants";
import { ambient } from "@/lib/audio/ambient";
import { setSound } from "@/lib/audio/sound";
import { on, pulse, world } from "@/lib/world";

/**
 * Mounted once. Browsers only allow audio after a gesture, so the first click or tap
 * anywhere on the page starts the score. Key presses never do: keyboard and screen
 * reader users would get music talking over their reader; they have the sound toggle.
 * The toggle still turns it off (or on) for the rest of the visit.
 * Also wires musical accents and levels into the world, a soft swell on each
 * chapter change, and muffles the music while an overlay is open.
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
    // The music drops behind a low-pass while a menu or panel is open.
    const offPanel = on("panel", () => ambient.lower(world.panel !== null));

    const first = (e: Event) => {
      const el = e.target as Element | null;
      if (el?.closest?.("[data-sound-toggle]")) return cleanup();
      if (!world.soundOn) void setSound(true, false);
      cleanup();
    };
    const cleanup = () => document.removeEventListener("pointerdown", first, true);
    document.addEventListener("pointerdown", first, true);
    return () => {
      offChapter();
      offPanel();
      cleanup();
    };
  }, []);

  return null;
};

export default SoundEngine;
