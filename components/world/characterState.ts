/** Live character state shared between the stage, the drag controls and the camera. */
export const characterState = {
  /** Extra yaw from the visitor dragging the character (radians). */
  dragYaw: 0,
  dragVelocity: 0,
  dragging: false,
  lastDrag: 0,
};
