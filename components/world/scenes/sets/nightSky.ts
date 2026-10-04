import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

import { compileMaterialsQuietly } from "../../compile";
import { trackPaint } from "./paintQueue";

/** Hash, value noise and fractal noise for the sky shaders. */
export const skyNoiseGLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = p * 2.03 + 17.1;
      a *= 0.5;
    }
    return v;
  }
`;

/**
 * Stars at four magnitudes, crowding by `crowd` (1 = average sky), each with a slow
 * scintillation and a colour by temperature. Needs skyNoiseGLSL and a uTime uniform.
 */
export const starsGLSL = /* glsl */ `
  vec3 stars(vec3 d, float crowd, float time) {
    vec3 col = vec3(0.0);
    for (int k = 0; k < 4; k++) {
      float s = k == 0 ? 180.0 : k == 1 ? 420.0 : k == 2 ? 900.0 : 1700.0;
      vec3 q = d * s;
      vec3 id = floor(q);
      float hh = hash(id);
      float dens = (k == 0 ? 0.003 : k == 1 ? 0.01 : k == 2 ? 0.025 : 0.05) * crowd;
      if (hh < 1.0 - dens) continue;
      float spot = smoothstep(k == 0 ? 0.3 : 0.38, 0.0, length(fract(q) - 0.5));
      float tw = 0.88 + 0.12 * sin(time * (0.8 + 2.0 * hash(id + 3.0)) + hh * 60.0);
      float mag = k == 0 ? 1.2 : k == 1 ? 0.45 : k == 2 ? 0.2 : 0.09;
      float temp = hash(id + 7.0);
      vec3 tint = temp < 0.25 ? vec3(0.78, 0.86, 1.0) : temp > 0.85 ? vec3(1.0, 0.82, 0.62) : vec3(1.0, 0.97, 0.92);
      col += spot * tw * mag * tint;
    }
    return col;
  }
`;

/**
 * Paints the slow-changing part of a night sky once, into an equirectangular image that
 * matches a SphereGeometry's UVs: the Milky Way as a long exposure shows it (a soft,
 * grainy river of unresolved stars, warmer toward the core, cut by dark dust lanes)
 * and a trace of nebula colour. Alpha holds how crowded with stars each part is.
 * `axis` is the band's pole (the band runs round the great circle at right angles to it);
 * `strength` scales its brightness. Rendering it once instead of every frame is most of
 * what keeps the sky cheap.
 */
export const bakeMilkyWay = (gl: THREE.WebGLRenderer, width: number, axis = new THREE.Vector3(0.62, 0.55, 0.56), strength = 1) => {
  const rt = new THREE.WebGLRenderTarget(width, width / 2, { type: THREE.HalfFloatType, depthBuffer: false });
  rt.texture.wrapS = THREE.RepeatWrapping;
  const quad = new FullScreenQuad(
    new THREE.ShaderMaterial({
      uniforms: { uAxis: { value: axis.clone().normalize() }, uStrength: { value: strength } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uAxis;
        uniform float uStrength;
        varying vec2 vUv;
        ${skyNoiseGLSL}
        void main() {
          // The direction SphereGeometry gives this UV.
          float phi = vUv.x * 6.28318530718;
          float theta = (1.0 - vUv.y) * 3.14159265359;
          vec3 d = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));

          vec3 n = uAxis;
          float b = dot(d, n);
          vec3 t1 = normalize(cross(n, abs(n.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
          vec3 t2 = cross(n, t1);
          float along = atan(dot(d, t2), dot(d, t1));
          vec2 uv = vec2(along * 3.0, b * 9.0);
          float band = exp(-b * b * 11.0);
          float core = exp(-b * b * 55.0) * (0.45 + 0.55 * pow(0.5 + 0.5 * cos(along - 0.6), 2.0));
          float cloud = fbm(uv * 1.6);
          float grain = fbm(uv * 14.0 + 7.0) * 0.6 + hash(floor(d * 1400.0)) * 0.4;
          float lanes = smoothstep(0.46, 0.66, fbm(vec2(along * 7.0, b * 24.0) + 5.0)) * smoothstep(0.0, 0.5, core + band * 0.25);
          float glow = (band * (0.35 + 0.65 * cloud) + core * (0.5 + 0.7 * cloud)) * (0.55 + 0.45 * grain);
          glow *= 1.0 - 0.88 * lanes;
          vec3 col = mix(vec3(0.62, 0.66, 0.74), vec3(0.86, 0.78, 0.66), clamp(core * 1.5, 0.0, 1.0)) * glow * 0.075;
          float neb = fbm(uv * 0.9 + 21.0);
          col += core * smoothstep(0.6, 0.85, neb) * vec3(0.05, 0.012, 0.016) * 0.6;
          gl_FragColor = vec4(col * uStrength, (3.0 * band + 5.0 * core) / 8.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    })
  );
  // The bake's shader is heavy: compile it in the background first, then draw it once.
  // The target is returned at once; the world isn't shown until the bake is in (paintIdle).
  const material = quad.material as THREE.ShaderMaterial;
  let alive = true;
  const job = compileMaterialsQuietly(gl, [material], () => alive).then((ok) => {
    if (ok) {
      const prev = gl.getRenderTarget();
      gl.setRenderTarget(rt);
      quad.render(gl);
      gl.setRenderTarget(prev);
    }
    material.dispose();
    quad.dispose();
  });
  rt.addEventListener("dispose", () => {
    alive = false;
  });
  trackPaint(job);
  return rt;
};
