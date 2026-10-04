"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

import { WaterSim, waterNormalGLSL } from "@/lib/waterSim";
import { hasFastWebGL } from "@/lib/webgl";

/**
 * The cursor as a fingertip drawn through water, over the whole page (loader, copy
 * and stage alike): a transparent layer that shows only the light on the ripples,
 * a glint where a slope catches the light and a soft shadow on the far side. On the
 * home page the stage underneath is also refracted by the same ripples (WaterPass).
 * Mouse and pen only, and never with reduced motion.
 */
const WaterCursor = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Hardware-accelerated WebGL only, as for the stage.
    if (!hasFastWebGL()) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    const resize = () => renderer.setSize(window.innerWidth, window.innerHeight, false);
    resize();
    window.addEventListener("resize", resize);

    const sim = new WaterSim();
    const quad = new FullScreenQuad(
      new THREE.ShaderMaterial({
        uniforms: { tWater: { value: null }, texel: { value: sim.texel } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D tWater;
          uniform vec2 texel;
          varying vec2 vUv;
          ${waterNormalGLSL}
          void main() {
            vec3 n = waterNormal(tWater, vUv, texel);
            vec3 light = normalize(vec3(-0.45, 0.6, 0.65));
            // A tight glint and a broader sheen where slopes face the light; shade where they turn away.
            float facing = dot(n, light);
            float spec = pow(max(dot(reflect(-light, n), vec3(0.0, 0.0, 1.0)), 0.0), 60.0);
            float sheen = smoothstep(0.62, 0.9, facing) * 0.22;
            float shade = smoothstep(0.45, 0.1, facing) * 0.25;
            float slope = 1.0 - n.z;
            float on = smoothstep(0.0005, 0.01, slope);
            vec3 col = vec3(0.92, 0.96, 1.0) * (spec * 0.8 + sheen);
            float a = clamp((spec * 0.9 + sheen + shade) * on, 0.0, 0.85);
            // Premultiplied: light where it glints, a translucent dark where it shades.
            gl_FragColor = vec4(col * on, a);
          }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })
    );
    const mat = quad.material as THREE.ShaderMaterial;

    let raf = 0;
    let last = performance.now();
    let cleared = true;
    const frame = (now: number) => {
      const delta = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      sim.update(renderer, delta);
      if (sim.active) {
        mat.uniforms.tWater.value = sim.texture;
        renderer.setRenderTarget(null);
        renderer.clear();
        quad.render(renderer);
        cleared = false;
      } else if (!cleared) {
        renderer.setRenderTarget(null);
        renderer.clear();
        cleared = true;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      sim.dispose();
      mat.dispose();
      quad.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[190] h-full w-full" />;
};

export default WaterCursor;
