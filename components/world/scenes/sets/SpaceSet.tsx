"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { characterState } from "../../characterState";
import { compileQuietly } from "../../compile";
import { isShown } from "../../stage";
import { disposeGroup } from "./disposeGroup";
import { bakeMilkyWay, skyNoiseGLSL, starsGLSL } from "./nightSky";
import { paintTexture, queueWork } from "./paintQueue";
import { rng } from "./textures";

/** Centre of the walk loop (see Journey): the plaza and the ring of columns centre on it. */
const CX = 0;
const CZ = -2.4;
/** Radius of the ring of columns, and of the plaza they stand on. */
const RING_R = 11.5;
const PLAZA_R = 19;

// ---------------------------------------------------------------------------
// Noise and texture helpers
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
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
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

/** Sun-bleached marble weathered by age: warm grey, dark streaks running down, drum joints. */
const weatheredMarble = (drums: number) => {
  const W = 256;
  const H = 512;
  return paintTexture(
    W,
    H,
    (x, y) => {
      // Streaks: noise stretched vertically; blotches: broad noise.
      const streak = fbm(x / 6, y / 90, 3);
      const blot = fbm(x / 40 + 9, y / 40, 4);
      const grit = hash(x, y);
      const k = 0.62 + blot * 0.3 - smoothstep(0.55, 0.8, streak) * 0.22 + grit * 0.08;
      return [206 * k, 192 * k, 170 * k];
    },
    (c) => toTexture(c),
    (g) => {
      // Joints between the drums.
      g.strokeStyle = "rgba(40,32,24,0.5)";
      g.lineWidth = 2;
      for (let i = 1; i < drums; i++) {
        const y = (i / drums) * H + (hash(i, 3) - 0.5) * 6;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
      }
    }
  );
};

/** Old paving: large worn stone slabs of uneven size, joints and chips. */
const pavingTexture = () => {
  const S = 512;
  return paintTexture(
    S,
    S,
    (x, y) => {
      const n = 0.55 * fbm(x / 30, y / 30, 4) + 0.45 * hash(x, y);
      const k = 0.36 + n * 0.26;
      return [190 * k, 178 * k, 160 * k];
    },
    (c) => toTexture(c, [10, 10]),
    (g) => pavingJoints(g, S)
  );
};

/** The slab joints and tints drawn over the paving's stone. */
const pavingJoints = (g: CanvasRenderingContext2D, S: number) => {
  const r = rng(12);
  g.strokeStyle = "rgba(20,16,12,0.65)";
  g.lineWidth = 2.5;
  // Rows of slabs with staggered joints.
  const rows = 4;
  for (let row = 0; row < rows; row++) {
    const y = (row / rows) * S;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(S, y);
    g.stroke();
    let x = r() * 60;
    while (x < S) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + S / rows);
      g.stroke();
      x += 90 + r() * 110;
    }
  }
  // A few slab tints.
  for (let k = 0; k < 10; k++) {
    g.fillStyle = `rgba(${r() < 0.5 ? "30,24,18" : "255,245,225"},${(0.04 + r() * 0.06).toFixed(3)})`;
    g.fillRect(r() * S, Math.floor(r() * rows) * (S / rows), 80 + r() * 120, S / rows);
  }
};

/** Polished black marble with grey veins and a few threads of old gold (the walking floor). */
const polishedMarble = () => {
  const S = 512;
  const { c, g } = canvas(S, S);
  g.fillStyle = "#121317";
  g.fillRect(0, 0, S, S);
  const r = rng(29);
  g.globalAlpha = 0.08;
  for (let k = 0; k < 50; k++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 30 + r() * 110;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, "#4a4c56");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const veins = (color: string, count: number, strength: number) => {
    g.strokeStyle = color;
    g.lineCap = "round";
    for (let k = 0; k < count; k++) {
      const pts: [number, number][] = [];
      let x = r() * S;
      let y = -20;
      const drift = (r() - 0.5) * 1.4;
      while (y < S + 20) {
        pts.push([x, y]);
        x += drift * 8 + (r() - 0.5) * 16;
        y += 8 + r() * 14;
      }
      g.globalAlpha = (k < 3 ? 0.4 : 0.08 + r() * 0.2) * strength;
      g.lineWidth = k < 3 ? 1.2 + r() * 1.2 : 0.4 + r() * 0.8;
      [-S, 0, S].forEach((o) => {
        g.beginPath();
        pts.forEach(([px, py], i) => (i ? g.lineTo(px + o, py) : g.moveTo(px + o, py)));
        g.stroke();
      });
    }
  };
  veins("#686a73", 20, 1);
  veins("#8a6a34", 5, 0.6);
  g.globalAlpha = 1;
  return toTexture(c, [5, 5]);
};

/** Dark rock for the underside of the floating plaza. */
const rockTexture = () => {
  const S = 256;
  return paintTexture(
    S,
    S,
    (x, y) => {
      const n = 0.6 * fbm(x / 26, y / 12, 4) + 0.4 * hash(x, y);
      return [48 + n * 60, 44 + n * 54, 42 + n * 50];
    },
    (c) => toTexture(c, [3, 3])
  );
};

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------

/**
 * The night sky, drawn every frame from the baked Milky Way plus what must stay sharp
 * or moving: stars at four magnitudes (crowding where the band is), each with a slow
 * scintillation and a colour by temperature, and a small, quiet black hole.
 */
const skyMaterial = (hole: THREE.Vector3, milkyWay: THREE.Texture) =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHole: { value: hole }, tMilkyWay: { value: milkyWay } },
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
      uniform float uTime;
      uniform vec3 uHole;
      uniform sampler2D tMilkyWay;
      varying vec3 vDir;
      varying vec2 vUv;
      ${skyNoiseGLSL}
      ${starsGLSL}

      void main() {
        vec3 d = normalize(vDir);
        vec4 mw = texture2D(tMilkyWay, vUv);
        // A real night sky is nearly black, with a faint cool cast.
        vec3 col = vec3(0.0025, 0.003, 0.006) + mw.rgb;
        col += stars(d, 1.0 + 8.0 * mw.a, uTime);

        // The black hole: small and quiet, mostly seen by the stars it bends and hides.
        if (dot(d, uHole) > 0.95) {
          vec3 bx = normalize(cross(uHole, vec3(0.0, 1.0, 0.0)));
          vec3 by = cross(bx, uHole);
          vec2 q = vec2(dot(d, bx), dot(d, by)) / 0.05;
          q.y += q.x * 0.1;
          float r = length(q);
          col *= smoothstep(0.94, 1.02, r) * (1.0 + 0.6 * exp(-pow((r - 1.5) / 0.5, 2.0)));
          col += vec3(1.0, 0.9, 0.78) * exp(-pow((r - 1.05) / 0.035, 2.0)) * 0.7;
          col += vec3(0.9, 0.62, 0.38) * exp(-pow((r - 1.35) / 0.3, 2.0)) * 0.12;
          float arc = exp(-pow((r - 1.2) / 0.08, 2.0)) * (0.5 + 0.5 * abs(q.y) / max(r, 0.001));
          col += vec3(0.95, 0.74, 0.5) * arc * 0.3;
          float disk = exp(-pow(q.y / 0.08, 2.0)) * smoothstep(6.0, 1.3, abs(q.x));
          float streak = 0.7 + 0.3 * noise(vec2(q.x * 3.0 - uTime * 0.4, 0.5));
          col += vec3(0.95, 0.78, 0.56) * disk * streak * 0.4;
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Fluted shaft, 1 m tall, radius ~0.75 (scaled per column). */
const shaftGeometry = () => {
  const geo = new THREE.CylinderGeometry(0.7, 0.78, 1, 48, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const k = 1 - 0.045 * Math.abs(Math.sin(Math.atan2(z, x) * 12));
    p.setXYZ(i, x * k, p.getY(i), z * k);
  }
  geo.computeVertexNormals();
  return geo;
};

/** A Corinthian capital's bell: flaring upward, wrapped in two rows of curling leaves. */
const capitalGeometry = () => {
  const geo = new THREE.CylinderGeometry(1.12, 0.72, 1.7, 64, 12);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const t = (y + 0.85) / 1.7;
    const row1 = Math.pow(Math.abs(Math.sin(a * 4)), 0.6) * smoothstep(0.0, 0.35, t) * (1 - smoothstep(0.4, 0.55, t));
    const row2 = Math.pow(Math.abs(Math.sin(a * 4 + Math.PI / 4)), 0.6) * smoothstep(0.3, 0.7, t) * (1 - smoothstep(0.75, 0.9, t));
    const curl = smoothstep(0.82, 1, t) * Math.pow(Math.abs(Math.sin(a * 2 + Math.PI / 4)), 3) * 0.35;
    const k = 1 + row1 * 0.16 + row2 * 0.2 + curl;
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
};

/** A rock: an icosphere pushed in and out by noise. */
const rockGeometry = (seed: number, detail = 2) => {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const k = 0.7 + fbm(v.x * 1.5 + seed * 3.1, v.y * 1.5 + v.z * 1.3 + seed) * 0.6;
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  geo.computeVertexNormals();
  return geo;
};

/** The plaza's underside: top sheared flat, belly drawn down into jagged points. */
const undersideGeometry = (seed: number) => {
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const k = 0.86 + fbm(v.x * 2.2 + seed, v.z * 2.2 + v.y * 1.4 - seed, 4) * 0.28;
    let y = v.y * k;
    if (y > 0) y = 0;
    else y = -Math.pow(-y, 0.8) * (1.6 + fbm(v.x * 5 + seed, v.z * 5) * 1.6);
    p.setXYZ(i, v.x * k, y, v.z * k);
  }
  geo.computeVertexNormals();
  return geo;
};

/** Collects many copies of one part, then builds a single instanced mesh. */
class Batch {
  mats: THREE.Matrix4[] = [];
  constructor(
    private geo: THREE.BufferGeometry,
    private mat: THREE.Material
  ) {}
  add(pos: THREE.Vector3, scale: THREE.Vector3, rot = new THREE.Euler()) {
    this.mats.push(new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot), scale));
  }
  build(parent: THREE.Object3D) {
    if (!this.mats.length) return;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.mats.length);
    this.mats.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    parent.add(im);
  }
}

/**
 * World 01, the Temple of Olympian Zeus, adrift in space. An open, ancient stone
 * plaza floats in the void; the walk runs over a sanctuary floor of polished black
 * marble inlaid with gold, ringed by colossal Corinthian columns, weathered and
 * ruined (some still joined by their architrave, some broken off, one fallen and
 * lying in its drums), with marble statues on pedestals between them. Above and all
 * around: a real night sky, the Milky Way and a small black hole.
 */
const SpaceSet = () => {
  const { gl, camera, scene } = useThree();
  const set = useMemo(() => {
    const g = new THREE.Group();
    const r = rng(7);
    const low = world.quality === "low";
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    // --- Sky: turns with the walker, so the black hole stays in every shot.
    const holeDir = new THREE.Vector3(-0.22, 0.3, -0.93).normalize();
    const milkyWay = bakeMilkyWay(gl, low ? 1024 : 2048);
    const skyMat = skyMaterial(holeDir, milkyWay.texture);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), skyMat);
    sky.renderOrder = -10;
    g.add(sky);
    // Starlight: cool and soft from above, a faint warm glow from the black hole's disk.
    const starlight = new THREE.DirectionalLight("#b8c6ee", 0.7);
    starlight.position.set(20, 40, 15);
    g.add(starlight);
    const diskLight = new THREE.DirectionalLight("#ffc48a", 0.35);
    diskLight.position.copy(holeDir).multiplyScalar(50);
    sky.add(diskLight);

    // --- Materials ---------------------------------------------------------
    const columnMat = new THREE.MeshStandardMaterial({ map: weatheredMarble(7), roughness: 0.75, metalness: 0 });
    const blockMap = weatheredMarble(1);
    blockMap.wrapS = blockMap.wrapT = THREE.RepeatWrapping;
    blockMap.repeat.set(2, 0.5);
    const blockMat = new THREE.MeshStandardMaterial({ map: blockMap, roughness: 0.8 });
    const paving = new THREE.MeshStandardMaterial({ map: pavingTexture(), roughness: 0.85 });
    const rockMap = rockTexture();
    const rock = new THREE.MeshStandardMaterial({ map: rockMap, roughness: 0.95 });

    // --- The plaza --------------------------------------------------------
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA_R, PLAZA_R - 0.4, 1.2, 128), [blockMat, paving, blockMat]);
    plaza.position.set(CX, -0.6, CZ);
    g.add(plaza);
    const under = new THREE.Mesh(undersideGeometry(4), rock);
    under.scale.set(PLAZA_R * 1.04, PLAZA_R * 0.9, PLAZA_R * 1.04);
    under.position.set(CX, -1.1, CZ);
    g.add(under);
    // The stylobate: a raised ring of stone the columns stand on, two steps high.
    const ringShape = (outer: number, inner: number) => {
      const s = new THREE.Shape();
      s.absarc(0, 0, outer, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
      s.holes.push(hole);
      return s;
    };
    [
      [RING_R + 2.0, RING_R - 2.0, 0.28],
      [RING_R + 1.5, RING_R - 1.5, 0.56],
    ].forEach(([outer, inner, h]) =>
      // Triangulating a ring this fine is slow: each step is built in a slice of its own.
      queueWork(() => {
        const step = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape(outer, inner), { depth: h, bevelEnabled: false, curveSegments: 96 }), blockMat);
        step.rotation.x = -Math.PI / 2;
        step.position.set(CX, 0, CZ);
        g.add(step);
      })
    );
    const STYLO = 0.56;
    // Inside the ring, where the walk runs: a floor of honed black marble (satin, so lights
    // never flare off it), inlaid
    // with rings of old gold, as at the heart of a sanctuary.
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(RING_R - 2.0, 128),
      new THREE.MeshStandardMaterial({ map: polishedMarble(), roughness: 0.48, metalness: 0, envMapIntensity: 0.35 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(CX, 0.004, CZ);
    g.add(floor);
    const inlayMat = new THREE.MeshStandardMaterial({ color: "#7d6233", roughness: 0.55, metalness: 0.8 });
    [
      [4.3, 0.03],
      [4.5, 0.012],
      [8.6, 0.04],
      [8.85, 0.015],
    ].forEach(([rad, tube]) => {
      const inlay = new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 6, 240), inlayMat);
      inlay.rotation.x = Math.PI / 2;
      inlay.position.set(CX, 0.006, CZ);
      inlay.scale.z = 0.3;
      g.add(inlay);
    });
    // Twelve fine spokes between the two rings, like the rays of a sundial.
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 4.1), inlayMat);
      spoke.position.set(CX + Math.sin(a) * 6.55, 0.006, CZ + Math.cos(a) * 6.55);
      spoke.rotation.y = a;
      g.add(spoke);
    }

    // --- The ring of columns ---------------------------------------------
    const shaftGeo = shaftGeometry();
    const capGeo = capitalGeometry();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const torusGeo = new THREE.TorusGeometry(0.86, 0.14, 12, 48);
    const B = {
      shaft: new Batch(shaftGeo, columnMat),
      capital: new Batch(capGeo, columnMat),
      block: new Batch(boxGeo, blockMat),
      torus: new Batch(torusGeo, columnMat),
    };
    const COL_H = 14;
    const N = 18;
    // Which positions survive: standing, broken off at some height, fallen, or gone.
    const state = (k: number) => (k === 5 || k === 13 ? "gone" : k === 2 || k === 9 || k === 16 ? "broken" : k === 11 ? "fallen" : "standing");
    const tops: (THREE.Vector3 | null)[] = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2 + 0.09;
      const x = CX + Math.sin(a) * RING_R;
      const z = CZ - Math.cos(a) * RING_R;
      const st = state(k);
      // Base: plinth and torus mouldings (left even where the column is gone).
      B.block.add(v(x, STYLO + 0.2, z), v(2.0, 0.4, 2.0), new THREE.Euler(0, -a, 0));
      if (st === "gone") {
        tops.push(null);
        continue;
      }
      B.torus.add(v(x, STYLO + 0.5, z), v(1, 1, 1.4), new THREE.Euler(Math.PI / 2, 0, 0));
      if (st === "fallen") {
        tops.push(null);
        continue;
      }
      const h = st === "broken" ? 3 + r() * 5 : COL_H;
      B.shaft.add(v(x, STYLO + 0.6 + h / 2, z), v(1, h, 1));
      if (st === "standing") {
        B.capital.add(v(x, STYLO + 0.6 + COL_H + 0.85, z), v(1, 1, 1), new THREE.Euler(0, a, 0));
        B.block.add(v(x, STYLO + 0.6 + COL_H + 1.88, z), v(2.5, 0.36, 2.5), new THREE.Euler(0, -a, 0));
        tops.push(v(x, STYLO + 0.6 + COL_H + 2.06, z));
      } else tops.push(null);
    }
    // Architrave: stone beams still bridging some neighbouring columns.
    [0, 1, 6, 7, 14].forEach((k) => {
      const a = tops[k];
      const b = tops[(k + 1) % N];
      if (!a || !b) return;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b) + 2.2;
      const yaw = Math.atan2(b.x - a.x, b.z - a.z);
      B.block.add(v(mid.x, mid.y + 0.8, mid.z), v(1.6, 1.6, len), new THREE.Euler(0, yaw, 0));
      B.block.add(v(mid.x, mid.y + 1.95, mid.z), v(1.9, 0.7, len + 0.4), new THREE.Euler(0, yaw, 0));
    });
    // The fallen column: its drums lying in a broken line out across the plaza edge.
    {
      const a = (11 / N) * Math.PI * 2 + 0.09;
      const dir = v(Math.sin(a), 0, -Math.cos(a));
      const side = v(Math.cos(a), 0, Math.sin(a));
      const base = v(CX, 0, CZ).addScaledVector(dir, RING_R + 1.4);
      const yaw = new THREE.Quaternion();
      for (let d = 0; d < 6; d++) {
        const p = base.clone().addScaledVector(dir, d * 1.75).addScaledVector(side, (r() - 0.5) * 0.6);
        // Each drum lies on its side along the line of the fall, settled at its own slight turn.
        const lying = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, (r() - 0.5) * 0.4));
        yaw.setFromAxisAngle(v(0, 1, 0), -a + (r() - 0.5) * 0.2);
        B.shaft.mats.push(new THREE.Matrix4().compose(v(p.x, 0.74, p.z), lying.premultiply(yaw), v(1, 1.6, 1)));
      }
      // Its capital, tipped over at the end.
      const capPos = base.clone().addScaledVector(dir, 6 * 1.75 + 0.6);
      B.capital.add(v(capPos.x, 0.95, capPos.z), v(1, 1, 1), new THREE.Euler(0.4, a, 1.4));
    }
    // Scattered blocks and rubble around the ring.
    for (let i = 0; i < (low ? 14 : 30); i++) {
      const a = r() * Math.PI * 2;
      const rad = RING_R - 2.5 + r() * 8;
      const s = 0.3 + r() * 0.9;
      B.block.add(v(CX + Math.sin(a) * rad, s * 0.35, CZ - Math.cos(a) * rad), v(s * (1 + r()), s * 0.7, s), new THREE.Euler(0, r() * 3, (r() - 0.5) * 0.3));
    }
    Object.values(B).forEach((b) => b.build(g));

    // --- Statues: four marble figures on pedestals at the edge of the sanctuary,
    // facing in. The figures themselves load afterwards (see below).
    const statueSpots: { spot: THREE.Group; clip: string; time: number; raise: boolean }[] = [];
    (
      [
        [3.5, "Idle", 0.8, true],
        [7.5, "Think", 2.2, false],
        [12.5, "Talk", 1.4, false],
        [16.5, "Wave", 1.0, false],
      ] as [number, string, number, boolean][]
    ).forEach(([slot, clip, time, raise]) => {
      const a = (slot / N) * Math.PI * 2 + 0.09;
      const spot = new THREE.Group();
      spot.position.set(CX + Math.sin(a) * 8.9, 0, CZ - Math.cos(a) * 8.9);
      // Face the centre of the sanctuary.
      spot.rotation.y = Math.atan2(CX - spot.position.x, CZ - spot.position.z);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 1.9), blockMat);
      plinth.position.y = 0.15;
      spot.add(plinth);
      const die = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.5), blockMat);
      die.position.y = 0.85;
      spot.add(die);
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 1.8), blockMat);
      cornice.position.y = 1.51;
      spot.add(cornice);
      g.add(spot);
      statueSpots.push({ spot, clip, time, raise });
    });
    const statueMat = new THREE.MeshStandardMaterial({ map: weatheredMarble(1), color: "#d6cec2", roughness: 0.62, metalness: 0 });

    // --- Rocks drifting in the void around the plaza ---------------------------
    const debrisCount = low ? 40 : 90;
    const debris = new THREE.InstancedMesh(rockGeometry(5, 2), rock, debrisCount);
    const debrisState: { p: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; s: THREE.Vector3 }[] = [];
    for (let i = 0; i < debrisCount; i++) {
      const a = r() * Math.PI * 2;
      const rad = PLAZA_R + 8 + Math.pow(r(), 0.8) * 90;
      const s = 0.2 + Math.pow(r(), 2.6) * (0.6 + rad * 0.03);
      debrisState.push({
        p: v(CX + Math.sin(a) * rad, -20 + r() * 50, CZ - Math.cos(a) * rad),
        rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
        spin: v(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.2),
        s: v(s, s * (0.7 + r() * 0.5), s),
      });
    }
    g.add(debris);

    // --- Shooting stars --------------------------------------------------
    const streak = canvas(256, 8);
    const sgrd = streak.g.createLinearGradient(0, 0, 256, 0);
    sgrd.addColorStop(0, "rgba(255,255,255,0)");
    sgrd.addColorStop(0.85, "rgba(220,230,255,0.6)");
    sgrd.addColorStop(1, "rgba(255,255,255,1)");
    streak.g.fillStyle = sgrd;
    streak.g.fillRect(0, 2, 256, 4);
    const meteor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 0.12),
      new THREE.MeshBasicMaterial({ map: toTexture(streak.c), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })
    );
    sky.add(meteor);

    return {
      g,
      sky,
      skyMat,
      milkyWay,
      statueSpots,
      statueMat,
      debris,
      debrisState,
      meteor,
      nextMeteor: 6,
      meteorAt: -10,
      meteorFrom: new THREE.Vector3(),
      meteorDir: new THREE.Vector3(),
    };
  }, [gl]);

  // The statues: the Zeus model frozen in a different pose for each, cast in weathered
  // marble (zeus.glb ships without its own texture for that reason: meshopt, ~380 KB). Each pose is baked into a plain static mesh (no skeleton left to animate),
  // so four statues cost about as much as four rocks. Loaded after the stage is up.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ GLTFLoader }, { MeshoptDecoder }, { clone }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/libs/meshopt_decoder.module.js"),
        import("three/examples/jsm/utils/SkeletonUtils.js"),
      ]);
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync("/models/zeus.glb");
      if (!alive) return;
      // The marble's shader is ready before the first statue appears, so it never stalls a frame.
      const probeGeometry = new THREE.BoxGeometry();
      await compileQuietly(gl, new THREE.Mesh(probeGeometry, set.statueMat), camera, scene, () => alive);
      probeGeometry.dispose();
      if (!alive) return;
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const pq = new THREE.Quaternion();
      /** Turn a bone so it points (from itself toward its child) along a world direction. */
      const aim = (bone: THREE.Object3D | undefined, child: THREE.Object3D | undefined, dir: THREE.Vector3) => {
        if (!bone || !child || !bone.parent) return;
        bone.updateWorldMatrix(true, true);
        bone.getWorldPosition(v1);
        child.getWorldPosition(v2);
        q.setFromUnitVectors(v2.sub(v1).normalize(), dir.clone().normalize());
        bone.getWorldQuaternion(pq);
        const target = q.multiply(pq);
        bone.parent.getWorldQuaternion(pq);
        bone.quaternion.copy(pq.invert().multiply(target));
        bone.updateWorldMatrix(false, true);
      };
      // Baking reads every skinned vertex: done a statue at a time, handing the main thread
      // back every few milliseconds, so it never stalls a frame.
      let slice = performance.now();
      const breathe = async () => {
        if (performance.now() - slice < 8) return;
        await new Promise((r) => window.setTimeout(r, 0));
        slice = performance.now();
      };
      for (const { spot, clip, time, raise } of set.statueSpots) {
        await breathe();
        if (!alive) return;
        const statue = clone(gltf.scene);
        statue.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.material = set.statueMat;
            m.frustumCulled = false;
          }
        });
        const anim = gltf.animations.find((a) => a.name === clip) ?? gltf.animations[0];
        if (anim) {
          const mixer = new THREE.AnimationMixer(statue);
          mixer.clipAction(anim).play();
          mixer.update(time);
        }
        statue.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(statue);
        const k = 3.4 / Math.max(box.max.y - box.min.y, 1e-3);
        statue.scale.multiplyScalar(k);
        statue.position.y = 1.62 - box.min.y * k;
        spot.add(statue);
        if (raise) {
          // Zeus with his arm raised, as if about to throw the thunderbolt.
          spot.updateWorldMatrix(true, true);
          const find = (name: string) => statue.getObjectByName(`mixamorig${name}`);
          const up = new THREE.Vector3(-0.35, 1, 0.15).applyQuaternion(spot.getWorldQuaternion(new THREE.Quaternion()));
          aim(find("RightArm"), find("RightForeArm"), up);
          aim(find("RightForeArm"), find("RightHand"), up.clone().add(new THREE.Vector3(0, 0.6, 0)));
        }
        // Bake: read every skinned vertex in its posed place, into the spot's own space.
        spot.updateWorldMatrix(true, true);
        const toSpot = spot.matrixWorld.clone().invert();
        const vtx = new THREE.Vector3();
        const meshes: THREE.SkinnedMesh[] = [];
        statue.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.SkinnedMesh);
        });
        for (const sk of meshes) {
          const src = sk.geometry;
          const pos = src.attributes.position;
          const out = new Float32Array(pos.count * 3);
          const m = new THREE.Matrix4().multiplyMatrices(toSpot, sk.matrixWorld);
          for (let i = 0; i < pos.count; i++) {
            if (sk.isSkinnedMesh) sk.getVertexPosition(i, vtx);
            else vtx.fromBufferAttribute(pos, i);
            vtx.applyMatrix4(m);
            out[i * 3] = vtx.x;
            out[i * 3 + 1] = vtx.y;
            out[i * 3 + 2] = vtx.z;
            if ((i & 1023) === 0) {
              await breathe();
              if (!alive) return;
            }
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(out, 3));
          if (src.attributes.uv) geo.setAttribute("uv", src.attributes.uv);
          if (src.index) geo.setIndex(src.index);
          geo.computeVertexNormals();
          spot.add(new THREE.Mesh(geo, set.statueMat));
        }
        spot.remove(statue);
      }
    })().catch((err) => console.warn("Statues failed to load.", err));
    return () => {
      alive = false;
    };
  }, [set, gl, camera, scene]);

  useEffect(
    () => () => {
      disposeGroup(set.g);
      set.milkyWay.dispose();
    },
    [set]
  );

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion() }), []);

  useFrame((state, rawDelta) => {
    // Nothing to animate while this world is off screen.
    if (!isShown("space")) return;
    const delta = Math.min(rawDelta, 1 / 20);
    const t = state.clock.elapsedTime;
    // The ruins stay put (the walker really walks among them); only the sky turns with
    // them, so the Milky Way and the black hole keep their place in every shot.
    set.sky.position.set(characterState.x, 0, characterState.z);
    set.sky.rotation.y = characterState.heading;
    set.skyMat.uniforms.uTime.value = t;
    if (world.reduced) return;

    set.debrisState.forEach((d, i) => {
      d.rot.x += d.spin.x * delta;
      d.rot.y += d.spin.y * delta;
      tmp.q.setFromEuler(d.rot);
      tmp.m.compose(d.p, tmp.q, d.s);
      set.debris.setMatrixAt(i, tmp.m);
    });
    set.debris.instanceMatrix.needsUpdate = true;

    // A shooting star every 7–18 s.
    if (t > set.nextMeteor) {
      set.meteorAt = t;
      set.nextMeteor = t + 7 + Math.random() * 11;
      const a = (Math.random() - 0.5) * 1.8;
      set.meteorFrom.set(Math.sin(a) * 150, 50 + Math.random() * 50, -Math.cos(a) * 150);
      set.meteorDir.set(Math.random() < 0.5 ? -1 : 1, -0.4, 0).normalize();
      set.meteor.rotation.set(0, -a, Math.atan2(set.meteorDir.y, set.meteorDir.x));
    }
    const m = (t - set.meteorAt) / 0.9;
    (set.meteor.material as THREE.MeshBasicMaterial).opacity = m < 1 ? Math.sin(m * Math.PI) * 0.9 : 0;
    if (m < 1) set.meteor.position.copy(set.meteorFrom).addScaledVector(set.meteorDir, m * 30);
  });

  return <primitive object={set.g} />;
};

export default SpaceSet;
