import * as THREE from "three";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js";

import { WaterSim, waterNormalGLSL } from "@/lib/waterSim";

/**
 * The cursor's water, on the 3D stage: the picture is refracted through the ripples
 * the pointer leaves, as if seen through a thin sheet of water, with a faint prism
 * split on the slopes. (The highlights on the water are drawn by the page overlay,
 * so they also cover the HTML on top of the stage.)
 */
export class WaterPass extends Pass {
  private sim = new WaterSim();
  private quad = new FullScreenQuad(
    new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, tWater: { value: null }, texel: { value: this.sim.texel } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform sampler2D tWater;
        uniform vec2 texel;
        varying vec2 vUv;
        ${waterNormalGLSL}
        void main() {
          vec3 n = waterNormal(tWater, vUv, texel);
          vec2 off = n.xy * 0.014;
          vec3 col;
          col.r = texture2D(tDiffuse, vUv + off).r;
          col.g = texture2D(tDiffuse, vUv + off * 1.12).g;
          col.b = texture2D(tDiffuse, vUv + off * 1.24).b;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    })
  );

  /** Advances the ripples. Called every frame, even while the pass is skipped. */
  step(renderer: THREE.WebGLRenderer, deltaTime: number) {
    this.sim.update(renderer, Math.min(Math.max(deltaTime, 1 / 120), 1 / 30));
  }

  /** True while there are ripples to draw. */
  get active() {
    return this.sim.active;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    const m = this.quad.material as THREE.ShaderMaterial;
    m.uniforms.tDiffuse.value = readBuffer.texture;
    m.uniforms.tWater.value = this.sim.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.sim.dispose();
    this.quad.material.dispose();
    this.quad.dispose();
  }
}
