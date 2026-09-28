"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";

import { chapters } from "@/constants";
import { CHAPTER_BG } from "@/lib/palette";
import { emit, nav, world } from "@/lib/world";

interface BeatInfo {
  el: HTMLElement;
  inner: HTMLElement | null;
  center: number;
  height: number;
  chapter: string;
}

/**
 * Turns page scroll into the world's continuous beat position. Beats are the
 * full-screen blocks marked `data-beat`; `world.beat` is fractional between them.
 * Also: Lenis smooth scrolling, anchor navigation, per-beat CSS progress (`--t`)
 * for typography parallax, chapter changes and the chapter background tint.
 */
const ScrollController = ({ locked }: { locked: boolean }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    world.reduced = reduced;
    let beats: BeatInfo[] = [];
    let frame = 0;

    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-beat]"));
      beats = els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          inner: el.querySelector<HTMLElement>("[data-beat-inner]"),
          center: r.top + window.scrollY + r.height / 2,
          height: r.height,
          chapter: el.closest<HTMLElement>("[data-chapter]")?.dataset.chapter ?? "top",
        };
      });
      world.beatIds = els.map((el) => el.dataset.beat!);
      world.beatSides = els.map((el) => (el.dataset.frame as "left" | "right" | "center") ?? "center");
      emit("beats");
      update();
    };

    const update = () => {
      if (!beats.length) return;
      const vh = window.innerHeight;
      const v = window.scrollY + vh / 2;
      let b = 0;
      if (v <= beats[0].center) b = 0;
      else if (v >= beats[beats.length - 1].center) b = beats.length - 1;
      else {
        for (let i = 0; i < beats.length - 1; i++) {
          if (v < beats[i + 1].center) {
            b = i + (v - beats[i].center) / (beats[i + 1].center - beats[i].center);
            break;
          }
        }
      }
      world.beat = b;

      for (const beat of beats) {
        // Normalise by the taller of viewport and beat so long beats stay readable throughout.
        const t = (v - beat.center) / Math.max(vh, beat.height * 0.85);
        if (Math.abs(t) < 0.45 && !beat.el.dataset.seen) beat.el.dataset.seen = "true";
        if (!reduced && beat.inner && Math.abs(t) < 2) beat.inner.style.setProperty("--t", t.toFixed(3));
      }

      const chapterId = beats[Math.round(b)]?.chapter ?? "top";
      if (chapterId !== world.chapter) {
        world.chapter = chapterId;
        world.chapterIndex = Math.max(0, chapters.findIndex((c) => c.id === chapterId));
        document.documentElement.style.backgroundColor = CHAPTER_BG[chapterId] ?? CHAPTER_BG.top;
        emit("chapter");
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, anchors: true, autoRaf: true });
      lenis.on("scroll", onScroll);
      lenisRef.current = lenis;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    nav.toBeat = (id: string) => {
      const el = document.querySelector<HTMLElement>(`[data-beat="${id}"]`);
      if (!el) return;
      const target = el.getBoundingClientRect().top + window.scrollY - (window.innerHeight - el.offsetHeight) / 2;
      if (lenis) lenis.scrollTo(Math.max(0, target), { duration: 1.6 });
      else window.scrollTo({ top: target });
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(frame);
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
    lenis?.start();
    delete document.documentElement.dataset.locked;
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
