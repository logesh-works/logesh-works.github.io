"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import SafeBoundary from "@/components/site/SafeBoundary";
import { hasFastWebGL } from "@/lib/webgl";
import { emit, on, world } from "@/lib/world";
import { cn } from "@/lib/utils";

import LoadingScreen from "./LoadingScreen";
import ScrollController from "./ScrollController";

// The whole 3D stage is one lazily-loaded chunk; the page's HTML never waits for it.
const loadWorld = () => import("@/components/world/WorldCanvas");
const WorldCanvas = dynamic(loadWorld, { ssr: false });

const ALL_DONE = { fonts: true, chunk: true, frames: true, character: true, time: true };

/**
 * Home-page runtime: loader, the fixed 3D stage behind everything, and the scroll
 * controller. Without WebGL (or with Save-Data on, or if the stage fails to load) the
 * page keeps its dark studio backdrop and all content still works.
 */
const ExperienceRoot = () => {
  const [mode, setMode] = useState<"pending" | "webgl" | "static">("pending");
  const [steps, setSteps] = useState({ fonts: false, chunk: false, frames: false, character: false, time: false });
  const [entered, setEntered] = useState(false);

  const goStatic = useCallback(() => {
    world.static = true;
    world.ready = true;
    setMode("static");
    setSteps(ALL_DONE);
  }, []);

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const webgl = !saveData && hasFastWebGL();
    world.static = !webgl;
    setMode(webgl ? "webgl" : "static");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem("lk-seen") === "1";
      window.sessionStorage.setItem("lk-seen", "1");
    } catch {
      /* private mode: always show the full intro */
    }
    const minTime = window.setTimeout(() => setSteps((s) => ({ ...s, time: true })), reduced || seen ? 300 : 1800);
    document.fonts?.ready.then(() => setSteps((s) => ({ ...s, fonts: true })));
    const offCharacter = on("character", () => setSteps((s) => ({ ...s, character: true })));
    if (webgl)
      loadWorld()
        .then(() => setSteps((s) => ({ ...s, chunk: true })))
        // The stage's code couldn't be fetched (flaky network, blocker, stale deploy): carry on without it.
        .catch(goStatic);
    else {
      setSteps((s) => ({ ...s, chunk: true, frames: true, character: true }));
      world.ready = true;
    }
    // Never hold visitors hostage: finish loading after 9s whatever happens.
    const bail = window.setTimeout(() => setSteps(ALL_DONE), 9000);
    return () => {
      window.clearTimeout(minTime);
      window.clearTimeout(bail);
      offCharacter();
      // Leaving the home page: the stage is torn down, so the next visit loads it afresh.
      world.ready = false;
      world.characterReady = false;
      world.entered = false;
      world.static = false;
    };
  }, [goStatic]);

  const progress = 0.1 + (steps.fonts ? 0.15 : 0) + (steps.chunk ? 0.25 : 0) + (steps.frames ? 0.15 : 0) + (steps.character ? 0.3 : 0) + (steps.time ? 0.05 : 0);

  const onReady = useCallback(() => setSteps((s) => ({ ...s, frames: true })), []);
  const onDone = useCallback(() => {
    setEntered(true);
    world.entered = true;
    delete document.documentElement.dataset.booting;
    document.documentElement.dataset.entered = "true";
    emit("ready");
  }, []);

  return (
    <>
      <LoadingScreen progress={progress >= 0.999 ? 1 : progress} onDone={onDone} />
      <div aria-hidden className={cn("fixed inset-0 z-[1] transition-opacity duration-[1400ms] ease-out", entered ? "opacity-100" : "opacity-0")}>
        {mode === "webgl" && (
          <SafeBoundary onError={goStatic}>
            <WorldCanvas onReady={onReady} />
          </SafeBoundary>
        )}
        {mode === "static" && <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_60%,#2a2724_0%,#0f0f0f_65%)]" />}
      </div>
      <ScrollController locked={!entered} />
    </>
  );
};

export default ExperienceRoot;
