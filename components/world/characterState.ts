import type { CharacterAction } from "./character/rig";

/** Live character state shared between the stage, the drag controls and the camera. */
export const characterState = {
  /** Extra yaw from the visitor dragging the character (radians). */
  dragYaw: 0,
  dragVelocity: 0,
  dragging: false,
  lastDrag: 0,
  /** Where the character is on the stage right now, and how far round the walk loop. */
  x: 0,
  z: 0,
  angle: 0,
  /** 0 = standing, 1 = full walking stride. */
  walk: 0,
  /** Walk-cycle phase, advanced by distance travelled. */
  phase: 0,
  /** Direction of travel (radians, 0 = facing +z). */
  heading: 0,
  /** Stance used when standing still (the walk loop plays otherwise). */
  action: "confident" as CharacterAction,
};
