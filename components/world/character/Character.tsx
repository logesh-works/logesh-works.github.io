"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { planFor } from "../choreography";
import { characterState } from "../characterState";
import { characterConfig } from "./config";
import { createProceduralEngineer } from "./ProceduralEngineer";
import type { CharacterDriver } from "./rig";

const WALK_SPEED = 1.35; // m/s at a natural pace
const MAX_SPEED = 2.6;
const TELEPORT = 9; // beyond this he "cuts" to the next mark instead of power-walking
const HEAD_HEIGHT = 1.62;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTo = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z);

/**
 * Places the engineer in the world and choreographs him: he walks to the mark of
 * the beat you are reading, turns to what matters there, and performs its action.
 */
const Character = () => {
  const group = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const [driver, setDriver] = useState<CharacterDriver | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    let alive = true;
    let d: CharacterDriver | null = null;
    const fallback = () => {
      d = createProceduralEngineer();
      if (alive) setDriver(d);
    };
    if (characterConfig.model) {
      import("./GltfEngineer")
        .then(({ loadGltfEngineer }) => loadGltfEngineer(characterConfig.model!))
        .then((g) => {
          d = g;
          if (alive) setDriver(g);
        })
        .catch(fallback);
    } else {
      fallback();
    }
    return () => {
      alive = false;
      d?.dispose();
    };
  }, []);

  const tmp = useMemo(
    () => ({ target: new THREE.Vector3(), face: new THREE.Vector3(), look: new THREE.Vector3(), head: new THREE.Vector3() }),
    []
  );
  const motion = useRef({ phase: 0, walk: 0, speed: 0, yaw: 0, fade: 1, started: false });
  const stride = characterConfig.model?.strideLength ?? 1.3;

  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.75)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);

  useFrame((state, rawDelta) => {
    const g = group.current;
    if (!g || !driver) return;
    const delta = Math.min(rawDelta, 1 / 20);
    const m = motion.current;
    const id = world.beatIds[Math.round(world.beat)];
    const plan = planFor(id) ?? planFor("hero")!;
    tmp.target.set(...plan.mark.pos);

    // Wait offstage behind the loader, then walk into the opening shot rather than popping in.
    if (!m.started && !world.entered && !world.reduced && id === "hero") {
      g.position.set(tmp.target.x - 0.6, 0, tmp.target.z - 4.2);
      g.rotation.y = m.yaw = yawTo(g.position, tmp.target);
      characterState.pos.copy(g.position);
      return;
    }
    if (!m.started) {
      m.started = true;
      if (world.reduced || id !== "hero") g.position.copy(tmp.target);
      else g.position.set(tmp.target.x - 0.6, 0, tmp.target.z - 4.2);
      m.yaw = world.reduced || id !== "hero" ? 0 : yawTo(g.position, tmp.target);
    }

    const toTarget = tmp.target.clone().sub(g.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (world.reduced) {
      g.position.copy(tmp.target);
      m.speed = 0;
    } else if (dist > TELEPORT) {
      // Too far to walk convincingly: fade out, cut, fade in.
      m.fade = Math.max(0, m.fade - delta * 5);
      if (m.fade === 0) g.position.copy(tmp.target);
      m.speed = 0;
    } else {
      m.fade = Math.min(1, m.fade + delta * 3);
      const desired = dist < 0.03 ? 0 : Math.min(MAX_SPEED, Math.max(0.5, dist * 1.6), dist / delta);
      m.speed += (desired - m.speed) * Math.min(delta * 4, 1);
      if (dist > 0.001) g.position.addScaledVector(toTarget.normalize(), Math.min(m.speed * delta, dist));
      m.phase += ((m.speed * delta) / stride) * Math.PI * 2;
    }
    m.walk += (Math.min(m.speed / WALK_SPEED, 1) - m.walk) * Math.min(delta * 6, 1);

    // Face the direction of travel; once there, turn toward what the beat is about.
    let yawTarget: number;
    if (m.speed > 0.25 && dist > 0.15) {
      yawTarget = yawTo(g.position, tmp.target);
    } else {
      if (plan.mark.face === "camera") tmp.face.copy(camera.position);
      else tmp.face.set(...plan.mark.face);
      yawTarget = yawTo(g.position, tmp.face);
    }
    m.yaw += wrap(yawTarget - m.yaw) * Math.min(delta * (world.reduced ? 60 : 3.2), 1);
    g.rotation.y = m.yaw;
    g.scale.setScalar(0.001 + m.fade * 0.999);

    // Gaze relative to the body, clamped to what a neck can do.
    if (plan.mark.look === "camera") tmp.look.copy(camera.position);
    else tmp.look.set(...plan.mark.look);
    tmp.head.set(g.position.x, HEAD_HEIGHT, g.position.z);
    const dir = tmp.look.sub(tmp.head);
    const lookYaw = THREE.MathUtils.clamp(wrap(Math.atan2(dir.x, dir.z) - m.yaw), -1.1, 1.1);
    const lookPitch = THREE.MathUtils.clamp(-Math.atan2(dir.y, Math.hypot(dir.x, dir.z)), -0.55, 0.45);

    driver.update({
      time: state.clock.elapsedTime,
      delta,
      walk: world.reduced ? 0 : m.walk,
      phase: m.phase,
      action: plan.mark.action,
      lookYaw,
      lookPitch,
      pulse: world.pulse,
    });

    characterState.pos.copy(g.position);
    characterState.yaw = m.yaw;
    characterState.moving = m.speed > 0.2;
    if (shadow.current) shadow.current.position.set(g.position.x, 0.004, g.position.z);
  });

  return (
    <>
      <group ref={group}>{driver && <primitive object={driver.root} />}</group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
    </>
  );
};

export default Character;
