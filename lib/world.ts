/**
 * Mutable, framework-free state shared by the scroll controller, the HUD, the
 * audio engine and the 3D stage. Hot values (scroll position, audio level) are read
 * every frame and never trigger React renders; discrete changes are broadcast as events.
 */

export type Quality = "high" | "medium" | "low";

export type WorldEvent = "chapter" | "beats" | "ready" | "sound" | "theme" | "transition" | "panel" | "footer" | "drag" | "character";

export type PanelId = "timeline" | "profile" | "menu" | null;

export const world = {
  /** Continuous step position: 2.5 = halfway between step 2 and step 3. */
  beat: 0,
  beatIds: [] as string[],
  chapter: "top",
  chapterIndex: 0,
  /** Pointer in -1 → 1 viewport space. */
  pointer: { x: 0, y: 0 },
  /** Smoothed audio output level 0 → 1. */
  audioLevel: 0,
  /** Set to 1 on each musical accent, decays in the scene. */
  pulse: 0,
  quality: "high" as Quality,
  reduced: false,
  ready: false,
  /** The character model has loaded and is on stage. */
  characterReady: false,
  /** The loader has finished and the visitor is in the experience. */
  entered: false,
  soundOn: false,
  /** Index into WORLDS (lib/themes.ts): character, set, light, UI and score together. */
  theme: 0,
  /** World switch in progress: "out" = fading to black, "in" = revealing the new world. */
  transition: null as "out" | "in" | null,
  /** World being switched to while the transition runs. */
  pendingTheme: 0,
  /** Overlay currently open, if any. */
  panel: null as PanelId,
  /** The footer has scrolled into view: fixed text blocks step aside. */
  footer: false,
  /** The visitor has dragged the character at least once. */
  dragged: false,
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

export const pulse = () => {
  world.pulse = 1;
};

export const setPanel = (panel: PanelId) => {
  if (world.panel === panel) return;
  world.panel = panel;
  emit("panel");
};

/** Navigation hooks installed by the scroll controller (smooth scroll to a step). */
export const nav = {
  toBeat: (id: string) => {
    document.getElementById(id)?.scrollIntoView();
  },
};
