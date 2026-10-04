"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { emit, world } from "@/lib/world";

import { characterState } from "../characterState";

/** Drag to rotate the character (mouse and pen only, so touch keeps scrolling the page). */
const DragControls = () => {
  const { gl } = useThree();

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

  // Inertia, then an unhurried return to facing the visitor.
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 20);
    if (characterState.dragging) return;
    characterState.dragYaw += characterState.dragVelocity * delta;
    characterState.dragVelocity *= Math.exp(-delta * 4);
    if (performance.now() - characterState.lastDrag > 2500) characterState.dragYaw *= Math.exp(-delta * 0.9);
  });

  return null;
};

export default DragControls;
