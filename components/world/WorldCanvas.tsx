"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { experience } from "@/constants";
import { emit, setCursorLabel, setHoveredLayer, world, type Quality } from "@/lib/world";

import CameraController from "./CameraController";
import Character from "./character/Character";
import ArchitectureGraph from "./scenes/ArchitectureGraph";
import AwardScene from "./scenes/AwardScene";
import Environment from "./scenes/Environment";
import Pipeline from "./scenes/Pipeline";
import PostmanStation from "./scenes/PostmanStation";
import PostFX from "./scenes/PostFX";
import StudioSet from "./scenes/StudioSet";
import { EVENT_RAIL, SYNC_RAIL } from "./stations";

const TIERS: Record<Quality, { dpr: number; dust: number; packets: number }> = {
  high: { dpr: 1.75, dust: 900, packets: 48 },
  medium: { dpr: 1.4, dust: 520, packets: 32 },
  low: { dpr: 1.2, dust: 260, packets: 20 },
};

const detectQuality = (): Quality => {
  const small = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (small) return "low";
  if (coarse || cores <= 4 || window.innerWidth < 1200) return "medium";
  return "high";
};

const flows = experience[0].engagements ?? [];
const [syncFlow, eventFlow] = flows.filter((e) => e.flow).map((e) => e.flow!);

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
      const fps = sample.current.n / sample.current.t;
      if (fps < 40) {
        setDpr(1);
        if (world.quality === "high") world.quality = "medium";
      }
    }
  });
  return null;
};

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
      camera={{ position: [0, 1.5, 5], fov: 34, near: 0.1, far: 80 }}
      gl={{ antialias: quality !== "low", alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => {
        setHoveredLayer(null);
        setCursorLabel(null);
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
      <Environment dust={tier.dust} />
      <PostFX bloom={quality !== "low"} />
      <StudioSet />
      <CameraController />
      <Character />
      <ArchitectureGraph packets={tier.packets} />
      {syncFlow && <Pipeline flow={syncFlow} from={SYNC_RAIL.from} to={SYNC_RAIL.to} beat="exp-sync" title="Data sync" />}
      {eventFlow && <Pipeline flow={eventFlow} from={EVENT_RAIL.from} to={EVENT_RAIL.to} beat="exp-events" title="Event flow" />}
      <PostmanStation />
      <AwardScene />
    </Canvas>
  );
};

export default WorldCanvas;
