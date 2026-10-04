import { ambient } from "@/lib/audio/ambient";
import { WORLDS, WORLD_STORAGE_KEY } from "@/lib/themes";
import { emit, world } from "@/lib/world";

/*
 * The world switch, after hape.io. Press and hold:
 *   arming   – the copy and buttons fade out, the picture turns grainy and starts to
 *              ripple like liquid, and the switch button fills. Let go now and it all
 *              springs back.
 *   reveal   – held long enough, the switch commits and runs on its own: a stippled,
 *              light-washed circle opens from the centre with the next world inside,
 *              grows past the corners, and leaves a dark vignette that lifts as the new
 *              world settles. Then the interface returns, in stages.
 */

/** Seconds of holding before the switch commits. */
const ARM = 0.35;
/** Seconds for the reveal, from the circle opening to the new world settled. */
const REVEAL = 1.0;
/** Longest the switch keeps rippling, waiting for the next world's character to load. */
const MAX_WAIT = 8;

/** Applies a world instantly: UI tokens, stored preference, stage, character and score. */
const applyWorld = (index: number) => {
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

const s = {
  phase: "idle" as "idle" | "arming" | "reveal",
  holding: false,
  arm: 0,
  waited: 0,
  raf: 0,
  last: 0,
};

const setSwitching = (on: boolean) => {
  if (on) document.documentElement.dataset.switching = "";
  else delete document.documentElement.dataset.switching;
};

const finish = () => {
  cancelAnimationFrame(s.raf);
  s.raf = 0;
  s.phase = "idle";
  s.holding = false;
  s.arm = s.waited = 0;
  world.reveal = world.warp = 0;
  world.transition = false;
  setSwitching(false);
  emit("transition");
};

const tick = (now: number) => {
  // Real time (only very long stalls are clipped), so the switch keeps its pace on slow devices.
  // (A frame held up by a busy moment still counts, so a held press still arms on time.)
  const dt = Math.min((now - s.last) / 1000, 0.25);
  s.last = now;

  if (s.phase === "arming") {
    s.arm = Math.min(Math.max(s.arm + (s.holding ? dt : -dt * 1.4) / ARM, 0), 1);
    world.warp = s.arm;
    if (s.arm >= 1) {
      s.phase = "reveal";
      ambient.whoosh();
    } else if (!s.holding && s.arm <= 0) {
      finish();
      return;
    }
  } else if (s.phase === "reveal") {
    const ready = world.loadedWorlds.has(world.pendingTheme) && world.compiledWorlds.has(world.pendingTheme);
    // Keep rippling until the next world can be seen, so it never opens onto an empty stage.
    if (!ready && world.reveal === 0 && s.waited < MAX_WAIT) s.waited += dt;
    else world.reveal = Math.min(world.reveal + dt / REVEAL, 1);
    // The liquid ripple calms as the new world takes over.
    world.warp = 1 - smoothstep(0.25, 0.85, world.reveal);
    if (world.reveal >= 1) {
      applyWorld(world.pendingTheme);
      finish();
      return;
    }
  }
  s.raf = requestAnimationFrame(tick);
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Start holding the switch (Space down, or pointer down on the switch button). */
export const pressSwitch = (target?: number) => {
  const next = target ?? (world.theme + 1) % WORLDS.length;
  if (next === world.theme) return;
  // No motion wanted, or no 3D stage to wait for: switch on the spot.
  if (world.reduced || world.static) {
    if (!world.transition) applyWorld(next);
    return;
  }
  if (s.phase === "reveal") return;
  s.holding = true;
  if (s.phase === "idle") {
    s.phase = "arming";
    world.pendingTheme = next;
    world.transition = true;
    world.reveal = 0;
    setSwitching(true);
    // Lets the next world's character start loading while the switch is held.
    emit("transition");
  }
  if (!s.raf) {
    s.last = performance.now();
    s.raf = requestAnimationFrame(tick);
  }
};

/** Let go of the switch: before it commits, everything springs back. */
export const releaseSwitch = () => {
  s.holding = false;
};

/** Runs a complete switch on its own (keyboard activation, menu choice). */
export const switchWorld = (target?: number) => {
  pressSwitch(target);
  if (s.phase === "arming") s.arm = 1;
};
