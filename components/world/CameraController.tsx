"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { characterState } from "./characterState";
import { planFor, type Shot } from "./choreography";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Film offset that pushes the subject away from the side the text sits on. */
const FILM_SHIFT = 6.5;

/**
 * Cinematic camera: each beat defines a shot around the character (or a fixed
 * place). Between beats shots blend with scroll; everything is damped so the
 * camera glides, and a little pointer parallax keeps the frame alive.
 */
const CameraController = () => {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const look = useRef(new THREE.Vector3(0, 1.3, 0));
  const init = useRef(false);
  const follow = useRef(0);
  const tmp = useMemo(
    () => ({
      away: new THREE.Vector3(),
      camA: new THREE.Vector3(),
      camB: new THREE.Vector3(),
      la: new THREE.Vector3(),
      lb: new THREE.Vector3(),
      chest: new THREE.Vector3(),
      right: new THREE.Vector3(),
      followCam: new THREE.Vector3(),
      followLook: new THREE.Vector3(),
    }),
    []
  );

  const portrait = size.width / size.height < 0.9;

  const resolve = (shot: Shot, outCam: THREE.Vector3, outLook: THREE.Vector3) => {
    const c = characterState.pos;
    tmp.chest.set(c.x, shot.look.lift ?? 1.3, c.z);
    if (shot.look.at) {
      outLook.set(...shot.look.at);
      outLook.lerp(tmp.chest, 1 - (shot.look.mix ?? 0.5));
    } else {
      outLook.copy(tmp.chest);
    }
    if ("rel" in shot.cam) {
      const [x, y, z] = shot.cam.rel;
      outCam.set(c.x + x, y, c.z + z);
    } else {
      outCam.set(...shot.cam.abs);
    }
    if (portrait) {
      // Pull back and raise slightly so the character sits in the upper half above the text.
      const away = tmp.away;
      away.copy(outCam).sub(outLook).multiplyScalar(0.55);
      away.y *= 0.4;
      outCam.add(away);
      outLook.y -= 0.35;
    }
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 20);
    const n = world.beatIds.length;
    if (!n) return;
    const b = THREE.MathUtils.clamp(world.beat, 0, n - 1);
    const i0 = Math.floor(b);
    const i1 = Math.min(i0 + 1, n - 1);
    const t = world.reduced ? Math.round(b - i0) : smooth(b - i0);

    const p0 = planFor(world.beatIds[i0]);
    const p1 = planFor(world.beatIds[i1]) ?? p0;
    if (!p0 || !p1) return;

    resolve(p0.shot, tmp.camA, tmp.la);
    resolve(p1.shot, tmp.camB, tmp.lb);
    const camTarget = tmp.camA.lerp(tmp.camB, t);
    const lookTarget = tmp.la.lerp(tmp.lb, t);

    // While he walks between marks the camera becomes a follow cam: behind his
    // shoulder, looking where he is going. It hands back to the composed shot on arrival.
    const walkingAway = characterState.moving && !world.reduced && world.beatIds[Math.round(b)] !== "hero";
    follow.current += ((walkingAway ? 1 : 0) - follow.current) * Math.min(delta * 1.4, 1);
    if (follow.current > 0.01) {
      const c = characterState.pos;
      const fx = Math.sin(characterState.yaw);
      const fz = Math.cos(characterState.yaw);
      const back = portrait ? 5.6 : 4.4;
      tmp.followCam.set(c.x - fx * back + fz * 1.5, portrait ? 2.3 : 1.95, c.z - fz * back - fx * 1.5);
      tmp.followLook.set(c.x + fx * 2.6, 1.2, c.z + fz * 2.6);
      const w = follow.current * 0.8;
      camTarget.lerp(tmp.followCam, w);
      lookTarget.lerp(tmp.followLook, w);
    }

    // Subtle handheld parallax from the pointer, in camera space.
    if (!world.reduced) {
      tmp.right.setFromMatrixColumn(cam.matrixWorld, 0);
      camTarget.addScaledVector(tmp.right, world.pointer.x * 0.28);
      camTarget.y -= world.pointer.y * 0.14;
    }

    const k = world.reduced || !init.current ? 1 : 1 - Math.exp(-delta * 2.1);
    init.current = true;
    cam.position.lerp(camTarget, k);
    look.current.lerp(lookTarget, world.reduced ? 1 : 1 - Math.exp(-delta * 2.6));
    cam.lookAt(look.current);

    // Keep the subject clear of the copy.
    const side = world.beatSides[Math.round(b)] ?? "center";
    const film = portrait ? 0 : side === "left" ? -FILM_SHIFT : side === "right" ? FILM_SHIFT : 0;
    const next = cam.filmOffset + (film - cam.filmOffset) * (world.reduced ? 1 : 1 - Math.exp(-delta * 2));
    if (Math.abs(next - cam.filmOffset) > 0.001) {
      cam.filmOffset = next;
      cam.updateProjectionMatrix();
    }
  });

  return null;
};

export default CameraController;
