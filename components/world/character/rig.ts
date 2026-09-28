import type * as THREE from "three";

/**
 * The contract between the scene and whatever character model is in use.
 * The procedural stand-in and a future GLB both implement `CharacterDriver`,
 * so replacing the model never touches choreography, camera or environment code.
 */

export type CharacterAction = "idle" | "confident" | "inspect" | "present" | "type" | "lookUp";

export const JOINTS = [
  "hips", "spine", "neck", "head", "tail",
  "shoulderL", "elbowL", "wristL", "shoulderR", "elbowR", "wristR",
  "thighL", "kneeL", "ankleL", "thighR", "kneeR", "ankleR",
] as const;

export type JointName = (typeof JOINTS)[number];

/** Euler offsets (radians) from the rest pose, per joint. */
export type Pose = Partial<Record<JointName, [number, number, number]>>;

export interface CharacterFrame {
  time: number;
  delta: number;
  /** 0 = standing, 1 = full walking stride. */
  walk: number;
  /** Walk cycle phase in radians; advances with distance travelled so feet don't slide. */
  phase: number;
  action: CharacterAction;
  /** Look direction relative to the body, radians (yaw, pitch). */
  lookYaw: number;
  lookPitch: number;
  /** Musical accent 0 → 1, for tiny reactive gestures. */
  pulse: number;
}

export interface CharacterDriver {
  /** Add this to the scene; the driver moves its own limbs, the scene moves the root. */
  root: THREE.Object3D;
  update(frame: CharacterFrame): void;
  dispose(): void;
}
