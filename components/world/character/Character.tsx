"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { WORLDS } from "@/lib/themes";
import { emit, on, world } from "@/lib/world";

import { characterState } from "../characterState";
import { compileQuietly, uploadTexturesQuietly } from "../compile";
import { characterConfigs } from "./config";
import { createProceduralEngineer } from "./ProceduralEngineer";
import type { CharacterDriver } from "./rig";

const HEAD_HEIGHT = 1.62;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Which worlds' characters have loaded. The loader waits for the current world's. */
const loaded = new Set<number>();
const markReady = () => {
  if (world.characterReady || !loaded.has(world.theme)) return;
  world.characterReady = true;
  emit("character");
};

/**
 * One world's character, acting out the journey: walking between the steps' marks
 * as the visitor scrolls, and gesturing at each one (waving, typing, presenting,
 * thinking). They keep looking around on their own, glance toward the visitor's
 * cursor, and can be dragged round with the mouse.
 */
const Character = ({ index }: { index: number }) => {
  const group = useRef<THREE.Group>(null);
  const [driver, setDriver] = useState<CharacterDriver | null>(null);
  const { camera, gl, scene } = useThree();
  const motion = useRef({ yaw: 0 });
  const look = useRef({ x: 0, y: 0 });
  const shadow = useRef<THREE.Mesh>(null);

  useEffect(() => {
    let alive = true;
    let d: CharacterDriver | null = null;
    const done = async (next: CharacterDriver) => {
      d = next;
      if (!alive) {
        next.dispose();
        return;
      }
      // Its shaders are ready before it steps on stage, so its first frame never stalls.
      // (If the stage is torn down meanwhile, the cleanup below disposes it.)
      await compileQuietly(gl, next.root, camera, scene, () => alive);
      await uploadTexturesQuietly(gl, next.root, () => alive);
      if (!alive) return;
      setDriver(next);
      loaded.add(index);
      world.loadedWorlds.add(index);
      emit("loaded");
      markReady();
    };
    let started = false;
    const load = () => {
      if (started || !alive) return;
      started = true;
      import("./GltfEngineer")
        .then(({ loadGltfEngineer }) => loadGltfEngineer(characterConfigs[WORLDS[index].id]))
        .then(done)
        .catch((err) => {
          console.warn(`${WORLDS[index].name}: character model failed to load; using the built-in stand-in.`, err);
          done(createProceduralEngineer());
        });
    };
    // The current world's character loads up front. The next world's follows quietly a few
    // seconds after the visitor is in, so switching to it never waits; any other world's
    // loads the moment a switch to it starts.
    const current = () => {
      if (index === world.theme) load();
    };
    current();
    let preload = 0;
    const queueNext = () => {
      window.clearTimeout(preload);
      if (!world.entered || index !== (world.theme + 1) % WORLDS.length) return;
      preload = window.setTimeout(() => {
        // An animated page is rarely idle, so the idle callback gets a deadline.
        const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o: { timeout: number }) => void }).requestIdleCallback;
        if (idle) idle(load, { timeout: 1500 });
        else load();
      }, 3000);
    };
    queueNext();
    const offs = [
      on("theme", () => {
        markReady();
        current();
        queueNext();
      }),
      on("ready", queueNext),
      on("transition", () => {
        if (world.transition && world.pendingTheme === index) load();
      }),
    ];
    return () => {
      alive = false;
      window.clearTimeout(preload);
      offs.forEach((off) => off());
      loaded.delete(index);
      world.loadedWorlds.delete(index);
      d?.dispose();
    };
  }, [index, gl, camera, scene]);

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
    // Only the world on screen (and the one being revealed) needs animating.
    if (world.theme !== index && !(world.transition && world.pendingTheme === index)) return;
    const delta = Math.min(rawDelta, 1 / 20);
    const m = motion.current;
    const cs = characterState;
    g.position.set(cs.x, 0, cs.z);
    shadow.current?.position.set(cs.x, 0.004, cs.z);

    // Walking: face the way they're going. Standing: turn partly toward the camera,
    // so every shot reads as a portrait (and the visitor can drag them round).
    const camYaw = Math.atan2(camera.position.x - cs.x, camera.position.z - cs.z);
    const facing = camYaw * 0.45 + cs.dragYaw;
    const target = facing + wrap(cs.heading + cs.dragYaw - facing) * cs.walk;
    m.yaw += wrap(target - m.yaw) * Math.min(delta * (world.reduced ? 60 : 2.6 + cs.walk * 2), 1);
    g.rotation.y = m.yaw;

    // Look toward the camera, pulled toward wherever the visitor's cursor is.
    tmp.set(camera.position.x - cs.x, camera.position.y - HEAD_HEIGHT, camera.position.z - cs.z);
    const lk = look.current;
    const ly = wrap(Math.atan2(tmp.x, tmp.z) - m.yaw) + world.pointer.x * 0.55;
    const lp = -Math.atan2(tmp.y, Math.hypot(tmp.x, tmp.z)) + world.pointer.y * 0.3;
    const ease = Math.min(delta * 3, 1);
    lk.x += (THREE.MathUtils.clamp(ly, -1.1, 1.1) - lk.x) * ease;
    lk.y += (THREE.MathUtils.clamp(lp, -0.55, 0.45) - lk.y) * ease;

    driver.update({
      time: state.clock.elapsedTime,
      delta,
      walk: cs.walk,
      phase: cs.phase,
      action: cs.action,
      lookYaw: lk.x,
      lookPitch: lk.y,
      pulse: world.pulse,
    });
  });

  return (
    <>
      <group ref={group}>{driver && <primitive object={driver.root} />}</group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} renderOrder={1}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
    </>
  );
};

export default Character;
