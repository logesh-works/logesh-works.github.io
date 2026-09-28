"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";

import { chapters } from "@/constants";
import { emit, nav, on, world } from "@/lib/world";

interface Stop {
  center: number;
  chapter: string;
}

/**
 * Turns page scroll into the world's continuous step position. Stops are the
 * elements marked `data-beat` (the invisible scroll track plus the footer);
 * `world.beat` is fractional between their centres. Also owns Lenis smooth
 * scrolling, chapter changes and scroll-locking while an overlay is open.
 */
const ScrollController = ({ locked }: { locked: boolean }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    world.reduced = reduced;
    let stops: Stop[] = [];
    let frame = 0;

    const update = () => {
      if (!stops.length) return;
      const v = window.scrollY + window.innerHeight / 2;
      let b = 0;
      if (v >= stops[stops.length - 1].center) b = stops.length - 1;
      else if (v > stops[0].center) {
        for (let i = 0; i < stops.length - 1; i++) {
          if (v < stops[i + 1].center) {
            b = i + (v - stops[i].center) / (stops[i + 1].center - stops[i].center);
            break;
          }
        }
      }
      world.beat = b;

      const chapterId = stops[Math.round(b)]?.chapter ?? "top";
      if (chapterId !== world.chapter) {
        world.chapter = chapterId;
        world.chapterIndex = Math.max(0, chapters.findIndex((c) => c.id === chapterId));
        emit("chapter");
      }
    };

    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-beat]"));
      stops = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { center: r.top + window.scrollY + r.height / 2, chapter: el.dataset.chapter ?? "top" };
      });
      const ids = els.map((el) => el.dataset.beat!);
      if (ids.join() !== world.beatIds.join()) {
        world.beatIds = ids;
        emit("beats");
      }
      update();
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.08, smoothWheel: true, anchors: true, autoRaf: true });
      lenis.on("scroll", onScroll);
      lenisRef.current = lenis;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    nav.toBeat = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 1.6 });
      else el.scrollIntoView();
    };

    // Overlays freeze the page behind them.
    const offPanel = on("panel", () => {
      if (world.panel) lenis?.stop();
      else if (!document.documentElement.dataset.locked) lenis?.start();
    });

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(frame);
      offPanel();
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Hold the page still behind the loader, then honour any #hash (e.g. redirects from /about).
  useEffect(() => {
    const lenis = lenisRef.current;
    if (locked) {
      lenis?.stop();
      document.documentElement.dataset.locked = "true";
      return;
    }
    delete document.documentElement.dataset.locked;
    lenis?.start();
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (target) {
      if (lenis) lenis.scrollTo(target, { immediate: true });
      else target.scrollIntoView();
    }
  }, [locked]);

  return null;
};

export default ScrollController;
