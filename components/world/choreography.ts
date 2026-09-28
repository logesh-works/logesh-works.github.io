import type { CharacterAction } from "./character/rig";
import { AWARD, GRAPH, EVENT_RAIL, SYNC_RAIL, WORKSTATION, type Vec3 } from "./stations";

/**
 * One entry per scroll "beat". Each says where the character stands, what he is
 * doing and looking at, and how the camera frames him. Beat ids match the
 * `data-beat` attributes in the page sections.
 */

export interface Mark {
  pos: Vec3;
  /** Point the body turns toward once he has arrived ("camera" = the visitor). */
  face: Vec3 | "camera";
  look: Vec3 | "camera";
  action: CharacterAction;
}

export interface Shot {
  /** Camera position: relative to the character, or absolute in the world. */
  cam: { rel: Vec3 } | { abs: Vec3 };
  /** What the camera looks at: the character's chest blended toward a point. */
  look: { at?: Vec3; mix?: number; lift?: number };
}

export interface BeatPlan {
  mark: Mark;
  shot: Shot;
}

const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const SYNC_MID = mid(SYNC_RAIL.from, SYNC_RAIL.to);
const EVENT_MID = mid(EVENT_RAIL.from, EVENT_RAIL.to);

const plans: Record<string, BeatPlan> = {
  hero: {
    mark: { pos: [0, 0, 1.3], face: "camera", look: "camera", action: "confident" },
    shot: { cam: { rel: [0, 1.25, 6.4] }, look: { lift: 1.02 } },
  },
  "about-1": {
    mark: { pos: [1.35, 0, -0.7], face: GRAPH.pos, look: GRAPH.pos, action: "inspect" },
    shot: { cam: { rel: [2.9, 1.25, 3.3] }, look: { at: GRAPH.pos, mix: 0.45, lift: 1.4 } },
  },
  "about-2": {
    mark: { pos: [-1.3, 0, 0.3], face: "camera", look: "camera", action: "idle" },
    shot: { cam: { rel: [-2.9, 1.6, 4.9] }, look: { lift: 1.15 } },
  },
  stack: {
    mark: { pos: [2.1, 0, 0.1], face: GRAPH.pos, look: GRAPH.pos, action: "present" },
    shot: { cam: { rel: [0.2, 2.2, 6.4] }, look: { at: GRAPH.pos, mix: 0.62, lift: 1.3 } },
  },
  "exp-cyces": {
    mark: { pos: [-3.7, 0, -4.7], face: SYNC_MID, look: SYNC_MID, action: "idle" },
    shot: { cam: { rel: [3.4, 2.3, 4.6] }, look: { at: SYNC_MID, mix: 0.5, lift: 1.3 } },
  },
  "exp-sync": {
    mark: { pos: [-7.4, 0, -6.8], face: SYNC_MID, look: SYNC_MID, action: "inspect" },
    shot: { cam: { rel: [3.2, 2.1, 5.4] }, look: { at: SYNC_MID, mix: 0.5, lift: 1.3 } },
  },
  "exp-events": {
    mark: { pos: [-10.7, 0, -9.6], face: EVENT_MID, look: EVENT_MID, action: "inspect" },
    shot: { cam: { rel: [4.4, 2.0, 3.4] }, look: { at: EVENT_MID, mix: 0.5, lift: 1.3 } },
  },
  "exp-more": {
    mark: { pos: [-9.2, 0, -12.3], face: "camera", look: "camera", action: "idle" },
    shot: { cam: { rel: [-2.2, 1.5, 3.2] }, look: { lift: 1.25 } },
  },
  "exp-before": {
    mark: { pos: [-5.8, 0, -15.3], face: "camera", look: "camera", action: "confident" },
    shot: { cam: { rel: [3.2, 1.9, 3.6] }, look: { lift: 1.2 } },
  },
  "oss-intro": {
    mark: { pos: WORKSTATION.mark, face: WORKSTATION.terminal, look: WORKSTATION.terminal, action: "type" },
    shot: { cam: { rel: [-3.4, 2.1, 4.4] }, look: { at: [11.5, 1.5, -15.6], mix: 0.45, lift: 1.3 } },
  },
  research: {
    mark: { pos: [6.0, 0, -5.1], face: AWARD.pos, look: AWARD.pos, action: "lookUp" },
    shot: { cam: { rel: [-2.0, 1.15, 3.3] }, look: { at: AWARD.pos, mix: 0.55, lift: 1.4 } },
  },
  contact: {
    mark: { pos: [1.5, 0, 2.7], face: "camera", look: "camera", action: "confident" },
    shot: { cam: { rel: [0.8, 1.9, 5.8] }, look: { lift: 1.15 } },
  },
};

export const planFor = (id: string | undefined): BeatPlan | undefined => (id ? plans[id] : undefined);
