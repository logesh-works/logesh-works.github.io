import type { WorldId } from "@/lib/themes";

import type { CharacterAction } from "./rig";

/**
 * Where the joints sit on an unrigged, standing model, as fractions of its height
 * (x: distance from the centre line toward the character's left; y: up from the
 * floor). The arm is given for the left side and mirrored. Used to rig the model in
 * the browser so it can breathe, look around and gesture instead of standing still.
 */
export interface Landmarks {
  shoulder: [number, number];
  elbow: [number, number];
  wrist: [number, number];
  /** Tip of the hand (end of the wrist bone). */
  hand: [number, number];
  hips: number;
  spine: number;
  neck: number;
  head: number;
  knee: number;
  ankle: number;
  /** Distance of each leg from the centre line. */
  legX: number;
  /** Lowers arms modelled in a T- or A-pose to hang at the sides (radians). */
  armsDown?: number;
}

/**
 * A character model in /public/models (meshopt/WebP compressed; see README).
 *
 * - **Rigged** (has a skeleton and clips): map actions to clip names in `clips`.
 *   Only `idle` is required; unmapped actions fall back to `idle`. `headBone`
 *   receives the procedural look-at.
 * - **Not rigged** (a single static mesh, e.g. from an image-to-3D tool): give
 *   `landmarks` and it is rigged on load; leave both out and the whole body sways.
 */
export interface GltfCharacterConfig {
  url: string;
  /** Height in metres. The model is scaled to it, stood on the floor and centred, whatever its original size or origin. */
  height?: number;
  /** Rotation (radians) to make the model face +z. */
  yaw?: number;
  clips?: { idle: string; walk?: string } & Partial<Record<CharacterAction, string>>;
  headBone?: string;
  landmarks?: Landmarks;
  /** Credit line required by the model's licence, shown nowhere but kept with the asset. */
  credit?: string;
}

/** One character per world. */
export const characterConfigs: Record<WorldId, GltfCharacterConfig> = {
  // "God Zeus in T-pose" (Tripo export), rigged in Mixamo with motion-captured clips
  // (Breathing Idle, Walking in place, Waving, Texting While Standing, Thinking, Talking).
  space: {
    // TEMP preview: Logesh's Avaturn avatar, rigged in Mixamo with one clip (Standard Walk, in place).
    // meshopt-compressed, ~2.2 MB (mostly its WebP textures).
    url: "/models/logesh.glb",
    height: 1.78,
    yaw: 0,
    clips: { idle: "Walk", walk: "Walk" },
    // three.js strips the ":" from Mixamo's "mixamorig:Head".
    headBone: "mixamorigHead",
  },
  // "Mita Ashley anime girl" (Sketchfab), auto-rigged in Mixamo with Standard Walk (in place),
  // the same clip the avatar uses. Simplified to ~29k tris, 2048 WebP texture, meshopt; ~380 KB.
  // (Originals are kept in /mixamo/original-glb.)
  anime: {
    url: "/models/anime-walk.glb",
    height: 1.7,
    yaw: 0,
    clips: { idle: "Walk", walk: "Walk" },
    headBone: "mixamorigHead",
  },
  // "Low-poly old man standing" (Tripo export), auto-rigged in Mixamo with Standard Walk
  // (in place). Rigged at 10.6k tris; meshopt + WebP, ~1.2 MB.
  village: {
    url: "/models/oldman-walk.glb",
    height: 1.72,
    yaw: 0,
    clips: { idle: "Walk", walk: "Walk" },
    headBone: "mixamorigHead",
  },
};
