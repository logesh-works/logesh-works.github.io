"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { emit, world, type Quality } from "@/lib/world";

import CameraController from "./CameraController";
import Character from "./character/Character";
import PostFX from "./scenes/PostFX";
import Stage from "./scenes/Stage";

const TIERS: Record<Quality, { dpr: number; dust: number }> = {
  high: { dpr: 1.75, dust: 420 },
  medium: { dpr: 1.4, dust: 260 },
  low: { dpr: 1.2, dust: 140 },
};

const detectQuality = (): Quality => {
  const small = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (small) return "low";
  if (coarse || cores <= 4 || window.innerWidth < 1200) return "medium";
  return "high";
};

/** Signals readiness after the first frames, then steps quality down if the device struggles. */
const Governor = ({ onReady }: { onReady: () => void }) => {
  const { setDpr } = useThree();
  const frames = useRef(0);
  const sample = useRef({ t: 0, n: 0, done: false });

  useFrame((_, delta) => {
    frames.current++;
    if (frames.current === 3) onReady();
    if (frames.current < 30 || sample.current.done) return;
    sample.current.t += delta;
    sample.current.n++;
    if (sample.current.t > 2.5) {
      sample.current.done = true;
      if (sample.current.n / sample.current.t < 40) {
        setDpr(1);
        if (world.quality === "high") world.quality = "medium";
      }
    }
  });
  return null;
};

/** The one WebGL canvas: studio, engineer, scroll camera, post-processing. */
const WorldCanvas = ({ onReady }: { onReady: () => void }) => {
  const [quality] = useState<Quality>(() => detectQuality());
  const [visible, setVisible] = useState(true);
  const tier = TIERS[quality];

  useEffect(() => {
    world.quality = quality;
    const sync = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [quality]);

  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={[1, tier.dpr]}
      camera={{ position: [0, 1.66, 1.3], fov: 32, near: 0.05, far: 60 }}
      gl={{ antialias: quality !== "low", alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      aria-hidden
    >
      <Governor
        onReady={() => {
          world.ready = true;
          emit("ready");
          onReady();
        }}
      />
      <Stage dust={tier.dust} />
      <PostFX bloom={quality !== "low"} />
      <CameraController />
      <Character />
    </Canvas>
  );
};

export default WorldCanvas;
