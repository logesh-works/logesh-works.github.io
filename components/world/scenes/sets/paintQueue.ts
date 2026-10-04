import * as THREE from "three";

/*
 * Pixel-painted textures (noise-based stone, earth, wood…) cost hundreds of milliseconds
 * each to compute. Painting them in one go froze the page for seconds while a world was
 * built, so the work is queued and done a few milliseconds at a time between frames:
 * the page, the loader and input stay responsive throughout. Each texture is created at
 * once (blank) and refreshed when its pixels are in.
 */

/** Longest stretch of painting before handing the main thread back. */
const SLICE_MS = 8;

type Job = (until: number) => boolean;
const jobs: Job[] = [];
let waiting: (() => void)[] = [];
let scheduled = false;
/** Other background preparation in flight (e.g. a sky bake waiting on its shader). */
let tracked = 0;

const settle = () => {
  if (jobs.length || tracked) return;
  const done = waiting;
  waiting = [];
  done.forEach((fn) => fn());
};

// A zero-delay task (setTimeout(0) gets clamped to 4 ms once nested).
const channel = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
const schedule = () => {
  if (scheduled) return;
  scheduled = true;
  if (channel) channel.port2.postMessage(0);
  else window.setTimeout(pump, 0);
};
const pump = () => {
  scheduled = false;
  const until = performance.now() + SLICE_MS;
  while (jobs.length && performance.now() < until) if (jobs[0](until)) jobs.shift();
  if (jobs.length) schedule();
  else settle();
};
if (channel) channel.port1.onmessage = pump;

/** Resolves once every queued texture has been painted (and every tracked job has finished). */
export const paintIdle = () => (jobs.length || tracked ? new Promise<void>((resolve) => waiting.push(resolve)) : Promise.resolve());

/** Counts an asynchronous preparation step in, so paintIdle also waits for it. */
export const trackPaint = (job: Promise<unknown>) => {
  tracked++;
  job.finally(() => {
    tracked--;
    settle();
  });
};

/**
 * Paints a w × h canvas from a function of (x, y) → [r, g, b] (0–255), a few rows at a
 * time. `after` draws on top once the pixels are in (cracks, joints, pebbles…).
 * The returned texture updates itself when painting finishes.
 */
export const paintTexture = (
  w: number,
  h: number,
  pixel: (x: number, y: number) => [number, number, number],
  configure: (c: HTMLCanvasElement) => THREE.Texture,
  after?: (g: CanvasRenderingContext2D) => void
) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const texture = configure(c);
  const img = g.createImageData(w, h);
  let y = 0;
  jobs.push((until) => {
    for (; y < h && performance.now() < until; y++) {
      for (let x = 0; x < w; x++) {
        const [r, gg, b] = pixel(x, y);
        const o = (y * w + x) * 4;
        img.data[o] = r;
        img.data[o + 1] = gg;
        img.data[o + 2] = b;
        img.data[o + 3] = 255;
      }
    }
    if (y < h) return false;
    g.putImageData(img, 0, 0);
    after?.(g);
    texture.needsUpdate = true;
    return true;
  });
  schedule();
  return texture;
};

/**
 * Draws a canvas texture with ordinary 2D drawing calls spread over several slices: `draw`
 * is a generator that yields every so often (e.g. every few hundred strokes).
 */
export const drawTexture = (
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D) => Iterator<void>,
  configure: (c: HTMLCanvasElement) => THREE.Texture
) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const texture = configure(c);
  const steps = draw(g);
  jobs.push((until) => {
    while (performance.now() < until) {
      if (steps.next().done) {
        texture.needsUpdate = true;
        return true;
      }
    }
    return false;
  });
  schedule();
  return texture;
};

/** Queues a piece of scene building to run in its own slice (so a world builds over several tasks). */
export const queueWork = (work: () => void) => {
  jobs.push(() => {
    work();
    return true;
  });
  schedule();
};
