import * as THREE from "three";

/**
 * Physical layout of the world. Every scene element and every character mark is
 * positioned from here, so the choreography and the environment never drift apart.
 * Units are metres; the ground is y = 0 and the opening camera looks down -z.
 */

export type Vec3 = [number, number, number];

export const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** The floating architecture graph (the "system" the character studies first). */
export const GRAPH = { pos: [0, 3.1, -3.4] as Vec3, scale: 0.46 };

/** Experience pipelines, drawn as floating rails of real system steps. */
export const SYNC_RAIL = { from: [-11.2, 2.15, -8.6] as Vec3, to: [-3.8, 2.15, -8.6] as Vec3 };
export const EVENT_RAIL = { from: [-12.6, 1.55, -4.8] as Vec3, to: [-12.6, 1.55, -14.4] as Vec3 };

/** Standing workstation where the Postman MCP sync is run. */
export const WORKSTATION = {
  desk: [8.6, 1.02, -15.25] as Vec3,
  terminal: [8.6, 1.5, -15.62] as Vec3,
  mark: [8.6, 0, -14.62] as Vec3,
};

/** Seven gates, one per real pipeline stage, running away from the workstation. */
export const GATES = { start: [10.9, 1.65, -16.1] as Vec3, step: [2.35, 0, 0] as Vec3, size: 1.5 };
export const gate = (k: number): Vec3 => [
  GATES.start[0] + GATES.step[0] * k,
  GATES.start[1] + GATES.step[1] * k,
  GATES.start[2] + GATES.step[2] * k,
];

export const AWARD = { pos: [6.6, 2.55, -6.9] as Vec3 };
