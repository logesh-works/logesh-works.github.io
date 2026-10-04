"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { WORLDS } from "@/lib/themes";
import { world } from "@/lib/world";

import { compileMaterialsQuietly } from "../compile";
import { stage } from "../stage";
import { WaterPass } from "./WaterPass";
import { WorldsPass } from "./WorldsPass";

/**
 * The film finish in one pass (it used to be three): a slight RGB fringe that widens
 * on musical accents and through a world switch, fine animated grain, and each world's
 * vignette toward the frame edges.
 */
const FinishShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uFringe: { value: 0.0006 },
    uGrain: { value: 0.05 },
    uVignette: { value: 0 },
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
    uniform sampler2D tDiffuse;
    uniform float uFringe;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uTime;
    varying vec2 vUv;
    float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 off = (vUv - 0.5) * uFringe * 2.0;
      vec4 c = texture2D(tDiffuse, vUv);
      c.r = texture2D(tDiffuse, vUv + off).r;
      c.b = texture2D(tDiffuse, vUv - off).b;
      c.rgb += (rand(vUv + fract(uTime)) - 0.5) * uGrain * c.rgb;
      float d = length((vUv - 0.5) * 1.42);
      c.rgb *= 1.0 - uVignette * smoothstep(0.3, 1.05, d);
      gl_FragColor = c;
    }
  `,
};

type Chain = { composer: EffectComposer; pass: UnrealBloomPass | null; finish: ShaderPass; water: WaterPass | null; output: OutputPass };

/** Every material a pass draws with (they hang off the pass, its full-screen quads and helpers). */
const passMaterials = (pass: object) => {
  const out = new Set<THREE.Material>();
  const visit = (v: unknown, depth: number) => {
    if (!v || typeof v !== "object") return;
    if (v instanceof THREE.Material) return void out.add(v);
    if (depth === 0 || v instanceof THREE.Texture || v instanceof THREE.WebGLRenderTarget || v instanceof THREE.Camera || v instanceof THREE.BufferGeometry) return;
    (Array.isArray(v) ? v : Object.values(v)).forEach((x) => visit(x, depth - 1));
  };
  visit(pass, 3);
  return Array.from(out);
};

/**
 * Compiles a chain's shaders in the background before it draws its first frame. The output
 * pass picks its tone-mapping defines on its first render, so they're set up front here
 * (mirroring OutputPass.render) and its shader is compiled for drawing to the canvas.
 */
const prepareChain = async (gl: THREE.WebGLRenderer, chain: Chain, alive: () => boolean) => {
  const out = chain.output as unknown as { _outputColorSpace: string | null; _toneMapping: number | null; material: THREE.ShaderMaterial };
  out._outputColorSpace = gl.outputColorSpace;
  out._toneMapping = gl.toneMapping;
  out.material.defines = {};
  if (THREE.ColorManagement.getTransfer(gl.outputColorSpace) === THREE.SRGBTransfer) out.material.defines.SRGB_TRANSFER = "";
  if (gl.toneMapping === THREE.ACESFilmicToneMapping) out.material.defines.ACES_FILMIC_TONE_MAPPING = "";
  out.material.needsUpdate = true;
  const inChain = chain.composer.passes.filter((p) => p !== chain.output).flatMap(passMaterials);
  const ok = await compileMaterialsQuietly(gl, inChain, alive);
  return ok && (await compileMaterialsQuietly(gl, [out.material], alive, true));
};

const disposeChain = (chain: Chain) => {
  // The composer only frees its own two buffers: every pass (the switch's, bloom's, the
  // water's…) holds GPU buffers of its own, so each is disposed too, or every rebuild
  // (quality change) would leak them.
  chain.composer.passes.forEach((pass) => pass.dispose());
  chain.composer.dispose();
};

export interface PostFXProps {
  /** Glow on lights and hot highlights (skipped on the lowest tier). */
  bloom: boolean;
  /** The water cursor (fine pointers only). */
  cursor: boolean;
  /** Multisampling on the scene buffer: 4 on strong GPUs, 0 where it costs too much. */
  msaa: 0 | 2 | 4;
}

/**
 * Renders the stage: the current world (or two worlds through the switch's flare),
 * the cursor's water ripples while there are any, bloom where the device can afford
 * it, then the film finish and output. Takes over rendering. Follows the canvas's
 * pixel ratio, so the quality governor's resolution changes reach every buffer.
 */
const PostFX = ({ bloom, cursor, msaa }: PostFXProps) => {
  const { gl, camera, size, viewport } = useThree();

  const fx = useMemo<Chain>(() => {
    const buffer = gl.getDrawingBufferSize(new THREE.Vector2());
    // The chain's own buffers only carry full-screen passes, so they never multisample; the
    // scene is multisampled in WorldsPass's buffer (and needs no depth here when it is).
    const composer = new EffectComposer(
      gl,
      new THREE.WebGLRenderTarget(buffer.x, buffer.y, { type: THREE.HalfFloatType, depthBuffer: msaa === 0 })
    );
    composer.addPass(new WorldsPass(camera, msaa));
    const water = cursor ? new WaterPass() : null;
    if (water) composer.addPass(water);
    const pass = bloom ? new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.65, 0.88) : null;
    if (pass) composer.addPass(pass);
    const finish = new ShaderPass(FinishShader);
    finish.uniforms.uGrain.value = bloom ? 0.16 : 0.08;
    const output = new OutputPass();
    composer.addPass(output);
    return { composer, pass, finish, water, output };
  }, [bloom, cursor, msaa, gl, camera]);

  // The chain on screen. A new chain (a quality change) is prepared in the background
  // while the current one keeps drawing, then takes over, and the old one is freed.
  const live = useRef<Chain | null>(null);

  useEffect(() => {
    [fx, live.current].forEach((chain) => {
      if (!chain) return;
      chain.composer.setPixelRatio(viewport.dpr);
      chain.composer.setSize(size.width, size.height);
      // Bloom is soft by nature: a third of the resolution is plenty.
      chain.pass?.resolution.set((size.width * viewport.dpr) / 3, (size.height * viewport.dpr) / 3);
    });
  }, [fx, size, viewport.dpr]);

  useEffect(() => {
    let alive = true;
    prepareChain(gl, fx, () => alive).then(() => {
      if (!alive) return;
      const old = live.current;
      live.current = fx;
      if (old && old !== fx) disposeChain(old);
    });
    return () => {
      alive = false;
      // Never went on screen: nothing else will free it.
      if (live.current !== fx) disposeChain(fx);
    };
  }, [fx, gl]);

  useEffect(
    () => () => {
      if (live.current) disposeChain(live.current);
      live.current = null;
      stage.drawing = false;
    },
    []
  );

  // Nothing is drawn until the first world is ready (see Worlds): drawing it earlier
  // would compile its shaders and upload its textures in one long stall.
  const started = useRef(false);

  // Priority 1 replaces R3F's own render call.
  useFrame((state, delta) => {
    const chain = live.current;
    if (!chain) return;
    if (!started.current) {
      if (!world.compiledWorlds.has(world.theme)) return;
      started.current = stage.drawing = true;
    }
    const a = WORLDS[world.theme].scene;
    const b = WORLDS[world.transition ? world.pendingTheme : world.theme].scene;
    const r = world.reveal;
    gl.toneMappingExposure = a.exposure + (b.exposure - a.exposure) * r;
    if (chain.pass) {
      const target = a.bloom + (b.bloom - a.bloom) * r + world.audioLevel * 0.35 + world.pulse * 0.12;
      chain.pass.strength += (target - chain.pass.strength) * Math.min(delta * 4, 1);
    }
    // The water pass only runs while the water is moving.
    if (chain.water) {
      chain.water.step(gl, delta);
      chain.water.enabled = chain.water.active;
    }
    const u = chain.finish.uniforms;
    u.uVignette.value = a.vignette + (b.vignette - a.vignette) * r;
    u.uFringe.value = 0.0006 + world.pulse * 0.0008 + Math.sin(r * Math.PI) * 0.0025;
    u.uTime.value = state.clock.elapsedTime;
    chain.composer.render(delta);
  }, 1);

  return null;
};

export default PostFX;
