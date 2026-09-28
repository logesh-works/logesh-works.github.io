"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import StaticGraph from "@/components/world/StaticGraph";
import { emit, world } from "@/lib/world";
import { cn } from "@/lib/utils";

import LoadingScreen from "./LoadingScreen";
import ScrollController from "./ScrollController";

// The whole 3D world is one lazily-loaded chunk; the page's HTML never waits for it.
const loadWorld = () => import("@/components/world/WorldCanvas");
const WorldCanvas = dynamic(loadWorld, { ssr: false });

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

/**
 * Home-page runtime: loader, the fixed 3D world behind the content, and the scroll
 * controller. Falls back to a static diagram without WebGL or with Save-Data on.
 */
const ExperienceRoot = () => {
  const [mode, setMode] = useState<"pending" | "webgl" | "static">("pending");
  const [steps, setSteps] = useState({ fonts: false, chunk: false, frames: false, time: false });
  const [entered, setEntered] = useState(false);
  const [gate, setGate] = useState(true);

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const webgl = !saveData && hasWebGL();
    setMode(webgl ? "webgl" : "static");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem("lk-seen") === "1";
      setGate(!seen);
      window.sessionStorage.setItem("lk-seen", "1");
    } catch {
      /* private mode: always show the full intro */
    }
    const minTime = window.setTimeout(() => setSteps((s) => ({ ...s, time: true })), reduced || seen ? 300 : 1800);
    document.fonts?.ready.then(() => setSteps((s) => ({ ...s, fonts: true })));
    if (webgl) loadWorld().then(() => setSteps((s) => ({ ...s, chunk: true })));
    else {
      setSteps((s) => ({ ...s, chunk: true, frames: true }));
      world.ready = true;
      emit("ready");
    }
    // Never hold visitors hostage: enter after 9s whatever happens.
    const bail = window.setTimeout(() => setSteps({ fonts: true, chunk: true, frames: true, time: true }), 9000);
    return () => {
      window.clearTimeout(minTime);
      window.clearTimeout(bail);
    };
  }, []);

  const progress =
    0.1 + (steps.fonts ? 0.2 : 0) + (steps.chunk ? 0.35 : 0) + (steps.frames ? 0.3 : 0) + (steps.time ? 0.05 : 0);

  const onReady = useCallback(() => setSteps((s) => ({ ...s, frames: true })), []);
  const onDone = useCallback(() => {
    setEntered(true);
    world.entered = true;
    emit("ready");
    document.documentElement.dataset.entered = "true";
  }, []);

  return (
    <>
      <LoadingScreen progress={progress >= 0.999 ? 1 : progress} gate={gate} onDone={onDone} />
      <div aria-hidden className={cn("world-layer fixed inset-0 z-[1] transition-opacity duration-[1600ms]", entered ? "opacity-100" : "opacity-0")}>
        {mode === "webgl" && <WorldCanvas onReady={onReady} />}
        {mode === "static" && <StaticGraph portrait={false} className="absolute inset-0 m-auto h-full w-full p-10 opacity-40" />}
      </div>
      <ScrollController locked={!entered} />
    </>
  );
};

export default ExperienceRoot;
