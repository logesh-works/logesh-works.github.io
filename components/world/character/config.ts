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
  /** Uniform scale so the character stands about 1.85 m tall. */
  scale: number;
  /** Rotation (radians) to make the model face +z. */
  yaw?: number;
  clips?: { walk: string; idle: string } & Partial<Record<CharacterAction, string>>;
  headBone?: string;
  /** Metres covered by one full walk-cycle clip, to keep feet from sliding. */
  strideLength?: number;
}

export const characterConfig: { model: GltfCharacterConfig | null } = {
  // Logesh's monkey (Tripo export, optimised: 62k tris, 2K WebP textures, ~0.7 MB). Not rigged yet.
  model: {
    url: "/models/engineer.glb",
    scale: 1.85,
    yaw: 0,
  },
};
