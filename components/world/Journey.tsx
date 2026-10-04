"use client";

import { useFrame } from "@react-three/fiber";

import { world } from "@/lib/world";

import { characterState as cs } from "./characterState";

/** A calm, unhurried pace (m/s), the loop's radius, and the distance one walk cycle (two steps) covers. */
const SPEED = 1.0;
const RADIUS = 2.4;
const STRIDE = 1.4;

/**
 * One continuous walk, like a walk mode: the character strolls a slow loop around
 * the stage and never stops. Scrolling doesn't move them; it changes how the
 * camera frames them (every shot is relative to where they are and which way
 * they're facing). The stride follows the distance covered, so feet don't slide.
 * Runs before the stage and the camera.
 */
const Journey = () => {
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 20);
    if (!(delta > 0)) return;
    cs.action = "idle";

    if (world.reduced) {
      // No motion: stand on the loop, facing forward.
      cs.walk = 0;
      cs.heading = 0;
      cs.x = 0;
      cs.z = 0;
      return;
    }

    const step = SPEED * delta;
    cs.angle += step / RADIUS;
    cs.x = RADIUS * Math.sin(cs.angle);
    cs.z = RADIUS * Math.cos(cs.angle) - RADIUS;
    // Facing along the loop (the tangent of the circle).
    cs.heading = Math.atan2(Math.cos(cs.angle), -Math.sin(cs.angle));
    cs.phase += (step / STRIDE) * Math.PI * 2;
    cs.walk = 1;
  }, -1);

  return null;
};

export default Journey;
