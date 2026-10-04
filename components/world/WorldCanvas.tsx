"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { emit, world, type Quality } from "@/lib/world";

import CameraController from "./CameraController";
import DragControls from "./character/DragControls";
import Journey from "./Journey";
import PostFX from "./scenes/PostFX";
import Worlds from "./scenes/Worlds";
import { stage } from "./stage";

const TIERS: Record<Quality, { dust: number; start: number }> = {
  high: { dust: 420, start: 0 },
  medium: { dust: 260, start: 1 },
  low: { dust: 140, start: 3 },
};

/**
 * Rungs of the quality ladder, best first. The governor moves along it to hold the
 * frame rate on whatever device is running the site: resolution first (cheap to
 * change), then multisampling and bloom (each change rebuilds the effect chain once).
 */
const LADDER: { scale: number; msaa: 0 | 2 | 4; bloom: boolean; reflections: boolean }[] = [
  { scale: 1, msaa: 4, bloom: true, reflections: true },
  { scale: 0.85, msaa: 2, bloom: true, reflections: false },
  { scale: 0.72, msaa: 0, bloom: true, reflections: false },
  { scale: 0.62, msaa: 0, bloom: false, reflections: false },
  { scale: 0.5, msaa: 0, bloom: false, reflections: false },
];

/** Most pixels worth drawing: about a 1440 × 900 screen at 1.5×. Beyond it, sharpness gains little and costs a lot. */
const PIXEL_BUDGET = 2.9e6;

const detectQuality = (): Quality => {
  const small = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (small) return "low";
  if (coarse || cores <= 4 || window.innerWidth < 1200) return "medium";
  return "high";
};

/** Pixel ratio for a rung: the screen's own, capped by the pixel budget, then scaled. */
const dprFor = (rung: number) => {
  const own = Math.min(window.devicePixelRatio || 1, 2);
  const budget = Math.sqrt(PIXEL_BUDGET / Math.max(window.innerWidth * window.innerHeight, 1));
  return Math.max(0.5, Math.min(own, budget) * LADDER[rung].scale);
};

/**
 * Signals readiness after the first drawn frames, then keeps watching the frame rate
 * for the whole visit: two seconds in a row under 45 fps step quality down one rung,
 * four seconds in a row at a full 58+ step it back up. A rung that failed is only
 * retried after a cool-down that doubles each time it fails again, so quality settles
 * instead of flipping back and forth (every change rebuilds the effect chain).
 * Frames before the stage draws, during a world switch, from a hidden tab or a long
 * stall are ignored.
 */
const Governor = ({ rung, setRung, onReady }: { rung: number; setRung: (r: number) => void; onReady: () => void }) => {
  const { setDpr } = useThree();
  const s = useRef({ frames: 0, t: 0, n: 0, settle: 2.5, good: 0, bad: 0, failedAt: new Map<number, number>(), fails: new Map<number, number>(), clock: 0 });

  useEffect(() => {
    setDpr(dprFor(rung));
    s.current.settle = 1.5;
    s.current.t = s.current.n = 0;
    const onResize = () => setDpr(dprFor(rung));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [rung, setDpr]);

  useFrame((_, delta) => {
    const g = s.current;
    if (!stage.drawing) return;
    g.frames++;
    if (g.frames === 3) onReady();
    g.clock += delta;
    // A world switch starts the window over; a single stalled frame (main-thread work, not
    // the GPU) is just left out, so a busy device still gets measured.
    if (world.transition) {
      g.t = g.n = 0;
      return;
    }
    if (delta > 0.25) return;
    if (g.settle > 0) {
      g.settle -= delta;
      return;
    }
    g.t += delta;
    g.n++;
    if (g.t < 1) return;
    const fps = g.n / g.t;
    g.t = g.n = 0;
    if (fps < 45 && rung < LADDER.length - 1) {
      g.good = 0;
      if (++g.bad < 2) return;
      g.bad = 0;
      g.failedAt.set(rung, g.clock);
      g.fails.set(rung, (g.fails.get(rung) ?? 0) + 1);
      setRung(rung + 1);
    } else if (fps >= 58 && rung > 0) {
      g.bad = 0;
      g.good++;
      const failed = g.failedAt.get(rung - 1);
      const coolDown = 30 * 2 ** ((g.fails.get(rung - 1) ?? 1) - 1);
      if (g.good >= 4 && (failed === undefined || g.clock - failed > coolDown)) {
        g.good = 0;
        setRung(rung - 1);
      }
    } else g.good = g.bad = 0;
  });
  return null;
};

/** The one WebGL canvas: three worlds and their characters, scroll camera, post-processing. */
const WorldCanvas = ({ onReady }: { onReady: () => void }) => {
  const [quality] = useState<Quality>(() => detectQuality());
  const [visible, setVisible] = useState(true);
  const tier = TIERS[quality];
  const [rung, setRung] = useState(tier.start);
  const step = LADDER[rung];
  // Water cursor: fine pointers only, and never with reduced motion.
  const [cursor] = useState(() => window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Bumped when a lost WebGL context comes back: the stage is rebuilt from scratch on a
  // fresh context rather than patched up on the restored one.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    world.quality = quality;
    const sync = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [quality]);

  return (
    <Canvas
      key={generation}
      frameloop={visible ? "always" : "never"}
      dpr={dprFor(tier.start)}
      camera={{ position: [0, 1.66, 1.3], fov: 32, near: 0.05, far: 300 }}
      // The composer multisamples its own buffers; the canvas itself needs none.
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        // Reading each shader's info log on first use forces the driver (ANGLE on D3D above
        // all) to finish building it on the spot, stalling a frame per shader; the shaders
        // are fixed, so production skips the check (as three.js recommends).
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
        gl.domElement.addEventListener("webglcontextrestored", () => setGeneration((n) => n + 1), { once: true });
      }}
      aria-hidden
    >
      <Governor
        rung={rung}
        setRung={setRung}
        onReady={() => {
          world.ready = true;
          emit("ready");
          onReady();
        }}
      />
      <Worlds dust={tier.dust} reflections={step.reflections} />
      <PostFX bloom={step.bloom} cursor={cursor} msaa={step.msaa} />
      <Journey />
      <CameraController />
      <DragControls />
    </Canvas>
  );
};

export default WorldCanvas;
