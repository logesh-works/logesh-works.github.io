import * as THREE from "three";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";

import { world } from "@/lib/world";

import { stage } from "../stage";

/**
 * The switch between two worlds, after hape.io. While the switch is held the picture
 * ripples like liquid (uWarp) and turns grainy; once it commits (uReveal 0 → 1) a
 * stippled, light-washed circle opens from the centre with the next world inside,
 * grows past the corners while the old world darkens around it, and leaves a dark
 * vignette that lifts as the new world settles.
 */
const RevealShader = {
  uniforms: {
    tFrom: { value: null as THREE.Texture | null },
    tTo: { value: null as THREE.Texture | null },
    uReveal: { value: 0 },
    uWarp: { value: 0 },
    uAspect: { value: 1 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tFrom;
    uniform sampler2D tTo;
    uniform float uReveal;
    uniform float uWarp;
    uniform float uAspect;
    uniform float uTime;
    varying vec2 vUv;

    // Sine-free hash: stays uniform at any input size (a sin hash bands into stripes).
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }

    void main() {
      vec2 c = vUv - 0.5;
      c.x *= uAspect;
      float d = length(c);
      float p = uReveal;

      // Liquid: a slow, flowing displacement field, two scales deep.
      vec2 q = vUv * vec2(uAspect, 1.0) * 2.6;
      vec2 flow = vec2(noise(q + vec2(uTime * 0.8, 0.0)), noise(q + vec2(4.7, uTime * 0.7))) - 0.5;
      flow += (vec2(noise(q * 2.3 + uTime * 1.3), noise(q * 2.3 + 9.1 - uTime * 1.1)) - 0.5) * 0.5;

      vec3 col = texture2D(tFrom, vUv + flow * 0.075 * uWarp).rgb;
      // The old world sinks into shadow as the new one opens.
      col *= 1.0 - 0.45 * smoothstep(0.0, 0.7, p);

      if (p > 0.0) {
        // The circle: its edge dissolves into grain rather than drawing a line.
        float R = mix(0.02, 1.35, smoothstep(0.0, 0.75, p));
        float m = smoothstep(R + 0.24, R - 0.24, d);
        float mask = step(hash(gl_FragCoord.xy + mod(floor(uTime * 50.0), 61.0) * 17.0), m);
        vec3 b = texture2D(tTo, vUv + flow * 0.02 * (1.0 - p)).rgb;
        // It arrives washed in light, brightest at the centre, clearing as it settles.
        float wash = (1.0 - smoothstep(0.3, 1.0, p)) * (1.0 - smoothstep(0.0, 0.8, d));
        b = mix(b, vec3(1.0, 0.985, 0.96), wash * 0.3);
        col = mix(col, b, mask);
        // Dark corners that linger after the circle passes, then lift.
        float vig = smoothstep(0.25, 0.6, p) * (1.0 - smoothstep(0.7, 1.0, p));
        col *= 1.0 - 0.8 * vig * smoothstep(0.3, 0.95, d);
      }

      // Film grain, strongest mid-switch.
      float g = max(uWarp * 0.6, sin(p * 3.14159265)) * 0.32;
      col *= 1.0 + (hash(gl_FragCoord.xy + mod(floor(uTime * 60.0), 53.0) * 29.0) - 0.5) * g * 2.0;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

const makeTarget = (samples: number) => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });

/**
 * Renders the current world, or (mid-switch) the liquid ripple and both worlds through the reveal.
 *
 * GPU memory: with multisampling, the scene is drawn into one multisampled buffer of this
 * pass's own and copied on (the effect chain's buffers then needn't multisample). The two
 * buffers the switch needs are only full size while a switch is running, and shrink back
 * to nothing afterwards.
 */
export class WorldsPass extends Pass {
  private scene: THREE.WebGLRenderTarget | null;
  private from: THREE.WebGLRenderTarget;
  private to: THREE.WebGLRenderTarget;
  private material = new THREE.ShaderMaterial({ ...RevealShader, uniforms: THREE.UniformsUtils.clone(RevealShader.uniforms), depthTest: false, depthWrite: false });
  private quad = new FullScreenQuad(this.material);
  private copy = new FullScreenQuad(new THREE.ShaderMaterial({ ...CopyShader, uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms), depthTest: false, depthWrite: false }));
  private width = 1;
  private height = 1;
  private switching = false;

  constructor(
    private camera: THREE.Camera,
    samples = 4
  ) {
    super();
    this.scene = samples > 0 ? makeTarget(samples) : null;
    this.from = makeTarget(samples);
    this.to = makeTarget(samples);
    this.needsSwap = true;
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.scene?.setSize(width, height);
    if (this.switching) {
      this.from.setSize(width, height);
      this.to.setSize(width, height);
    }
  }

  /** Full-size switch buffers while switching; a single pixel otherwise. */
  private setSwitching(on: boolean) {
    if (on === this.switching) return;
    this.switching = on;
    const w = on ? this.width : 1;
    const h = on ? this.height : 1;
    this.from.setSize(w, h);
    this.to.setSize(w, h);
  }

  private warmed = false;

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    // Build the switch's shader on the first frame, not on the first press (it would stall it).
    if (!this.warmed) {
      this.warmed = true;
      renderer.setRenderTarget(this.from);
      this.quad.render(renderer);
    }
    const current = stage.scenes[world.theme];
    const next = world.transition ? stage.scenes[world.pendingTheme] : null;
    if (!current) return;

    if (!next || (world.reveal <= 0 && world.warp <= 0.001)) {
      this.setSwitching(false);
      if (!this.scene) {
        renderer.setRenderTarget(writeBuffer);
        renderer.clear();
        renderer.render(current, this.camera);
        return;
      }
      renderer.setRenderTarget(this.scene);
      renderer.clear();
      renderer.render(current, this.camera);
      (this.copy.material as THREE.ShaderMaterial).uniforms.tDiffuse.value = this.scene.texture;
      renderer.setRenderTarget(writeBuffer);
      this.copy.render(renderer);
      return;
    }

    this.setSwitching(true);
    renderer.setRenderTarget(this.from);
    renderer.clear();
    renderer.render(current, this.camera);
    // The next world is only drawn once its circle has started to open.
    if (world.reveal > 0) {
      renderer.setRenderTarget(this.to);
      renderer.clear();
      renderer.render(next, this.camera);
    }

    const u = this.material.uniforms;
    u.tFrom.value = this.from.texture;
    u.tTo.value = this.to.texture;
    u.uReveal.value = world.reveal;
    u.uWarp.value = world.warp;
    u.uAspect.value = this.width / this.height;
    // Kept small, so the shader's noise stays precise.
    u.uTime.value = (performance.now() / 1000) % 600;
    renderer.setRenderTarget(writeBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.scene?.dispose();
    this.from.dispose();
    this.to.dispose();
    this.material.dispose();
    this.quad.dispose();
    (this.copy.material as THREE.Material).dispose();
    this.copy.dispose();
  }
}
