import type { CharacterAction } from "./character/rig";

export type Vec3 = [number, number, number];

/**
 * One shot per scroll step. The engineer stands at the origin (facing +z, ~1.85 m
 * tall) and the camera travels a smooth spline through these positions: head
 * close-up → three-quarter → profile → full body walking → low angle → high angle
 * → wide → feet. `text` is where that step's copy sits, so the frame keeps the
 * character clear of it.
 */
export interface Shot {
  cam: Vec3;
  target: Vec3;
  action: CharacterAction;
  /** Walk in place (the camera does the travelling). */
  walk?: boolean;
  text: "left" | "right" | "center";
}

export const shots: Record<string, Shot> = {
  top: { cam: [0, 1.66, 1.3], target: [0, 1.6, 0], action: "confident", text: "center" },
  about: { cam: [-1.35, 1.5, 2.7], target: [0, 1.3, 0], action: "idle", text: "right" },
  stack: { cam: [2.7, 1.25, 0.8], target: [0, 1.15, 0], action: "inspect", text: "left" },
  experience: { cam: [0.2, 1.05, 4.7], target: [0, 0.95, 0], action: "idle", walk: true, text: "right" },
  "open-source": { cam: [1.9, 0.5, 3.0], target: [0, 1.1, 0], action: "present", text: "left" },
  research: { cam: [-2.3, 2.7, 2.5], target: [0, 1.05, 0], action: "lookUp", text: "right" },
  contact: { cam: [0.5, 1.25, 5.4], target: [0, 0.95, 0], action: "confident", text: "left" },
  end: { cam: [0.7, 0.4, 1.7], target: [0, 0.22, 0], action: "idle", walk: true, text: "center" },
};

export const shotFor = (id: string | undefined): Shot => (id && shots[id]) || shots.top;
