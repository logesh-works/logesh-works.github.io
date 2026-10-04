import type { CharacterAction } from "./character/rig";

export type Vec3 = [number, number, number];

/**
 * One shot per scroll step. The character walks a continuous loop; each shot is
 * framed relative to them (facing +z, ~1.8 m tall) and turns with them as they
 * walk: face close-up → three-quarter → profile → full body → low angle → high
 * angle → wide → feet. `cam` and `target` are in the character's frame.
 * `text` is where that step's copy sits, so the frame keeps the character clear of it.
 */
export interface Shot {
  cam: Vec3;
  target: Vec3;
  action: CharacterAction;
  text: "left" | "right" | "center";
}

const shots: Record<string, Shot> = {
  top: { cam: [0, 1.66, 1.3], target: [0, 1.6, 0], action: "idle", text: "center" },
  about: { cam: [-1.35, 1.5, 2.7], target: [0, 1.3, 0], action: "idle", text: "right" },
  stack: { cam: [2.7, 1.25, 0.8], target: [0, 1.15, 0], action: "idle", text: "left" },
  experience: { cam: [0.2, 1.05, 4.7], target: [0, 0.95, 0], action: "idle", text: "right" },
  "open-source": { cam: [1.9, 0.5, 3.0], target: [0, 1.1, 0], action: "idle", text: "left" },
  research: { cam: [-2.3, 2.7, 2.5], target: [0, 1.05, 0], action: "idle", text: "right" },
  writing: { cam: [1.7, 1.75, 3.6], target: [0, 1.2, 0], action: "idle", text: "left" },
  contact: { cam: [-0.5, 1.25, 5.4], target: [0, 0.95, 0], action: "idle", text: "right" },
  end: { cam: [0.7, 0.4, 1.7], target: [0, 0.22, 0], action: "idle", text: "center" },
};

export const shotFor = (id: string | undefined): Shot => (id && shots[id]) || shots.top;
