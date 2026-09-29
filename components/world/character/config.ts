import type { CharacterAction } from "./rig";

/**
 * Which character model to use.
 *
 * `model: null` uses the procedural stand-in. Otherwise a GLB in /public/models
 * (meshopt/WebP compressed; see README) is loaded:
 *
 * - **Rigged** (has a skeleton and clips): map actions to clip names in `clips`.
 *   Only `walk` and `idle` are required; unmapped actions fall back to `idle`.
 *   `headBone` receives the procedural look-at.
 * - **Not rigged** (a single static mesh, e.g. straight from an image-to-3D tool):
 *   leave out `clips`. The whole body is animated instead: breathing, weight
 *   shift, walking bob, gestures as leans and turns, look toward the camera.
 */
export interface GltfCharacterConfig {
  url: string;
  /** Height in metres. The model is scaled to it, stood on the floor and centred, whatever its original size or origin. */
  height?: number;
  /** Rotation (radians) to make the model face +z. */
  yaw?: number;
  clips?: { walk: string; idle: string } & Partial<Record<CharacterAction, string>>;
  headBone?: string;
  /** Metres covered by one full walk-cycle clip, to keep feet from sliding. */
  strideLength?: number;
}

export const characterConfig: { model: GltfCharacterConfig | null } = {
  // Logesh's monkey, "The Ape in Black" (Meshy export, optimised: 78k tris, 2K WebP textures, ~1.2 MB). Not rigged yet.
  model: {
    url: "/models/engineer.glb",
    height: 1.85,
    yaw: 0,
  },
};
