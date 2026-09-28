"use client";

import { useEffect, useRef, useState } from "react";

import { on, world } from "@/lib/world";

/**
 * A two-part cursor: a precise dot and a lagging ring. The ring grows over links,
 * buttons and 3D objects, and shows a short label when one is provided.
 * Fine pointers only, and never with reduced motion.
 */
const Cursor = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    const sync = () => setEnabled(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-cursor");
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let hoverEl: string | null = null;
    let active = false;
    let visible = false;
    let frame = 0;

    const render = () => {
      const text = world.cursorLabel ?? hoverEl;
      const big = active || Boolean(world.cursorLabel);
      if (label.current && label.current.textContent !== (text ?? "")) label.current.textContent = text ?? "";
      ring.current?.classList.toggle("is-active", big);
      ring.current?.classList.toggle("has-label", Boolean(text));
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!visible) {
        visible = true;
        pos.x = target.x;
        pos.y = target.y;
        dot.current?.classList.add("is-visible");
        ring.current?.classList.add("is-visible");
      }
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor-label], summary, label");
      active = Boolean(el);
      hoverEl = el?.dataset.cursorLabel ?? null;
      render();
    };
    const onLeave = () => {
      visible = false;
      dot.current?.classList.remove("is-visible");
      ring.current?.classList.remove("is-visible");
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const offCursor = on("cursor", render);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      offCursor();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200]">
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring">
        <span ref={label} className="cursor-label" />
      </div>
    </div>
  );
};

export default Cursor;
