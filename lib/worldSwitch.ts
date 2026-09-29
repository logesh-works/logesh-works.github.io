import { ambient } from "@/lib/audio/ambient";
import { WORLDS, WORLD_STORAGE_KEY } from "@/lib/themes";
import { emit, world } from "@/lib/world";

const OUT_MS = 650;
const IN_MS = 900;

/** Applies a world instantly: UI tokens, stored preference, stage, character and score. */
export const applyWorld = (index: number) => {
  const theme = WORLDS[index];
  world.theme = index;
  document.documentElement.dataset.theme = theme.id;
  try {
    window.localStorage.setItem(WORLD_STORAGE_KEY, theme.id);
  } catch {
    /* storage unavailable: the choice just isn't remembered */
  }
  ambient.setMood(theme.music);
  emit("theme");
};

/**
 * Switches to the next world (or a given one) as one coordinated move: the screen
 * fades to black with the world's name, everything changes underneath, then the
 * new world is revealed. Reduced motion swaps instantly.
 */
export const switchWorld = (target?: number) => {
  if (world.transition) return;
  const next = target ?? (world.theme + 1) % WORLDS.length;
  if (next === world.theme) return;

  if (world.reduced) {
    applyWorld(next);
    return;
  }
  world.transition = "out";
  world.pendingTheme = next;
  emit("transition");
  ambient.whoosh();
  window.setTimeout(() => {
    applyWorld(next);
    world.transition = "in";
    emit("transition");
    window.setTimeout(() => {
      world.transition = null;
      emit("transition");
    }, IN_MS);
  }, OUT_MS);
};
