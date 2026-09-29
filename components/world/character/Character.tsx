"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { WORLDS } from "@/lib/themes";
import { emit, on, world } from "@/lib/world";

import { shotFor } from "../cameraPath";
import { characterState } from "../characterState";
import { characterConfig } from "./config";
import { createProceduralEngineer } from "./ProceduralEngineer";
import type { CharacterDriver } from "./rig";

const HEAD_HEIGHT = 1.62;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * The engineer, standing on one mark at the centre of the stage. Each scroll step
 * sets what he is doing (idle, inspecting, presenting, walking in place); he always
 * looks toward the camera, and the visitor can drag him round with the mouse.
 */
const Character = () => {
  const group = useRef<THREE.Group>(null);
  const [driver, setDriver] = useState<CharacterDriver | null>(null);
  const { camera, gl } = useThree();
  const motion = useRef({ phase: 0, walk: 0, yaw: 0, arrivedAt: -10 });
  const stride = characterConfig.model?.strideLength ?? 1.3;

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

  // Dress for the current world; on a switch he walks into the new world for a few seconds.
  useEffect(() => {
    if (!driver) return;
    driver.setOutfit?.(WORLDS[world.theme].character);
    return on("theme", () => {
      driver.setOutfit?.(WORLDS[world.theme].character);
      motion.current.arrivedAt = performance.now();
      world.pulse = 1;
    });
  }, [driver]);

  // Drag to rotate (mouse and pen only, so touch keeps scrolling the page).
  useEffect(() => {
    const el = gl.domElement;
    let lastX = 0;
    let lastT = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      characterState.dragging = true;
      characterState.dragVelocity = 0;
      lastX = e.clientX;
      lastT = performance.now();
      el.style.cursor = "grabbing";
      if (!world.dragged) {
        world.dragged = true;
        emit("drag");
      }
    };
    const move = (e: PointerEvent) => {
      if (!characterState.dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const d = (dx / window.innerWidth) * Math.PI * 1.6;
      characterState.dragYaw += d;
      characterState.dragVelocity = d / Math.max((now - lastT) / 1000, 1 / 120);
      characterState.lastDrag = now;
      lastX = e.clientX;
      lastT = now;
    };
    const up = () => {
      if (!characterState.dragging) return;
      characterState.dragging = false;
      el.style.cursor = "grab";
    };
    el.style.cursor = "grab";
    el.style.touchAction = "pan-y";
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.8)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    const g = group.current;
    if (!g || !driver) return;
    const delta = Math.min(rawDelta, 1 / 20);
    const m = motion.current;
    const shot = shotFor(world.beatIds[Math.round(world.beat)]);
    const style = WORLDS[world.theme].character;

    // Each world has its own stance: the plain idle becomes that world's idle, and
    // hands-in-pockets becomes carrying the laptop where he has one.
    let action = shot.action === "idle" ? style.idle : shot.action;
    if (style.laptop && action === "confident") action = "carry";

    // Walk in place: the cycle advances with time; the camera does the travelling.
    const arriving = performance.now() - m.arrivedAt < 3200;
    const walking = !world.reduced && (Boolean(shot.walk) || arriving);
    m.walk += ((walking ? 1 : 0) - m.walk) * Math.min(delta * 3, 1);
    m.phase += ((style.walkSpeed * m.walk * delta) / stride) * Math.PI * 2;

    // Drag inertia, then an unhurried return to facing the visitor.
    if (!characterState.dragging) {
      characterState.dragYaw += characterState.dragVelocity * delta;
      characterState.dragVelocity *= Math.exp(-delta * 4);
      if (performance.now() - characterState.lastDrag > 2500) characterState.dragYaw *= Math.exp(-delta * 0.9);
    }

    // Body turns partly toward the camera so every shot reads as a portrait.
    const camYaw = Math.atan2(camera.position.x, camera.position.z);
    const target = camYaw * 0.45 + characterState.dragYaw;
    m.yaw += wrap(target - m.yaw) * Math.min(delta * (world.reduced ? 60 : 2.6), 1);
    g.rotation.y = m.yaw;

    tmp.set(camera.position.x, camera.position.y - HEAD_HEIGHT, camera.position.z);
    const lookYaw = THREE.MathUtils.clamp(wrap(Math.atan2(tmp.x, tmp.z) - m.yaw), -1.1, 1.1);
    const lookPitch = THREE.MathUtils.clamp(-Math.atan2(tmp.y, Math.hypot(tmp.x, tmp.z)), -0.55, 0.45);

    driver.update({
      time: state.clock.elapsedTime,
      delta,
      walk: m.walk,
      phase: m.phase,
      action,
      lookYaw,
      lookPitch,
      pulse: world.pulse,
    });
  });

  return (
    <>
      <group ref={group}>{driver && <primitive object={driver.root} />}</group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} renderOrder={1}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
    </>
  );
};

export default Character;
