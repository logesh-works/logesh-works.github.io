"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { characterState } from "../../characterState";
import { isShown } from "../../stage";
import { disposeGroup } from "./disposeGroup";
import { bakeMilkyWay, skyNoiseGLSL, starsGLSL } from "./nightSky";
import { drawTexture, paintTexture, queueWork } from "./paintQueue";
import { glowTexture, rng } from "./textures";

/** Centre of the walk loop (see Journey): the kolam is drawn round it, and the village stands back from it. */
const CX = 0;
const CZ = -2.4;

// ---------------------------------------------------------------------------
// Noise and canvas helpers
// ---------------------------------------------------------------------------

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let fx = x - ix;
  let fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
const fbm = (x: number, y: number, octaves = 4) => {
  let v = 0;
  let amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise(x, y);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.2;
    amp *= 0.5;
  }
  return v;
};

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
};
const toTexture = (c: HTMLCanvasElement, repeat?: [number, number]) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
};
/** Paints every pixel from a function of (x, y) → [r, g, b] (0–255), in slices (see paintQueue). */
const paint = (
  S: number,
  f: (x: number, y: number) => [number, number, number],
  repeat?: [number, number],
  after?: (g: CanvasRenderingContext2D) => void
) => paintTexture(S, S, f, (c) => toTexture(c, repeat), after);

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------

/** Packed red laterite earth: dust, darker damp patches, grit and the odd pebble. Tiles. */
const earthTexture = () => {
  const S = 512;
  return paint(S, (x, y) => {
    // Periodic noise so the texture tiles: sample on a torus.
    const u = (x / S) * Math.PI * 2;
    const v = (y / S) * Math.PI * 2;
    const nx = Math.cos(u) * 3 + 10;
    const ny = Math.sin(u) * 3 + 10;
    const nz = Math.cos(v) * 3;
    const n = fbm(nx + nz, ny + Math.sin(v) * 3, 5);
    const grit = hash(x, y);
    const k = 0.62 + n * 0.5 + (grit - 0.5) * 0.12;
    return [Math.min(255, 150 * k), Math.min(255, 96 * k), Math.min(255, 64 * k)];
  }, [1, 1], (g) => {
    const r = rng(5);
    for (let i = 0; i < 160; i++) {
      const x = r() * S;
      const y = r() * S;
      const rad = 0.8 + r() * 2.4;
      g.fillStyle = `rgba(${r() < 0.5 ? "70,52,40" : "196,170,140"},${(0.4 + r() * 0.4).toFixed(2)})`;
      g.beginPath();
      g.ellipse(x, y, rad, rad * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
};

/**
 * A village wall: lime-washed upper wall over a red-ochre base band (as Tamil village
 * houses are painted), weathered with stains running down from the eaves, cracks and
 * patches where the lime has flaked to the mud beneath.
 */
const wallTexture = () => {
  const S = 512;
  return paint(S, (x, y) => {
    const n = fbm(x / 40, y / 40, 4);
    const stain = fbm(x / 9, y / 120, 3);
    const t = y / S;
    const flake = fbm(x / 14 + 40, y / 14, 4);
    if (t > 0.72) {
      // Red ochre band.
      const k = 0.75 + n * 0.35;
      return [168 * k, 70 * k, 46 * k];
    }
    let k = 0.86 + n * 0.12 - Math.max(0, stain - 0.58) * 0.45 * (1 - t);
    if (flake > 0.8) {
      const m = 0.6 + n * 0.3;
      return [150 * m, 112 * m, 82 * m];
    }
    k = Math.min(k, 1);
    return [226 * k, 218 * k, 200 * k];
  }, undefined, (g) => {
    // A thin dark line where the band meets the wall, and a few cracks.
    g.fillStyle = "rgba(60,30,20,0.6)";
    g.fillRect(0, S * 0.72 - 2, S, 3);
    const r = rng(13);
    g.strokeStyle = "rgba(70,55,45,0.55)";
    g.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      let x = r() * S;
      let y = r() * S * 0.7;
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 8; s++) {
        x += (r() - 0.5) * 18;
        y += 6 + r() * 12;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
};

/** Thatch: dense, slightly wavy straw laid in courses, sun-bleached grey-gold, darker in the gaps. */
const thatchTexture = () => {
  const S = 512;
  // 9000 strokes: drawn a few hundred at a time (see paintQueue).
  return drawTexture(S, S, (g) => thatchStrokes(g, S), (c) => toTexture(c, [3, 2]));
};
function* thatchStrokes(g: CanvasRenderingContext2D, S: number): Iterator<void> {
  g.fillStyle = "#5a4a32";
  g.fillRect(0, 0, S, S);
  const r = rng(21);
  for (let i = 0; i < 9000; i++) {
    if (i % 300 === 0) yield;
    const x = r() * S;
    const y = r() * S;
    const len = 14 + r() * 30;
    const tone = 120 + r() * 90;
    g.strokeStyle = `rgba(${tone | 0},${(tone * 0.86) | 0},${(tone * 0.6) | 0},${(0.35 + r() * 0.5).toFixed(2)})`;
    g.lineWidth = 0.6 + r() * 1.2;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (r() - 0.5) * 4, y + len / 2, x + (r() - 0.5) * 6, y + len);
    g.stroke();
  }
  // Courses: darker horizontal bands where each layer overlaps the next.
  for (let y = 0; y < S; y += 64) {
    const grd = g.createLinearGradient(0, y, 0, y + 14);
    grd.addColorStop(0, "rgba(30,22,12,0.5)");
    grd.addColorStop(1, "rgba(30,22,12,0)");
    g.fillStyle = grd;
    g.fillRect(0, y, S, 14);
  }
}

/** Old wood: dark, grainy planks. */
const woodTexture = () => {
  const S = 256;
  return paint(S, (x, y) => {
    const grain = fbm(x / 60, y / 4, 4);
    const plank = Math.floor(x / 64);
    const gap = x % 64 < 2 ? 0.5 : 1;
    const k = (0.45 + grain * 0.4 + hash(plank, 3) * 0.12) * gap;
    return [96 * k, 66 * k, 44 * k];
  });
};

/** Fired brick, roughly laid, for the well. */
const brickTexture = () => {
  const S = 256;
  return paint(S, (x, y) => {
    const row = Math.floor(y / 21);
    const off = row % 2 ? 22 : 0;
    const col = Math.floor((x + off) / 44);
    const mortar = y % 21 < 3 || (x + off) % 44 < 3;
    const n = fbm(x / 10, y / 10, 3);
    if (mortar) return [120 + n * 30, 110 + n * 30, 96 + n * 26];
    const k = 0.7 + hash(col, row) * 0.3 + n * 0.15;
    return [150 * k, 76 * k, 52 * k];
  }, [4, 1]);
};

/** Bark of the coconut palm: grey with the rings of old leaf scars. */
const palmBarkTexture = () => {
  const S = 128;
  return paint(S, (x, y) => {
    const ring = 0.7 + 0.3 * Math.pow(Math.abs(Math.sin((y / S) * Math.PI * 6)), 0.5);
    const n = fbm(x / 8, y / 30, 3);
    const k = ring * (0.6 + n * 0.4);
    return [118 * k, 104 * k, 88 * k];
  }, [1, 6]);
};

/** A coconut frond with alpha: a curved midrib and fine leaflets drooping from it. */
const frondTexture = () => {
  const W = 128;
  const H = 512;
  const { c, g } = canvas(W, H);
  const r = rng(9);
  g.lineCap = "round";
  for (let i = 0; i < 90; i++) {
    const t = i / 90;
    const y = 20 + t * (H - 40);
    const len = (W / 2 - 6) * Math.sin(Math.PI * (0.15 + t * 0.85)) * (0.85 + r() * 0.2);
    [-1, 1].forEach((side) => {
      const tone = 60 + r() * 50;
      g.strokeStyle = `rgb(${(tone * 0.55) | 0},${tone | 0},${(tone * 0.38) | 0})`;
      g.lineWidth = 2 + r();
      g.beginPath();
      g.moveTo(W / 2, y);
      g.quadraticCurveTo(W / 2 + side * len * 0.6, y + 6, W / 2 + side * len, y + 22 + r() * 10);
      g.stroke();
    });
  }
  g.strokeStyle = "#6b6a3a";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(W / 2, 0);
  g.lineTo(W / 2, H);
  g.stroke();
  const t = toTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** A cluster of banyan leaves with alpha: many small oval leaves in layered greens. */
const leafClusterTexture = () => {
  const S = 256;
  const { c, g } = canvas(S, S);
  const r = rng(31);
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.6) * S * 0.44;
    const x = S / 2 + Math.cos(a) * d;
    const y = S / 2 + Math.sin(a) * d;
    const shade = 0.45 + r() * 0.5 - (d / S) * 0.3;
    g.fillStyle = `rgb(${(48 * shade) | 0},${(86 * shade) | 0},${(40 * shade) | 0})`;
    g.beginPath();
    g.ellipse(x, y, 6 + r() * 5, 3.5 + r() * 2.5, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  return toTexture(c);
};

/**
 * A kolam in rice-flour white, as drawn each dawn before a Tamil home: a grid of
 * dots (pulli) with a continuous line weaving round them, inside a border of loops.
 */
const kolamTexture = () => {
  const S = 1024;
  const { c, g } = canvas(S, S);
  g.clearRect(0, 0, S, S);
  g.strokeStyle = "rgba(245,240,228,0.92)";
  g.fillStyle = "rgba(245,240,228,0.95)";
  g.lineCap = "round";
  g.lineWidth = 7;
  const cx = S / 2;
  const n = 7;
  const step = 72;
  const start = cx - ((n - 1) / 2) * step;
  // Diamond of dots: rows widen then narrow.
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (Math.abs(row - 3) + Math.abs(col - 3) > 3) continue;
      const x = start + col * step;
      const y = start + row * step;
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
      // A petal loop round each dot, the strands meeting their neighbours'.
      g.beginPath();
      g.moveTo(x, y - step / 2);
      g.quadraticCurveTo(x + step / 2, y - step / 2, x + step / 2, y);
      g.quadraticCurveTo(x + step / 2, y + step / 2, x, y + step / 2);
      g.quadraticCurveTo(x - step / 2, y + step / 2, x - step / 2, y);
      g.quadraticCurveTo(x - step / 2, y - step / 2, x, y - step / 2);
      g.stroke();
    }
  }
  // Rings and an outer border of loops.
  [330, 350].forEach((rad) => {
    g.lineWidth = 6;
    g.beginPath();
    g.arc(cx, cx, rad, 0, Math.PI * 2);
    g.stroke();
  });
  g.lineWidth = 6;
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    const x = cx + Math.cos(a) * 395;
    const y = cx + Math.sin(a) * 395;
    g.beginPath();
    g.arc(x, y, 30, a + Math.PI * 0.5, a + Math.PI * 1.5, true);
    g.stroke();
    g.beginPath();
    g.arc(cx + Math.cos(a) * 440, cx + Math.sin(a) * 440, 7, 0, Math.PI * 2);
    g.fill();
  }
  const t = toTexture(c);
  return t;
};

/**
 * The far horizon, drawn as a band of silhouettes: a ragged line of palms and scrub,
 * and a temple gopuram rising above them in the haze. Alpha above the skyline.
 */
const horizonTexture = () => {
  const W = 2048;
  const H = 256;
  const { c, g } = canvas(W, H);
  const r = rng(77);
  const base = H - 30;
  g.fillStyle = "#000";
  // Scrub line.
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 6) g.lineTo(x, base - 18 - fbm(x / 40, 1, 4) * 30);
  g.lineTo(W, H);
  g.fill();
  // Palms: thin leaning trunks with a burst of fronds.
  for (let i = 0; i < 46; i++) {
    const x = r() * W;
    const h = 60 + r() * 90;
    const lean = (r() - 0.5) * 30;
    g.strokeStyle = "#000";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x, base);
    g.quadraticCurveTo(x + lean * 0.3, base - h * 0.5, x + lean, base - h);
    g.stroke();
    for (let f = 0; f < 9; f++) {
      const a = -Math.PI / 2 + (f / 8 - 0.5) * 3.4 + (r() - 0.5) * 0.3;
      const len = 22 + r() * 16;
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(x + lean, base - h);
      g.quadraticCurveTo(
        x + lean + Math.cos(a) * len * 0.6,
        base - h + Math.sin(a) * len * 0.6 - 6,
        x + lean + Math.cos(a) * len,
        base - h + Math.sin(a) * len + 10
      );
      g.stroke();
    }
  }
  // A gopuram: a tapering tower of storeys under a barrel-vaulted crown with finials.
  const gx = W * 0.62;
  const storeys = 7;
  for (let s = 0; s < storeys; s++) {
    const w0 = 120 - s * 13;
    const y0 = base - s * 22;
    g.fillRect(gx - w0 / 2, y0 - 22, w0, 22);
    // Ledge.
    g.fillRect(gx - w0 / 2 - 4, y0 - 4, w0 + 8, 4);
  }
  const topY = base - storeys * 22;
  g.beginPath();
  g.ellipse(gx, topY, 34, 16, 0, Math.PI, 0);
  g.fill();
  for (let k = -2; k <= 2; k++) {
    g.fillRect(gx + k * 12 - 1.5, topY - 30, 3, 16);
    g.beginPath();
    g.arc(gx + k * 12, topY - 31, 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = toTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
};

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------

/**
 * A clear, moonless-dark village night far from any city: near-black overhead, the
 * Milky Way arching high across the sky, dense stars dimming toward the horizon where
 * the air is thick, a thin band of haze along the skyline faintly warmed by the
 * village's own lamps, and a half moon low on one side with the halo the haze gives it.
 */
const skyMaterial = (moon: THREE.Vector3, milkyWay: THREE.Texture) =>
  new THREE.ShaderMaterial({
    uniforms: { uMoon: { value: moon }, uTime: { value: 0 }, tMilkyWay: { value: milkyWay } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      varying vec2 vUv;
      void main() {
        vDir = normalize(position);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uMoon;
      uniform float uTime;
      uniform sampler2D tMilkyWay;
      varying vec3 vDir;
      varying vec2 vUv;
      ${skyNoiseGLSL}
      ${starsGLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        // Airglow: a deep navy that only lifts near the horizon.
        vec3 col = mix(vec3(0.03, 0.04, 0.07), vec3(0.006, 0.009, 0.02), smoothstep(0.0, 0.35, h));
        col = mix(col, vec3(0.002, 0.003, 0.008), smoothstep(0.35, 0.9, h));
        // Extinction: the thick air near the horizon dims the sky's detail.
        float clear = smoothstep(0.02, 0.3, h);
        vec4 mw = texture2D(tMilkyWay, vUv);
        col += mw.rgb * clear;
        col += stars(d, 1.0 + 8.0 * mw.a, uTime) * (0.15 + 0.85 * clear);
        // Village lamplight scattered in the low haze.
        col += vec3(0.05, 0.03, 0.015) * exp(-max(h, 0.0) * 14.0) * 0.6;
        // The half moon, lit from one side, and the soft corona round it.
        float m = dot(d, uMoon);
        if (m > 0.9995) {
          vec3 mx = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0)));
          vec3 my = cross(mx, uMoon);
          vec2 q = vec2(dot(d, mx), dot(d, my)) / 0.0105;
          float r = length(q);
          if (r < 1.0) {
            float lit = smoothstep(-0.15, 0.25, q.x + 0.1 * q.y);
            float maria = 0.85 + 0.15 * noise(q * 3.0 + 4.0);
            col = mix(col + vec3(0.02), vec3(1.0, 0.97, 0.9) * 1.4 * maria, lit);
          }
        }
        col += vec3(0.55, 0.62, 0.8) * pow(max(m, 0.0), 900.0) * 0.5;
        col += vec3(0.35, 0.4, 0.55) * pow(max(m, 0.0), 60.0) * 0.06;
        // Below the horizon: the dark plain under the haze.
        col = mix(col, vec3(0.012, 0.012, 0.018), smoothstep(0.0, -0.05, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

// ---------------------------------------------------------------------------
// The set
// ---------------------------------------------------------------------------

/**
 * World 02, Old Village: a South Indian village at dusk. The elder walks a circle on
 * packed red earth round a white kolam. Around him, set back: mud-walled houses
 * lime-washed over a red-ochre base, under deep thatch, each with a raised thinnai and
 * oil lamps; a vast banyan with its aerial roots, coconut palms, a brick well with its
 * pulley, haystacks, clay pots, a bullock cart and a rope cot. Beyond, a line of palms
 * and a temple gopuram in the haze, under a blue-hour sky with the last of the sunset,
 * a rising moon and the first stars. Smoke drifts from a cooking fire; a few fireflies.
 */
const VillageSet = () => {
  const { gl } = useThree();
  const set = useMemo(() => {
    const g = new THREE.Group();
    const r = rng(37);
    const low = world.quality === "low";
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    // --- Sky (turns with the walker so the sunset glow stays behind them) ---------
    const moonDir = v(0.62, 0.3, -0.73).normalize();
    // The Milky Way arches high behind the walker, from horizon to horizon.
    const milkyWay = bakeMilkyWay(gl, low ? 1024 : 2048, v(0.85, 0.35, 0.38), 1.25);
    const skyMat = skyMaterial(moonDir, milkyWay.texture);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24), skyMat);
    sky.renderOrder = -10;
    g.add(sky);
    // Moonlight: cool, soft, from low on one side.
    const moonLight = new THREE.DirectionalLight("#a9b9e6", 0.9);
    moonLight.position.copy(moonDir).multiplyScalar(40);
    sky.add(moonLight);

    // --- Ground ---------------------------------------------------------------
    const earth = earthTexture();
    earth.repeat.set(14, 14);
    const groundGeo = new THREE.PlaneGeometry(110, 110, 110, 110);
    groundGeo.rotateX(-Math.PI / 2);
    const gp = groundGeo.attributes.position;
    const colors = new Float32Array(gp.count * 3);
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i);
      const z = gp.getZ(i);
      const d = Math.hypot(x - CX, z - CZ);
      // Flat where people walk; gentle swells further out.
      const rise = Math.max(0, d - 14) * 0.02;
      gp.setY(i, (fbm(x * 0.06, z * 0.06, 3) - 0.5) * 1.2 * Math.min(1, Math.max(0, (d - 9) / 8)) + rise);
      // Darker, greener toward the fields; trodden lighter near the centre.
      const trodden = Math.max(0, 1 - d / 7);
      const field = Math.min(1, Math.max(0, (d - 18) / 14));
      colors[i * 3] = 1 + trodden * 0.12 - field * 0.45;
      colors[i * 3 + 1] = 1 + trodden * 0.1 - field * 0.25;
      colors[i * 3 + 2] = 1 + trodden * 0.08 - field * 0.4;
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: earth, color: "#6a5f5a", vertexColors: true, roughness: 0.97 }));
    ground.position.set(CX, 0, CZ);
    g.add(ground);

    // The kolam, round the walk.
    const kolam = new THREE.Mesh(
      new THREE.PlaneGeometry(6.6, 6.6),
      new THREE.MeshStandardMaterial({ map: kolamTexture(), color: "#a9adb8", transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
    );
    kolam.rotation.x = -Math.PI / 2;
    kolam.position.set(CX, 0.01, CZ);
    g.add(kolam);

    // --- Materials ------------------------------------------------------------
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.95 });
    const thatchMap = thatchTexture();
    const thatch = new THREE.MeshStandardMaterial({ map: thatchMap, roughness: 1, side: THREE.DoubleSide });
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.9 });
    const lime = new THREE.MeshStandardMaterial({ color: "#d9d0bd", roughness: 0.9 });
    const terracotta = new THREE.MeshStandardMaterial({ color: "#9a4b2a", roughness: 0.8 });
    const glowMap = glowTexture();
    const windowMat = new THREE.MeshBasicMaterial({ color: "#ff9a40", toneMapped: false });

    // Oil lamps (diyas): a flame sprite each; a few share a light.
    const flameC = canvas(32, 64);
    const fg = flameC.g.createRadialGradient(16, 50, 1, 16, 42, 30);
    fg.addColorStop(0, "rgba(255,250,220,1)");
    fg.addColorStop(0.3, "rgba(255,190,90,0.9)");
    fg.addColorStop(1, "rgba(255,90,10,0)");
    flameC.g.fillStyle = fg;
    flameC.g.beginPath();
    flameC.g.moveTo(16, 2);
    flameC.g.bezierCurveTo(28, 26, 30, 46, 16, 62);
    flameC.g.bezierCurveTo(2, 46, 4, 26, 16, 2);
    flameC.g.fill();
    const flameMat = new THREE.SpriteMaterial({ map: toTexture(flameC.c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const haloMat = new THREE.SpriteMaterial({ map: glowMap, color: "#ff9a3c", transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const diyaGeo = new THREE.SphereGeometry(0.07, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const flames: THREE.Sprite[] = [];
    const lampLights: THREE.PointLight[] = [];
    const diya = (parent: THREE.Object3D, x: number, y: number, z: number, light = false) => {
      const cup = new THREE.Mesh(diyaGeo, terracotta);
      cup.position.set(x, y + 0.05, z);
      parent.add(cup);
      const f = new THREE.Sprite(flameMat);
      f.scale.set(0.09, 0.17, 1);
      f.center.set(0.5, 0.05);
      f.position.set(x, y + 0.06, z);
      f.userData.seed = r() * 10;
      parent.add(f);
      flames.push(f);
      const h = new THREE.Sprite(haloMat);
      h.scale.setScalar(0.55);
      h.position.set(x, y + 0.14, z);
      parent.add(h);
      if (light) {
        const l = new THREE.PointLight("#ff9a45", 3.2, 8, 1.8);
        l.position.set(x, y + 0.4, z);
        parent.add(l);
        lampLights.push(l);
      }
    };

    // --- Houses -----------------------------------------------------------------
    /** A mud house with a gable roof of thatch, a raised thinnai in front, a door and a lit window. */
    const house = (x: number, z: number, w: number, d: number, light: boolean) => {
      const h = new THREE.Group();
      const H = 2.3;
      const walls = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat);
      walls.position.y = H / 2;
      h.add(walls);
      // Gable roof: two sloping slabs of thatch with a deep overhang, and the end triangles.
      const pitch = 0.62;
      const half = d / 2 + 0.55;
      const slope = half / Math.cos(pitch);
      [-1, 1].forEach((side) => {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 1.0, 0.22, slope), thatch);
        slab.position.set(0, H + Math.sin(pitch) * slope * 0.5 - 0.05, side * Math.cos(pitch) * slope * 0.5);
        slab.rotation.x = side * pitch;
        h.add(slab);
      });
      const gable = new THREE.Shape();
      gable.moveTo(-d / 2, 0);
      gable.lineTo(d / 2, 0);
      gable.lineTo(0, Math.tan(pitch) * (d / 2));
      gable.closePath();
      const gableGeo = new THREE.ExtrudeGeometry(gable, { depth: w - 0.02, bevelEnabled: false });
      const gables = new THREE.Mesh(gableGeo, wallMat);
      gables.rotation.y = Math.PI / 2;
      gables.position.set(-(w - 0.02) / 2, H, 0);
      h.add(gables);
      // Front: the thinnai (a raised, lime-washed platform), the door, a window, pillars.
      const thinnai = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, 0.9), lime);
      thinnai.position.set(0, 0.225, d / 2 + 0.45);
      h.add(thinnai);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.75, 0.08), wood);
      door.position.set(-w * 0.18, 0.875 + 0.02, d / 2 + 0.04);
      h.add(door);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.92, 0.06), wood);
      frame.position.set(-w * 0.18, 0.96, d / 2 + 0.01);
      h.add(frame);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), windowMat);
      win.position.set(w * 0.24, 1.45, d / 2 + 0.012);
      h.add(win);
      for (let b = 0; b < 4; b++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), wood);
        bar.position.set(w * 0.24 - 0.24 + b * 0.16, 1.45, d / 2 + 0.03);
        h.add(bar);
      }
      [-w / 2 + 0.15, w / 2 - 0.15].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, H - 0.4, 8), wood);
        pillar.position.set(px, 0.45 + (H - 0.45) / 2, d / 2 + 0.82);
        h.add(pillar);
      });
      // Lamps on the thinnai.
      diya(h, -w * 0.38, 0.45, d / 2 + 0.6, light);
      diya(h, w * 0.06, 0.45, d / 2 + 0.7);
      h.position.set(x, 0, z);
      // Face the centre of the village.
      h.rotation.y = Math.atan2(CX - x, CZ - z);
      g.add(h);
      return h;
    };
    const houses = [
      house(-9.5, -11.5, 5.2, 3.6, true),
      house(1.5, -15.5, 6.0, 3.8, false),
      house(11.5, -10.5, 5.0, 3.4, true),
      house(-14, -1.5, 4.6, 3.4, false),
      house(14.5, 1.0, 4.8, 3.4, false),
    ];

    // A round hut with a conical thatch whose eaves are ragged.
    const roundRoofGeo = new THREE.ConeGeometry(2.6, 2.2, 64, 28, true);
    const rp = roundRoofGeo.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const y = rp.getY(i);
      if (y < -1.0) {
        const a = Math.atan2(rp.getZ(i), rp.getX(i));
        const ragged = 1 + (hash(Math.floor(a * 30), 7) - 0.5) * 0.08;
        rp.setXYZ(i, rp.getX(i) * ragged, y - hash(Math.floor(a * 40), 3) * 0.15, rp.getZ(i) * ragged);
      }
    }
    roundRoofGeo.computeVertexNormals();
    // The cone's own UVs wrap the thatch round it; finer repeats so the straw runs down
    // the roof in courses instead of showing the texture's tiles.
    const roundThatchMap = thatchMap.clone();
    roundThatchMap.repeat.set(14, 4);
    roundThatchMap.rotation = Math.PI / 2;
    roundThatchMap.needsUpdate = true;
    const roundThatch = new THREE.MeshStandardMaterial({ map: roundThatchMap, roughness: 1, side: THREE.DoubleSide });
    [
      [-7, 7.5],
      [8.5, 8.5],
    ].forEach(([x, z]) => {
      const hut = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.75, 2.0, 28), wallMat);
      wall.position.y = 1;
      hut.add(wall);
      const roof = new THREE.Mesh(roundRoofGeo, roundThatch);
      roof.position.y = 3.0;
      hut.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.5, 0.1), wood);
      door.position.set(0, 0.75, 1.72);
      hut.add(door);
      hut.position.set(x, 0, z);
      hut.rotation.y = Math.atan2(CX - x, CZ - z);
      g.add(hut);
    });

    // Built in a slice of its own (see paintQueue).
    queueWork(() => {
      // --- The banyan ----------------------------------------------------------
      const bark = new THREE.MeshStandardMaterial({ color: "#5d4f43", roughness: 1 });
      const banyan = new THREE.Group();
      // A fluted trunk of several stems grown together.
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 5.5, 10), bark);
        stem.position.set(Math.cos(a) * 0.55, 2.75, Math.sin(a) * 0.55);
        stem.rotation.z = Math.cos(a) * 0.08;
        stem.rotation.x = Math.sin(a) * 0.08;
        banyan.add(stem);
      }
      // Great limbs reaching out.
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + r() * 0.4;
        const len = 4 + r() * 2.5;
        const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, len, 8), bark);
        limb.position.set(Math.cos(a) * len * 0.42, 5.2 + r() * 0.8, Math.sin(a) * len * 0.42);
        limb.rotation.z = -Math.cos(a) * 1.15;
        limb.rotation.x = Math.sin(a) * 1.15;
        banyan.add(limb);
      }
      // Aerial roots hanging straight down from the limbs; some reach the ground.
      const rootGeo = new THREE.CylinderGeometry(0.03, 0.05, 1, 5);
      const roots = new THREE.InstancedMesh(rootGeo, bark, low ? 30 : 60);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < roots.count; i++) {
        const a = r() * Math.PI * 2;
        const rad = 1.4 + r() * 4.2;
        const top = 5.4 + r() * 1;
        const len = r() < 0.3 ? top : 1 + r() * 3;
        m4.compose(v(Math.cos(a) * rad, top - len / 2, Math.sin(a) * rad), new THREE.Quaternion(), v(r() < 0.3 ? 2 : 1, len, r() < 0.3 ? 2 : 1));
        roots.setMatrixAt(i, m4);
      }
      banyan.add(roots);
      // The canopy: hundreds of leaf-cluster cards in a broad, low dome.
      const leafMat = new THREE.MeshStandardMaterial({ map: leafClusterTexture(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
      const cardGeo = new THREE.PlaneGeometry(2.2, 2.2);
      const cards = new THREE.InstancedMesh(cardGeo, leafMat, low ? 160 : 320);
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      for (let i = 0; i < cards.count; i++) {
        const a = r() * Math.PI * 2;
        const rad = Math.pow(r(), 0.6) * 7;
        const y = 6.4 + (1 - rad / 7) * 2.6 + (r() - 0.5) * 1.6;
        e.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
        q.setFromEuler(e);
        const s = 0.8 + r() * 0.7;
        m4.compose(v(Math.cos(a) * rad, y, Math.sin(a) * rad), q, v(s, s, s));
        cards.setMatrixAt(i, m4);
      }
      banyan.add(cards);
      // A raised platform of stone round its foot, as village banyans have.
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.5, 24), lime);
      platform.position.y = 0.25;
      banyan.add(platform);
      banyan.position.set(-12, 0, -18);
      g.add(banyan);
    });

    // --- Coconut palms ------------------------------------------------------------
    const palmBark = new THREE.MeshStandardMaterial({ map: palmBarkTexture(), roughness: 1 });
    const frondMat = new THREE.MeshStandardMaterial({ map: frondTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
    // One drooping frond: a long plane bent down along its length.
    const frondGeo = new THREE.PlaneGeometry(1.0, 4.2, 1, 12);
    frondGeo.translate(0, 2.1, 0);
    const fp = frondGeo.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      const t = fp.getY(i) / 4.2;
      fp.setXYZ(i, fp.getX(i) * (1 - t * 0.3), fp.getY(i) * (1 - t * 0.2), -Math.pow(t, 1.8) * 2.2);
    }
    frondGeo.computeVertexNormals();
    const coconutMat = new THREE.MeshStandardMaterial({ color: "#5a4a1e", roughness: 0.8 });
    const palm = (x: number, z: number, height: number, lean: number, dir: number) => {
      const p = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        v(0, 0, 0),
        v(Math.cos(dir) * lean * 0.2, height * 0.4, Math.sin(dir) * lean * 0.2),
        v(Math.cos(dir) * lean * 0.6, height * 0.75, Math.sin(dir) * lean * 0.6),
        v(Math.cos(dir) * lean, height, Math.sin(dir) * lean),
      ]);
      const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.17, 8, false), palmBark);
      p.add(trunk);
      const crown = new THREE.Group();
      crown.position.copy(curve.getPoint(1));
      for (let f = 0; f < 13; f++) {
        const fr = new THREE.Mesh(frondGeo, frondMat);
        fr.rotation.set(-0.4 - r() * 0.7, (f / 13) * Math.PI * 2 + r() * 0.3, 0, "YXZ");
        fr.scale.setScalar(0.85 + r() * 0.3);
        crown.add(fr);
      }
      for (let c = 0; c < 5; c++) {
        const nut = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), coconutMat);
        const a = (c / 5) * Math.PI * 2;
        nut.position.set(Math.cos(a) * 0.2, -0.2, Math.sin(a) * 0.2);
        crown.add(nut);
      }
      p.add(crown);
      p.position.set(x, 0, z);
      g.add(p);
      return crown;
    };
    const crowns = [
      palm(6.5, -14, 9, 1.4, 2.4),
      palm(9, -13, 10.5, 2.2, 0.6),
      palm(-4.5, -16.5, 8.5, 1.2, 1.8),
      palm(16, -5, 9.5, 1.8, 3.6),
      palm(-16, 5.5, 10, 2.0, 5.2),
      palm(4, 13, 9, 1.6, 4.4),
      palm(-2, 15, 10.5, 2.4, 1.2),
      palm(17.5, 10, 8.5, 1.2, 2.8),
    ];

    // Built in a slice of its own (see paintQueue), so the village doesn't build in one long task.
    queueWork(() => {
      // --- The well -------------------------------------------------------------
      const brick = new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 0.95 });
      const well = new THREE.Group();
      const wellWall = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.95, 24, 1, true), brick);
      wellWall.material = brick.clone();
      (wellWall.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      wellWall.position.y = 0.475;
      well.add(wellWall);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.1, 8, 32), lime);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.97;
      well.add(rim);
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.98, 24), new THREE.MeshStandardMaterial({ color: "#0b1016", roughness: 0.05, metalness: 0.3 }));
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.2;
      well.add(water);
      [-1.15, 1.15].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.14), wood);
        post.position.set(px, 1.15, 0);
        well.add(post);
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), wood);
      beam.rotation.z = Math.PI / 2;
      beam.position.y = 2.2;
      well.add(beam);
      const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 16), wood);
      pulley.position.y = 2.05;
      well.add(pulley);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 4), new THREE.MeshStandardMaterial({ color: "#8a7a5a", roughness: 1 }));
      rope.position.set(0.16, 1.4, 0);
      well.add(rope);
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 12), new THREE.MeshStandardMaterial({ color: "#7a6a52", roughness: 0.5, metalness: 0.6 }));
      bucket.position.set(0.16, 0.72, 0);
      well.add(bucket);
      well.position.set(6.5, 0, -5.5);
      g.add(well);
    });

    // Built in a slice of its own (see paintQueue).
    queueWork(() => {
      // --- Props ------------------------------------------------------------------
      // Clay pots by the well and the houses: a lathe profile.
      const potGeo = new THREE.LatheGeometry(
        [v(0.001, 0, 0), v(0.18, 0.02, 0), v(0.3, 0.2, 0), v(0.28, 0.38, 0), v(0.14, 0.5, 0), v(0.15, 0.56, 0)].map((p) => new THREE.Vector2(p.x, p.y)),
        18
      );
      [
        [7.8, -4.4, 1],
        [8.2, -4.9, 0.8],
        [5.2, -6.6, 0.9],
        [-8.2, -8.3, 1],
        [10.4, -7.6, 0.85],
      ].forEach(([x, z, s]) => {
        const pot = new THREE.Mesh(potGeo, terracotta);
        pot.position.set(x, 0, z);
        pot.scale.setScalar(s);
        g.add(pot);
      });
      // Haystacks: domes of thatch on a low base.
      const hayGeo = new THREE.SphereGeometry(1.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      [
        [-11, 9],
        [-9.5, 11.5],
        [13, 13.5],
      ].forEach(([x, z]) => {
        const hay = new THREE.Mesh(hayGeo, thatch);
        hay.scale.set(1, 1.5 + r() * 0.4, 1);
        hay.position.set(x, 0, z);
        g.add(hay);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), wood);
        pole.position.set(x, 2.4, z);
        g.add(pole);
      });
      // A bullock cart, resting on its yoke.
      const cart = new THREE.Group();
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 2.4), wood);
      bed.position.y = 0.95;
      cart.add(bed);
      [-0.7, 0.7].forEach((sx) => {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 2.4), wood);
        side.position.set(sx, 1.2, 0);
        cart.add(side);
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 6, 24), wood);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(sx * 1.25, 0.78, 0.2);
        cart.add(wheel);
        for (let k = 0; k < 6; k++) {
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.45, 0.04), wood);
          spoke.rotation.x = (k / 6) * Math.PI;
          spoke.position.set(sx * 1.25, 0.78, 0.2);
          cart.add(spoke);
        }
      });
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 2.6), wood);
      yoke.position.set(0, 0.5, 2.3);
      yoke.rotation.x = 0.35;
      cart.add(yoke);
      cart.position.set(-8.5, 0, 2.5);
      cart.rotation.y = 0.9;
      g.add(cart);
      // A rope cot (charpai) on the thinnai side of a house.
      const cot = new THREE.Group();
      const cotTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 1.9), new THREE.MeshStandardMaterial({ color: "#a08a62", roughness: 1 }));
      cotTop.position.y = 0.48;
      cot.add(cotTop);
      [
        [-0.42, -0.9],
        [0.42, -0.9],
        [-0.42, 0.9],
        [0.42, 0.9],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.48, 6), wood);
        leg.position.set(lx, 0.24, lz);
        cot.add(leg);
      });
      cot.position.set(9.8, 0, -4.2);
      cot.rotation.y = -0.6;
      g.add(cot);
    });

    // --- The far horizon: palms and a gopuram in the haze ----------------------------
    const horizon = new THREE.Mesh(
      new THREE.CylinderGeometry(70, 70, 22, 64, 1, true),
      new THREE.MeshBasicMaterial({ map: horizonTexture(), color: "#04050a", transparent: true, side: THREE.BackSide, depthWrite: false, fog: false })
    );
    (horizon.material as THREE.MeshBasicMaterial).map!.repeat.set(2, 1);
    horizon.position.set(CX, 9.5, CZ);
    horizon.renderOrder = -9;
    g.add(horizon);

    // --- Smoke from a cooking fire behind the far house ------------------------------
    const smokeMat = new THREE.SpriteMaterial({ map: glowMap, color: "#8a8fa6", transparent: true, opacity: 0, depthWrite: false });
    const smoke: { s: THREE.Sprite; t: number }[] = [];
    const smokeAt = houses[1].localToWorld(v(1.6, 2.6, -0.6));
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(smokeMat.clone());
      g.add(s);
      smoke.push({ s, t: i / 10 });
    }

    // --- Low mist over the fields, catching the moonlight ---------------------------
    const mistMat = new THREE.SpriteMaterial({ map: glowMap, color: "#7d8bb3", transparent: true, opacity: 0.09, depthWrite: false });
    const mist: THREE.Sprite[] = [];
    for (let i = 0; i < (low ? 10 : 22); i++) {
      const a = r() * Math.PI * 2;
      const rad = 10 + r() * 26;
      const m = new THREE.Sprite(mistMat);
      m.scale.set(14 + r() * 12, 2.2 + r() * 1.5, 1);
      m.position.set(CX + Math.cos(a) * rad, 0.6 + r() * 0.6, CZ + Math.sin(a) * rad);
      m.userData.speed = (r() - 0.5) * 0.15;
      g.add(m);
      mist.push(m);
    }

    // --- Fireflies over the fields -------------------------------------------------
    const FIREFLIES = low ? 24 : 48;
    const ffPos = new Float32Array(FIREFLIES * 3);
    const ffSeed = Array.from({ length: FIREFLIES }, () => {
      const a = r() * Math.PI * 2;
      const rad = 7 + r() * 12;
      return { x: CX + Math.cos(a) * rad, y: 0.4 + r() * 2.2, z: CZ + Math.sin(a) * rad, p: r() * 10 };
    });
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
    const ffMat = new THREE.PointsMaterial({ map: glowMap, color: "#d8ff7a", size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    g.add(new THREE.Points(ffGeo, ffMat));

    return { g, sky, skyMat, milkyWay, mist, flames, lampLights, windowMat, crowns, smoke, smokeAt, ffPos, ffSeed, ffGeo, ffMat };
    // Built once per mount (the Milky Way is baked with this renderer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      disposeGroup(set.g);
      set.milkyWay.dispose();
    },
    [set]
  );

  useFrame((state) => {
    // Nothing to animate while this world is off screen.
    if (!isShown("village")) return;
    // The sky turns with the walker, so the sunset glow stays behind them in every shot.
    set.sky.position.set(characterState.x, 0, characterState.z);
    set.sky.rotation.y = characterState.heading;
    const t = world.reduced ? 0 : state.clock.elapsedTime;
    set.skyMat.uniforms.uTime.value = t;
    set.flames.forEach((f) => {
      const k = 0.85 + Math.sin(t * 11 + f.userData.seed) * 0.08 + Math.sin(t * 19.7 + f.userData.seed) * 0.06;
      f.scale.set(0.09 * (2 - k), 0.17 * k, 1);
    });
    set.lampLights.forEach((l, k) => {
      l.intensity = 3.1 + Math.sin(t * 9 + k * 2.3) * 0.3 + world.audioLevel * 1.2;
    });
    // Palm crowns sway a little in the evening breeze.
    set.crowns.forEach((c, k) => {
      c.rotation.z = Math.sin(t * 0.6 + k * 1.7) * 0.04;
      c.rotation.x = Math.sin(t * 0.47 + k) * 0.03;
    });
    set.mist.forEach((m) => {
      m.position.x += m.userData.speed * 0.016;
    });
    // Smoke: soft puffs rising, spreading and fading, on a loop.
    set.smoke.forEach((p) => {
      const life = (p.t + t * 0.06) % 1;
      p.s.position.set(set.smokeAt.x + Math.sin(life * 3 + p.t * 9) * 0.3 + life * 1.2, set.smokeAt.y + life * 5, set.smokeAt.z);
      p.s.scale.setScalar(0.6 + life * 2.6);
      (p.s.material as THREE.SpriteMaterial).opacity = Math.sin(life * Math.PI) * 0.22;
    });
    set.ffSeed.forEach((s, i) => {
      set.ffPos[i * 3] = s.x + Math.sin(t * 0.4 + s.p) * 0.8;
      set.ffPos[i * 3 + 1] = s.y + Math.sin(t * 0.7 + s.p * 2) * 0.3;
      set.ffPos[i * 3 + 2] = s.z + Math.cos(t * 0.35 + s.p) * 0.8;
    });
    set.ffGeo.attributes.position.needsUpdate = true;
    set.ffMat.opacity = 0.45 + Math.sin(t * 2.1) * 0.25;
  });

  return <primitive object={set.g} />;
};

export default VillageSet;
