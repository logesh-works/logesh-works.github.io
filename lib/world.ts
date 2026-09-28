/**
 * Mutable, framework-free state shared by the scroll controller, the audio engine,
 * the cursor and the 3D world. Hot values (scroll position, audio level) are read
 * every frame and never trigger React renders; discrete changes are broadcast as events.
 */

export type Quality = "high" | "medium" | "low";

export type WorldEvent = "chapter" | "hover" | "cursor" | "ready" | "sound" | "beats";

export const world = {
  /** Continuous beat position: 3.5 = halfway between beat 3 and beat 4. */
  beat: 0,
  beatIds: [] as string[],
  /** Which side of the screen each beat's copy sits on, so the camera frames around it. */
  beatSides: [] as ("left" | "right" | "center")[],
  chapter: "top",
  chapterIndex: 0,
  /** Pointer in -1 → 1 viewport space. */
  pointer: { x: 0, y: 0 },
  /** Smoothed audio output level 0 → 1. */
  audioLevel: 0,
  /** Set to 1 on each musical accent, decays in the scene. */
  pulse: 0,
  pulseSeed: 0,
  /** Stack layer currently highlighted, from the 3D graph or the skills list. */
  hoveredLayer: null as string | null,
  /** Text for the custom cursor while hovering a 3D object. */
  cursorLabel: null as string | null,
  quality: "high" as Quality,
  reduced: false,
  portrait: false,
  ready: false,
  /** The loader has finished and the visitor is in the experience. */
  entered: false,
  soundOn: false,
};

type Listener = () => void;
const listeners = new Map<WorldEvent, Set<Listener>>();

export const on = (event: WorldEvent, fn: Listener) => {
  let set = listeners.get(event);
  if (!set) listeners.set(event, (set = new Set()));
  set.add(fn);
  return () => {
    set!.delete(fn);
  };
};

export const emit = (event: WorldEvent) => listeners.get(event)?.forEach((fn) => fn());

export const setHoveredLayer = (layer: string | null) => {
  if (world.hoveredLayer === layer) return;
  world.hoveredLayer = layer;
  emit("hover");
};

export const setCursorLabel = (label: string | null) => {
  if (world.cursorLabel === label) return;
  world.cursorLabel = label;
  emit("cursor");
};

export const pulse = () => {
  world.pulse = 1;
  world.pulseSeed = Math.random();
};

/** Weight 1 when the scroll sits exactly on `id`, falling to 0 one beat away. */
export const beatWeight = (id: string) => {
  const i = world.beatIds.indexOf(id);
  if (i < 0) return 0;
  return Math.max(0, 1 - Math.abs(world.beat - i));
};

/** Index of the beat nearest to the current scroll position. */
export const currentBeat = () => Math.round(world.beat);

/** Navigation hooks installed by the scroll controller (smooth scroll to a beat). */
export const nav = {
  toBeat: (id: string) => {
    document.querySelector(`[data-beat="${id}"]`)?.scrollIntoView({ block: "center" });
  },
};
