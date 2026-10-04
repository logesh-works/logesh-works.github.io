import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

/**
 * Water under the cursor: a small height-field wave simulation (the classic two-term
 * scheme: each cell's velocity follows its neighbours' average, then height follows
 * velocity, both slowly damped). The pointer drags through it like a fingertip, so
 * rings spread from the path and fade.
 *
 * The 3D stage and the page overlay each run their own copy on their own GL context;
 * both are driven by the same pointer events with the same constants, so they stay
 * in step. `texture` holds height (r) and velocity (g); sample neighbours for slope.
 */

const RES = 256;
const STEPS = 2;
/** Seconds after the pointer stops before the water is left to settle and the simulation sleeps. */
const SLEEP_AFTER = 5;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const updateShader = /* glsl */ `
  precision highp float;
  uniform sampler2D tPrev;
  uniform vec2 texel;
  uniform vec2 dropFrom;
  uniform vec2 dropTo;
  uniform float strength;
  uniform float radius;
  uniform float aspect;
  varying vec2 vUv;

  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec4 info = texture2D(tPrev, vUv);
    float avg = (
      texture2D(tPrev, vUv - vec2(texel.x, 0.0)).r +
      texture2D(tPrev, vUv + vec2(texel.x, 0.0)).r +
      texture2D(tPrev, vUv - vec2(0.0, texel.y)).r +
      texture2D(tPrev, vUv + vec2(0.0, texel.y)).r
    ) * 0.25;
    info.g += (avg - info.r) * 2.0;
    info.g *= 0.986;
    info.r += info.g;
    info.r *= 0.997;

    // The fingertip: a soft trough pressed along the segment the pointer travelled.
    if (strength != 0.0) {
      vec2 p = vUv; p.x *= aspect;
      vec2 a = dropFrom; a.x *= aspect;
      vec2 b = dropTo; b.x *= aspect;
      float d = segDist(p, a, b) / radius;
      float drop = max(0.0, 1.0 - d);
      drop = 0.5 - cos(drop * 3.14159265) * 0.5;
      info.r -= drop * strength;
    }
    gl_FragColor = info;
  }
`;

const target = () =>
  new THREE.WebGLRenderTarget(RES, RES, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
  });

export class WaterSim {
  private a = target();
  private b = target();
  private quad = new FullScreenQuad();
  private mat = new THREE.ShaderMaterial({
    uniforms: {
      tPrev: { value: null },
      texel: { value: new THREE.Vector2(1 / RES, 1 / RES) },
      dropFrom: { value: new THREE.Vector2() },
      dropTo: { value: new THREE.Vector2() },
      strength: { value: 0 },
      radius: { value: 0.013 },
      aspect: { value: 1 },
    },
    vertexShader: vertex,
    fragmentShader: updateShader,
    depthTest: false,
    depthWrite: false,
  });
  private pointer = { x: 0, y: 0, px: 0, py: 0, travel: 0, seen: false };
  private clock = 0;
  private lastMove = -Infinity;
  /** True while there is motion in the water (callers can skip their pass otherwise). */
  active = false;
  readonly texel = new THREE.Vector2(1 / RES, 1 / RES);

  constructor() {
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onDown, { passive: true });
  }

  get texture() {
    return this.a.texture;
  }

  private onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight;
    const p = this.pointer;
    if (!p.seen) {
      p.px = x;
      p.py = y;
      p.seen = true;
    }
    p.travel += Math.hypot((x - p.x) * (window.innerWidth / window.innerHeight), y - p.y);
    p.x = x;
    p.y = y;
    this.lastMove = this.clock;
  };

  /** A click is a single, deeper drop. */
  private onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    this.onMove(e);
    this.pointer.travel += 0.05;
  };

  update(renderer: THREE.WebGLRenderer, delta: number) {
    this.clock += delta;
    this.active = this.clock - this.lastMove < SLEEP_AFTER;
    if (!this.active) return;
    const p = this.pointer;
    const u = this.mat.uniforms;
    u.aspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    const prevTarget = renderer.getRenderTarget();
    for (let s = 0; s < STEPS; s++) {
      u.tPrev.value = this.a.texture;
      // Press harder the faster the pointer moves, up to a gentle limit.
      const push = s === 0 ? Math.min(p.travel * 0.45, 0.022) : 0;
      u.strength.value = push;
      u.dropFrom.value.set(p.px, p.py);
      u.dropTo.value.set(p.x, p.y);
      this.quad.material = this.mat;
      renderer.setRenderTarget(this.b);
      this.quad.render(renderer);
      [this.a, this.b] = [this.b, this.a];
    }
    p.px = p.x;
    p.py = p.y;
    p.travel = 0;
    renderer.setRenderTarget(prevTarget);
  }

  dispose() {
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerdown", this.onDown);
    this.a.dispose();
    this.b.dispose();
    this.mat.dispose();
    this.quad.dispose();
  }
}

/** GLSL to turn the height field into a surface normal at uv. */
export const waterNormalGLSL = /* glsl */ `
  vec3 waterNormal(sampler2D tex, vec2 uv, vec2 texel) {
    float l = texture2D(tex, uv - vec2(texel.x, 0.0)).r;
    float r = texture2D(tex, uv + vec2(texel.x, 0.0)).r;
    float d = texture2D(tex, uv - vec2(0.0, texel.y)).r;
    float u = texture2D(tex, uv + vec2(0.0, texel.y)).r;
    return normalize(vec3(l - r, d - u, 0.02));
  }
`;
