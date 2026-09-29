"use client";

import { useEffect } from "react";

import { ambient } from "@/lib/audio/ambient";
import { WORLDS, WORLD_STORAGE_KEY } from "@/lib/themes";
import { emit, world } from "@/lib/world";

/**
 * Restores the visitor's last world. The inline head script has already set
 * `data-theme` before first paint; this syncs the world state, stage and score.
 */
const WorldBoot = () => {
  useEffect(() => {
    let id: string | null = null;
    try {
      id = window.localStorage.getItem(WORLD_STORAGE_KEY);
    } catch {
      /* storage unavailable: default world */
    }
    const index = Math.max(0, WORLDS.findIndex((w) => w.id === id));
    world.theme = index;
    document.documentElement.dataset.theme = WORLDS[index].id;
    ambient.setMood(WORLDS[index].music);
    emit("theme");
  }, []);
  return null;
};

export default WorldBoot;
