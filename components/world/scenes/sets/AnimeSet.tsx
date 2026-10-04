"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

import { world } from "@/lib/world";

import { characterState } from "../../characterState";
import { isShown } from "../../stage";
import { disposeGroup } from "./disposeGroup";
import { skyNoiseGLSL, starsGLSL } from "./nightSky";
import { paintTexture } from "./paintQueue";
import { glowTexture, rng } from "./textures";

/** Centre of the walk loop (see Journey): the crossing is painted round it. */
const CX = 0;
const CZ = -2.4;

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

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
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const NEON = ["#ff3fb4", "#29e0ff", "#b06bff", "#ffcf3a", "#ff5a4a", "#5dff9e"];

/**
 * A building facade: dark concrete with a grid of windows, some lit warm, some cool,
 * most dark; blinds and the odd silhouette; floor bands. Returns the colour map and an
 * emissive map holding only the lit windows.
 */
const facadeTextures = (seed: number, cols: number, rows: number, tone: string) => {
  const W = 256;
  const H = 512;
  const r = rng(seed);
  const make = (emissive: boolean) => {
    const { c, g } = canvas(W, H);
    g.fillStyle = emissive ? "#000" : tone;
    g.fillRect(0, 0, W, H);
    if (!emissive) {
      // Grime and panel joints.
      for (let i = 0; i < 400; i++) {
        g.fillStyle = `rgba(0,0,0,${(r() * 0.12).toFixed(2)})`;
        g.fillRect(r() * W, r() * H, 1 + r() * 3, 4 + r() * 20);
      }
    }
    const cw = W / cols;
    const ch = H / rows;
    const rr = rng(seed + 9);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lit = rr();
        const warm = rr() < 0.65;
        const shade = rr();
        const px = x * cw + cw * 0.14;
        const py = y * ch + ch * 0.2;
        const w = cw * 0.72;
        const h = ch * 0.6;
        if (lit > 0.5) {
          const col = warm ? `rgb(${255},${(196 + shade * 40) | 0},${(130 + shade * 50) | 0})` : `rgb(${(170 + shade * 40) | 0},${(214 + shade * 30) | 0},255)`;
          g.fillStyle = col;
          g.globalAlpha = emissive ? 0.5 + shade * 0.5 : 1;
          g.fillRect(px, py, w, h);
          // Blinds: horizontal slats.
          g.globalAlpha = emissive ? 0.4 : 0.25;
          g.fillStyle = "#000";
          for (let s = 0; s < 4; s++) if (rr() < 0.5) g.fillRect(px, py + (s / 4) * h, w, h / 10);
          g.globalAlpha = 1;
        } else if (!emissive) {
          g.fillStyle = `rgba(10,12,20,${(0.75 + shade * 0.2).toFixed(2)})`;
          g.fillRect(px, py, w, h);
        }
      }
      if (!emissive) {
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(0, y * ch, W, 2);
      }
    }
    return toTexture(c);
  };
  return { map: make(false), emissive: make(true) };
};

/** A vertical neon sign: a dark panel framed in light, Japanese characters stacked down it. */
const verticalSign = (text: string, color: string) => {
  const W = 96;
  const H = 96 * text.length + 48;
  const { c, g } = canvas(W, H);
  g.fillStyle = "#0b0612";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = color;
  g.lineWidth = 5;
  g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = color;
  g.font = `bold 72px "Yu Gothic", "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  g.shadowBlur = 18;
  text.split("").forEach((ch, k) => g.fillText(ch, W / 2, 48 + k * 96));
  return toTexture(c);
};

/** A wide billboard: a neon gradient field with a big title and a smaller line. */
const billboard = (title: string, sub: string, a: string, b: string) => {
  const W = 512;
  const H = 256;
  const { c, g } = canvas(W, H);
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, a);
  grd.addColorStop(1, b);
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(0,0,0,0.25)";
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  g.fillStyle = "#fff";
  g.font = `900 92px "Yu Gothic", "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#fff";
  g.shadowBlur = 12;
  g.fillText(title, W / 2, H * 0.44);
  g.font = `bold 30px "Archivo", sans-serif`;
  g.shadowBlur = 0;
  g.fillText(sub, W / 2, H * 0.8);
  return toTexture(c);
};

/** Wet asphalt: near-black with grit, worn patches and puddles (lighter = smoother, in the alpha). */
const asphaltTextures = () => {
  const S = 512;
  const map = paintTexture(
    S,
    S,
    (x, y) => {
      const n = hash(x, y);
      const patch = Math.sin(x * 0.02) * Math.sin(y * 0.017) * 0.5 + 0.5;
      const v = 18 + n * 18 + patch * 6;
      return [v, v, v + 3];
    },
    (c) => toTexture(c, [10, 10])
  );
  // Roughness: puddles are glassy, the rest is gritty.
  const roughness = paintTexture(
    S,
    S,
    (x, y) => {
      const puddle = Math.sin(x * 0.011 + 1.3) * Math.sin(y * 0.013 + 0.4) > 0.55;
      const rv = puddle ? 20 : 150 + hash(x, y) * 80;
      return [rv, rv, rv];
    },
    (c) => {
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(10, 10);
      return t;
    }
  );
  return { map, roughness };
};

/** Zebra crossing: white bars, scuffed. Alpha everywhere else. */
const zebraTexture = () => {
  const W = 512;
  const H = 128;
  const { c, g } = canvas(W, H);
  g.clearRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = "rgba(235,235,240,0.9)";
    g.fillRect(i * 64 + 10, 0, 40, H);
  }
  // Scuffs.
  g.globalCompositeOperation = "destination-out";
  const r = rng(4);
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(0,0,0,${(r() * 0.6).toFixed(2)})`;
    g.fillRect(r() * W, r() * H, 2 + r() * 8, 1 + r() * 3);
  }
  g.globalCompositeOperation = "source-over";
  return toTexture(c);
};

/** A paper lantern's glow face: red with black kanji and ribs. */
const lanternTexture = () => {
  const { c, g } = canvas(128, 128);
  g.fillStyle = "#e0242c";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(80,0,0,0.5)";
  for (let y = 8; y < 128; y += 12) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(128, y);
    g.stroke();
  }
  g.fillStyle = "#1a0505";
  g.font = `bold 64px "Yu Gothic", "Meiryo", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("祭", 64, 66);
  return toTexture(c);
};

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------

/**
 * A Tokyo night: deep indigo overhead, the city's own glow rising magenta and violet
 * from the skyline, a few bright stars and planets that get through, and thin cloud
 * lit from below by the streets.
 */
const skyMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vDir;
      ${skyNoiseGLSL}
      ${starsGLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(vec3(0.14, 0.03, 0.14), vec3(0.04, 0.015, 0.09), smoothstep(-0.02, 0.18, h));
        col = mix(col, vec3(0.005, 0.005, 0.02), smoothstep(0.18, 0.75, h));
        // Clouds lit by the city.
        if (h > 0.03) {
          vec2 p = d.xz / (h + 0.15);
          float c = fbm(p * 1.4 + vec2(uTime * 0.01, 0.0));
          c = smoothstep(0.5, 0.82, c) * (1.0 - smoothstep(0.1, 0.6, h));
          col = mix(col, vec3(0.13, 0.05, 0.14), c * 0.5);
        }
        // A thin scatter of stars where the glow fades.
        col += stars(d, 0.5, uTime) * smoothstep(0.25, 0.7, h) * 0.6;
        col = mix(col, vec3(0.02, 0.01, 0.035), smoothstep(0.0, -0.05, h));
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
 * World 03, Neon Tokyo: a Shibuya-style crossing at night. Wet asphalt mirrors the
 * neon; zebra crossings frame the walk; tall buildings stand round the square with lit
 * windows, vertical signs in kanji and katakana and glowing billboards. Red lanterns
 * hang on wires across the street, vending machines glow at the kerb, a cherry tree
 * sheds petals, and Tokyo Tower stands lit in the distance under a violet city-glow sky.
 */
const AnimeSet = () => {
  const { gl, size } = useThree();

  const set = useMemo(() => {
    const g = new THREE.Group();
    const r = rng(23);
    const high = world.quality === "high";
    const low = world.quality === "low";
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const glowMap = glowTexture();

    // --- Sky -------------------------------------------------------------
    const skyMat = skyMaterial();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 48, 24), skyMat);
    sky.renderOrder = -10;
    g.add(sky);

    // --- Street: wet asphalt, mirrored on strong devices ------------------
    const asphalt = asphaltTextures();
    const streetMat = new THREE.MeshStandardMaterial({
      map: asphalt.map,
      roughnessMap: asphalt.roughness,
      roughness: 1,
      metalness: 0.1,
      transparent: high,
      opacity: high ? 0.82 : 1,
    });
    const street = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(CX, 0, CZ);
    g.add(street);
    if (high) {
      const pr = Math.min(gl.getPixelRatio(), 1.5);
      const mirror = new Reflector(new THREE.PlaneGeometry(120, 120), {
        textureWidth: Math.round(size.width * pr * 0.5),
        textureHeight: Math.round(size.height * pr * 0.5),
        color: 0x666677,
      });
      mirror.rotation.x = -Math.PI / 2;
      mirror.position.set(CX, -0.01, CZ);
      g.add(mirror);
    }
    // Zebra crossings on four sides of the walk, and a stop line.
    const zebra = new THREE.MeshStandardMaterial({ map: zebraTexture(), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const z = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), zebra);
      z.rotation.set(-Math.PI / 2, 0, a);
      z.position.set(CX + Math.sin(a) * 4.6, 0.012, CZ + Math.cos(a) * 4.6);
      g.add(z);
    }
    // Kerbs: a raised pavement ring round the crossing.
    const kerb = new THREE.Mesh(
      new THREE.RingGeometry(9.5, 30, 64),
      new THREE.MeshStandardMaterial({ color: "#2a2833", roughness: 0.75, metalness: 0.05 })
    );
    kerb.rotation.x = -Math.PI / 2;
    kerb.position.set(CX, 0.15, CZ);
    g.add(kerb);

    // --- Buildings round the square -----------------------------------------
    const facades = [
      facadeTextures(3, 6, 14, "#1d1c26"),
      facadeTextures(7, 5, 12, "#24222b"),
      facadeTextures(11, 8, 18, "#18171f"),
    ];
    const signTexts = ["ラーメン", "居酒屋", "東京", "カラオケ", "夜明け", "ネオン", "喫茶店", "新宿"];
    const boards: [string, string, string, string][] = [
      ["夜の街", "LOGESH · KUMAR", "#ff3fb4", "#6b2bff"],
      ["未来", "SHIP IT  /  PRODUCTION", "#29e0ff", "#2b47ff"],
      ["東京", "TOKYO NIGHTS", "#ff5a4a", "#ffb03a"],
      ["夢", "FULL STACK · 24/7", "#b06bff", "#ff3fb4"],
    ];
    const blinkers: THREE.Mesh[] = [];
    const neonLights: THREE.PointLight[] = [];
    const ringCount = 14;
    for (let i = 0; i < ringCount; i++) {
      const a = (i / ringCount) * Math.PI * 2 + 0.1;
      // Leave the view behind the camera's usual side a little more open.
      const dist = 17 + r() * 5;
      const w = 6 + r() * 4;
      const d = 6 + r() * 3;
      const h = 14 + r() * 26;
      const f = facades[i % 3];
      const tex = f.map.clone();
      const emi = f.emissive.clone();
      tex.wrapS = tex.wrapT = emi.wrapS = emi.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(w / 6, h / 14);
      emi.repeat.copy(tex.repeat);
      tex.needsUpdate = emi.needsUpdate = true;
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: emi, emissive: "#ffffff", emissiveIntensity: 0.75, roughness: 0.85 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      const x = CX + Math.sin(a) * dist;
      const z = CZ - Math.cos(a) * dist;
      b.position.set(x, h / 2, z);
      b.rotation.y = -a;
      g.add(b);
      // Facing the square: the face toward the centre.
      const face = new THREE.Object3D();
      face.position.set(x, 0, z);
      face.rotation.y = Math.atan2(CX - x, CZ - z);
      g.add(face);
      // A vertical neon sign standing off the facade.
      const text = signTexts[i % signTexts.length];
      const color = NEON[i % NEON.length];
      const sh = text.length * 1.1 + 0.6;
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, sh),
        new THREE.MeshBasicMaterial({ map: verticalSign(text, color), toneMapped: false, side: THREE.DoubleSide })
      );
      sign.position.set((r() - 0.5) * (w * 0.6), 4 + r() * 4 + sh / 2, d / 2 + 0.6);
      face.add(sign);
      if (i % 3 === 0) blinkers.push(sign);
      // A billboard on some buildings.
      if (i % 3 === 1) {
        const [t1, t2, c1, c2] = boards[Math.floor(i / 3) % boards.length];
        const bb = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.85, w * 0.42), new THREE.MeshBasicMaterial({ map: billboard(t1, t2, c1, c2), toneMapped: false }));
        bb.position.set(0, h * 0.62, d / 2 + 0.05);
        face.add(bb);
      }
      // Coloured light the signs throw on the street (a few, to stay cheap).
      if (i % (low ? 5 : 3) === 0) {
        const l = new THREE.PointLight(color, 9, 14, 1.6);
        l.position.set(0, 5, d / 2 + 2);
        face.add(l);
        neonLights.push(l);
      }
      // Rooftop: a water tank and a blinking red aircraft light.
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 12), new THREE.MeshStandardMaterial({ color: "#2b2a30", roughness: 0.8 }));
      tank.position.set(x + (r() - 0.5) * 2, h + 0.8, z + (r() - 0.5) * 2);
      g.add(tank);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: "#ff2a2a", toneMapped: false }));
      beacon.position.set(x, h + 2.2, z);
      beacon.userData.phase = r() * 6;
      g.add(beacon);
      blinkers.push(beacon);
    }

    // --- Distant skyline and Tokyo Tower ------------------------------------
    const far = facades[2].emissive.clone();
    far.wrapS = far.wrapT = THREE.RepeatWrapping;
    far.needsUpdate = true;
    const skylineMat = new THREE.MeshBasicMaterial({ map: far, color: "#4a3f6c", toneMapped: false });
    for (let i = 0; i < (low ? 28 : 60); i++) {
      const a = r() * Math.PI * 2;
      const dist = 45 + r() * 30;
      const w = 4 + r() * 6;
      const h = 15 + r() * 45;
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshBasicMaterial({ color: "#07060d" }));
      box.position.set(CX + Math.sin(a) * dist, h / 2, CZ - Math.cos(a) * dist);
      g.add(box);
      // Lit windows on the face toward the city centre.
      const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.95), skylineMat);
      front.position.copy(box.position);
      front.lookAt(CX, h / 2, CZ);
      front.translateZ(w / 2 + 0.02);
      g.add(front);
    }
    const tower = new THREE.Group();
    const towerMat = new THREE.MeshBasicMaterial({ color: "#ff6a2a", toneMapped: false });
    const towerWhite = new THREE.MeshBasicMaterial({ color: "#ffe9d6", toneMapped: false });
    // A lattice: four legs leaning in, cross-bands, an observation deck and a spire.
    const H = 60;
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, H, 6), towerMat);
      leg.position.set(Math.cos(ang) * 4, H / 2, Math.sin(ang) * 4);
      leg.rotation.set(Math.sin(ang) * -0.065, 0, Math.cos(ang) * 0.065);
      tower.add(leg);
    }
    for (let y = 4; y < H; y += 5) {
      const rad = 7.5 * (1 - y / H) + 0.6;
      const band = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.12, 4, 4), y % 10 < 5 ? towerMat : towerWhite);
      band.rotation.set(Math.PI / 2, 0, Math.PI / 4);
      band.position.y = y;
      tower.add(band);
    }
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2, 12), towerWhite);
    deck.position.y = H * 0.55;
    tower.add(deck);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.35, 22, 6), towerMat);
    spire.position.y = H + 11;
    tower.add(spire);
    const towerGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: "#ff7a3a", transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    towerGlow.scale.set(40, 90, 1);
    towerGlow.position.y = H * 0.5;
    tower.add(towerGlow);
    tower.position.set(CX - 30, 0, CZ - 85);
    tower.scale.setScalar(0.9);
    g.add(tower);

    // --- Lanterns strung across the street ------------------------------------
    const lanternMat = new THREE.MeshStandardMaterial({ map: lanternTexture(), emissiveMap: lanternTexture(), emissive: "#ff6a50", emissiveIntensity: 1.6, roughness: 0.7 });
    const lanternGeo = new THREE.SphereGeometry(0.32, 14, 10);
    lanternGeo.scale(1, 1.3, 1);
    const wireMat = new THREE.LineBasicMaterial({ color: "#151018" });
    const lanterns: THREE.Mesh[] = [];
    [
      [-9, 9, -12, -12],
      [-11, 11, 6, 5],
    ].forEach(([x0, x1, z0, z1]) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        pts.push(v(x0 + (x1 - x0) * t, 6.5 - Math.sin(t * Math.PI) * 1.4, z0 + (z1 - z0) * t));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
      for (let k = 2; k < 19; k += 2) {
        const p = pts[k];
        const l = new THREE.Mesh(lanternGeo, lanternMat);
        l.position.set(p.x, p.y - 0.45, p.z);
        l.userData.phase = k;
        g.add(l);
        lanterns.push(l);
      }
    });

    // --- Vending machines at the kerb ----------------------------------------
    const vmFace = (() => {
      const { c, g: ctx } = canvas(128, 256);
      ctx.fillStyle = "#e9f6ff";
      ctx.fillRect(0, 0, 128, 256);
      const cols = ["#ff4a4a", "#3a8bff", "#ffd23a", "#42d17a", "#ff8a3a", "#b06bff"];
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 5; x++) {
          ctx.fillStyle = cols[(x + y * 2) % cols.length];
          ctx.fillRect(10 + x * 22, 20 + y * 42, 14, 28);
        }
      ctx.fillStyle = "#1a1d2a";
      ctx.fillRect(10, 200, 108, 40);
      return toTexture(c);
    })();
    [
      [9.6, -7.2, -0.9],
      [10.4, -6.2, -0.9],
      [-10.2, 1.5, 1.6],
    ].forEach(([x, z, ry]) => {
      const m = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.85, 0.8), new THREE.MeshStandardMaterial({ color: "#d8dde6", roughness: 0.4, metalness: 0.3 }));
      body.position.y = 0.92;
      m.add(body);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.7), new THREE.MeshBasicMaterial({ map: vmFace, toneMapped: false }));
      front.position.set(0, 0.95, 0.41);
      m.add(front);
      const l = new THREE.PointLight("#bfe6ff", 3, 4, 2);
      l.position.set(0, 1, 0.9);
      m.add(l);
      m.position.set(x, 0.15, z);
      m.rotation.y = ry;
      g.add(m);
    });

    // --- A cherry tree in bloom, shedding petals --------------------------------
    const blossom = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 3.2, 8), new THREE.MeshStandardMaterial({ color: "#2a1a1c", roughness: 1 }));
    trunk.position.y = 1.6;
    blossom.add(trunk);
    const bloomMat = new THREE.MeshStandardMaterial({ color: "#ffb3d4", emissive: "#ff6aa8", emissiveIntensity: 0.25, roughness: 0.9 });
    for (let k = 0; k < 14; k++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + r() * 0.6, 1), bloomMat);
      puff.position.set((r() - 0.5) * 3.2, 3.4 + r() * 1.8, (r() - 0.5) * 3.2);
      blossom.add(puff);
    }
    blossom.position.set(-8.5, 0.15, -8.5);
    g.add(blossom);
    const PETALS = low ? 120 : 260;
    const petalGeo = new THREE.PlaneGeometry(0.07, 0.05);
    const petals = new THREE.InstancedMesh(petalGeo, new THREE.MeshBasicMaterial({ color: "#ffc2dc", side: THREE.DoubleSide }), PETALS);
    const petalState = Array.from({ length: PETALS }, () => ({
      x: CX + (r() - 0.5) * 18,
      y: r() * 7,
      z: CZ + (r() - 0.5) * 18,
      s: 0.3 + r() * 0.5,
      p: r() * 10,
    }));
    g.add(petals);

    return { g, sky, skyMat, blinkers, neonLights, lanterns, petals, petalState, PETALS };
    // Built once per mount; the mirror's resolution follows the canvas size at that time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      disposeGroup(set.g);
      set.g.traverse((o) => {
        if (o instanceof Reflector) o.getRenderTarget().dispose();
      });
    },
    [set]
  );

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1) }), []);

  useFrame((state, rawDelta) => {
    // Nothing to animate while this world is off screen.
    if (!isShown("anime")) return;
    const delta = Math.min(rawDelta, 1 / 20);
    // The sky turns with the walker, like the other worlds.
    set.sky.position.set(characterState.x, 0, characterState.z);
    set.sky.rotation.y = characterState.heading;
    const t = world.reduced ? 0 : state.clock.elapsedTime;
    set.skyMat.uniforms.uTime.value = t;
    // Aircraft beacons blink; a few signs flicker like old neon.
    set.blinkers.forEach((b, k) => {
      const mat = b.material as THREE.MeshBasicMaterial;
      if (b.geometry.type === "SphereGeometry") b.visible = Math.sin(t * 2 + b.userData.phase) > 0.6;
      else mat.color.setScalar(Math.sin(t * 23 + k) > 0.97 ? 0.3 : 1);
    });
    set.neonLights.forEach((l, k) => {
      l.intensity = 8.5 + Math.sin(t * 1.3 + k) * 1.2 + world.audioLevel * 6;
    });
    set.lanterns.forEach((l) => {
      l.rotation.z = Math.sin(t * 1.1 + l.userData.phase) * 0.06;
    });
    if (world.reduced) return;
    // Petals drift down and across on the breeze, then start again from above.
    set.petalState.forEach((p, i) => {
      p.y -= p.s * delta;
      p.x += Math.sin(t * 0.6 + p.p) * 0.3 * delta + 0.15 * delta;
      if (p.y < 0.02) {
        p.y = 6 + Math.random() * 2;
        p.x = CX + (Math.random() - 0.5) * 18;
      }
      tmp.p.set(p.x, p.y, p.z);
      tmp.e.set(t * p.s * 3 + p.p, t * 1.7 + p.p, 0);
      tmp.q.setFromEuler(tmp.e);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      set.petals.setMatrixAt(i, tmp.m);
    });
    set.petals.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={set.g} />;
};

export default AnimeSet;
