import type { CharacterAction } from "./rig";

/**
 * Which character model to use.
 *
 * `model: null` uses the procedural stand-in. To use a sculpted character, export
 * a rigged GLB (Draco/meshopt compressed, ideally < 3 MB) into /public/models, set
 * `url`, and map each action to a clip name in the file. Only `walk` and `idle` are
 * required; any unmapped action falls back to `idle`. The head bone, if named,
 * receives the procedural look-at so he still turns toward the visitor.
 */
export interface GltfCharacterConfig {
  url: string;
  /** Uniform scale so the character stands about 1.78 m tall. */
  scale: number;
  /** Rotation (radians) to make the model face +z. */
  yaw?: number;
  clips: { walk: string; idle: string } & Partial<Record<CharacterAction, string>>;
  headBone?: string;
  /** Metres covered by one full walk-cycle clip, to keep feet from sliding. */
  strideLength?: number;
}

export const characterConfig: { model: GltfCharacterConfig | null } = {
  model: null,
};
