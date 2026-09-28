import * as THREE from "three";

import { PoseMixer } from "./animation";
import { createCharacterMaterials } from "./materials";
import type { CharacterDriver, CharacterFrame, JointName } from "./rig";

type V = [number, number, number];

/**
 * Stand-in engineer built from primitives, in the stylised premium-monkey
 * character language: a big rounded head, heart-shaped light face mask,
 * protruding muzzle, large round ears, expressive eyes (whites, iris, pupil,
 * blinking lids) and round glasses. Outfit: dark technical jacket over a hoodie,
 * bronze headphones round the neck, backpack, cargo trousers and sneakers.
 * About 1.85 m tall, facing +z. Swap for a sculpted GLB via `character/config.ts`.
 */
export const createProceduralEngineer = (): CharacterDriver => {
  const m = createCharacterMaterials();
  const geos: THREE.BufferGeometry[] = [];
  const track = <G extends THREE.BufferGeometry>(g: G) => (geos.push(g), g);

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: V = [0, 0, 0], scale: V = [1, 1, 1], rot: V = [0, 0, 0]) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(...pos);
    o.scale.set(...scale);
    o.rotation.set(...rot);
    return o;
  };
  const joint = (parent: THREE.Object3D, pos: V) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    parent.add(g);
    return g;
  };

  const sphere = track(new THREE.SphereGeometry(1, 36, 28));
  const sphereLo = track(new THREE.SphereGeometry(1, 16, 12));
  const capCache = new Map<string, THREE.CapsuleGeometry>();
  const cap = (r: number, l: number) => {
    const k = `${r}:${l}`;
    if (!capCache.has(k)) capCache.set(k, track(new THREE.CapsuleGeometry(r, l, 8, 20)));
    return capCache.get(k)!;
  };
  const box = (x: number, y: number, z: number) => track(new THREE.BoxGeometry(x, y, z));

  const root = new THREE.Group();
  root.name = "engineer";
  const J = {} as Record<JointName, THREE.Group>;

  // --- Hips, cargo trousers, sneakers -------------------------------------
  J.hips = joint(root, [0, 0.95, 0]);
  J.hips.add(mesh(sphere, m.cargo, [0, 0, 0], [0.175, 0.11, 0.13]));

  const leg = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    const thigh = joint(J.hips, [0.098 * side, -0.02, 0]);
    thigh.add(mesh(cap(0.082, 0.3), m.cargo, [0, -0.22, 0]));
    thigh.add(mesh(box(0.035, 0.11, 0.1), m.cargo, [0.078 * side, -0.26, 0.005])); // cargo pocket
    thigh.add(mesh(box(0.004, 0.02, 0.075), m.bronze, [0.097 * side, -0.215, 0.005])); // pocket snap
    const knee = joint(thigh, [0, -0.44, 0]);
    knee.add(mesh(sphereLo, m.cargo, [0, 0, 0], [0.072, 0.072, 0.072]));
    knee.add(mesh(cap(0.068, 0.3), m.cargo, [0, -0.19, 0]));
    knee.add(mesh(track(new THREE.CylinderGeometry(0.058, 0.064, 0.05, 20)), m.hoodie, [0, -0.39, 0])); // gathered cuff
    const ankle = joint(knee, [0, -0.44, 0]);
    ankle.add(mesh(cap(0.058, 0.16), m.sneaker, [0, -0.035, 0.06], [1.05, 1, 0.7], [Math.PI / 2, 0, 0]));
    ankle.add(mesh(box(0.125, 0.038, 0.3), m.sole, [0, -0.078, 0.055]));
    ankle.add(mesh(track(new THREE.CylinderGeometry(0.066, 0.07, 0.09, 20)), m.sneaker, [0, 0.005, 0])); // high-top collar
    ankle.add(mesh(box(0.13, 0.03, 0.16), m.sole, [0, -0.045, 0.02])); // white side panel
    ankle.add(mesh(box(0.126, 0.006, 0.06), m.bronze, [0, -0.057, -0.08])); // heel tab
    J[`thigh${s}` as JointName] = thigh;
    J[`knee${s}` as JointName] = knee;
    J[`ankle${s}` as JointName] = ankle;
  };
  leg(1);
  leg(-1);

  J.tail = joint(J.hips, [0, -0.04, -0.13]);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.16, -0.16),
    new THREE.Vector3(0.02, -0.12, -0.36),
    new THREE.Vector3(0.03, 0.08, -0.46),
    new THREE.Vector3(0.02, 0.24, -0.4),
    new THREE.Vector3(0, 0.3, -0.3),
  ]);
  J.tail.add(new THREE.Mesh(track(new THREE.TubeGeometry(tailCurve, 48, 0.021, 10, false)), m.fur));

  // --- Torso: technical jacket open over a hoodie --------------------------
  J.spine = joint(J.hips, [0, 0.08, 0]);
  const S = J.spine;
  S.add(mesh(cap(0.195, 0.27), m.jacket, [0, 0.26, 0], [1.07, 1, 0.74]));
  S.add(mesh(track(new THREE.CylinderGeometry(0.205, 0.215, 0.12, 30, 1, true)), m.jacket, [0, 0.04, 0], [1.03, 1, 0.76]));
  const chestZ = 0.195 * 0.74;
  // hoodie visible in the open front, with drawstrings
  S.add(mesh(box(0.13, 0.36, 0.01), m.hoodie, [0, 0.29, chestZ + 0.004]));
  S.add(mesh(box(0.13, 0.08, 0.02), m.hoodie, [0, 0.13, chestZ + 0.006])); // kangaroo pocket edge
  for (const x of [-0.03, 0.03]) {
    S.add(mesh(cap(0.004, 0.08), m.sole, [x, 0.4, chestZ + 0.012]));
    S.add(mesh(cap(0.006, 0.012), m.bronze, [x, 0.35, chestZ + 0.012]));
  }
  // zip lines along both jacket edges, chest pocket zip, collar stand
  for (const x of [-0.07, 0.07]) S.add(mesh(box(0.006, 0.36, 0.006), m.bronze, [x, 0.28, chestZ + 0.008]));
  S.add(mesh(box(0.07, 0.005, 0.005), m.bronze, [0.12, 0.38, chestZ - 0.012], [1, 1, 1], [0, 0.45, -0.25]));
  S.add(mesh(track(new THREE.CylinderGeometry(0.105, 0.115, 0.075, 28, 1, true, 0.55, Math.PI * 2 - 1.1)), m.jacket, [0, 0.53, -0.005], [1, 1, 0.95]));
  // hood resting behind the neck
  S.add(mesh(sphere, m.hoodie, [0, 0.49, -0.12], [0.16, 0.085, 0.1]));

  // backpack + straps
  S.add(mesh(cap(0.11, 0.15), m.pack, [0, 0.3, -0.18], [1.12, 1, 0.5]));
  S.add(mesh(box(0.12, 0.01, 0.04), m.bronze, [0, 0.24, -0.235]));
  S.add(mesh(track(new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI)), m.pack, [0, 0.46, -0.18]));
  for (const x of [-0.105, 0.105]) {
    S.add(mesh(box(0.04, 0.38, 0.014), m.pack, [x, 0.32, chestZ - 0.005], [1, 1, 1], [0.05, 0, x > 0 ? -0.08 : 0.08]));
    S.add(mesh(box(0.034, 0.018, 0.02), m.bronze, [x * 1.02, 0.26, chestZ + 0.006]));
  }

  // headphones around the neck: band behind, bronze cups resting on the collar
  S.add(mesh(track(new THREE.TorusGeometry(0.135, 0.014, 10, 40, Math.PI)), m.frame, [0, 0.545, 0], [1, 1, 0.9], [-Math.PI / 2, 0, 0]));
  for (const side of [1, -1]) {
    const cup = new THREE.Group();
    cup.position.set(0.135 * side, 0.53, 0.035);
    cup.rotation.set(0.3, 0, (Math.PI / 2) * side * 0.85);
    cup.add(mesh(track(new THREE.CylinderGeometry(0.066, 0.066, 0.04, 32)), m.frame));
    cup.add(mesh(track(new THREE.TorusGeometry(0.058, 0.008, 10, 36)), m.bronze, [0, 0.021, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
    cup.add(mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 0.044, 24)), m.bronze));
    cup.add(mesh(track(new THREE.CylinderGeometry(0.062, 0.064, 0.026, 28)), m.pad, [0, -0.03, 0]));
    S.add(cup);
  }

  // --- Neck & head ---------------------------------------------------------
  J.neck = joint(S, [0, 0.52, 0]);
  J.neck.add(mesh(track(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 18)), m.fur, [0, 0.03, 0]));
  J.head = joint(J.neck, [0, 0.08, 0.01]);
  const H = J.head;
  H.add(mesh(sphere, m.fur, [0, 0.14, -0.01], [0.175, 0.172, 0.165]));
  // tuft
  const spike = track(new THREE.ConeGeometry(0.03, 0.09, 10));
  for (const [x, z, rz, rx] of [[-0.05, 0.02, 0.5, -0.5], [-0.02, 0.04, 0.2, -0.7], [0.015, 0.03, -0.1, -0.6], [0.05, 0.0, -0.45, -0.5], [0, -0.04, 0, -0.3]] as [number, number, number, number][]) {
    H.add(mesh(spike, m.fur, [x, 0.3, z], [1, 1, 1], [rx, 0, rz]));
  }
  // heart-shaped face mask, heavy brow, muzzle
  for (const side of [1, -1]) H.add(mesh(sphere, m.skin, [0.052 * side, 0.155, 0.098], [0.078, 0.086, 0.05]));
  H.add(mesh(sphere, m.skin, [0, 0.075, 0.118], [0.1, 0.078, 0.085]));
  H.add(mesh(sphere, m.skin, [0, 0.03, 0.1], [0.07, 0.045, 0.06]));
  H.add(mesh(cap(0.022, 0.13), m.fur, [0, 0.205, 0.125], [1, 1, 0.8], [0, 0, Math.PI / 2]));
  H.add(mesh(sphere, m.skinDeep, [0, 0.118, 0.19], [0.035, 0.018, 0.018]));
  for (const side of [1, -1]) H.add(mesh(sphereLo, m.mouth, [0.013 * side, 0.108, 0.204], [0.008, 0.005, 0.005]));
  H.add(mesh(track(new THREE.TorusGeometry(0.03, 0.0035, 6, 20, Math.PI * 0.7)), m.mouth, [0, 0.07, 0.196], [1.2, 0.6, 1], [0, 0, Math.PI * 1.15]));
  // ears
  for (const side of [1, -1]) {
    H.add(mesh(sphere, m.fur, [0.18 * side, 0.15, -0.005], [0.03, 0.075, 0.072], [0, -0.3 * side, 0]));
    H.add(mesh(sphere, m.skin, [0.19 * side, 0.15, 0.008], [0.014, 0.052, 0.05], [0, -0.3 * side, 0]));
  }

  // eyes: sclera, iris, pupil, glint; lids blink. Eye groups rotate for gaze.
  const eyes: THREE.Group[] = [];
  const lids: THREE.Group[] = [];
  const lidGeo = track(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2));
  for (const side of [1, -1]) {
    const socket = joint(H, [0.051 * side, 0.155, 0.128]);
    const eye = joint(socket, [0, 0, 0]);
    eye.add(mesh(sphere, m.eyeWhite, [0, 0, 0], [0.031, 0.031, 0.024]));
    eye.add(mesh(sphere, m.iris, [0, 0, 0.018], [0.019, 0.019, 0.008]));
    eye.add(mesh(sphereLo, m.pupil, [0, 0, 0.023], [0.009, 0.009, 0.004]));
    eye.add(mesh(sphereLo, m.glint, [0.007, 0.008, 0.026], [0.0035, 0.0035, 0.002]));
    const lid = joint(socket, [0, 0, 0]);
    lid.add(mesh(lidGeo, m.fur, [0, 0, 0], [0.034, 0.034, 0.028]));
    eyes.push(eye);
    lids.push(lid);
  }
  // round glasses
  const outer = new THREE.Shape();
  const rr = (s: THREE.Shape | THREE.Path, w: number, h: number, r: number) => {
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  };
  rr(outer, 0.098, 0.068, 0.018);
  const hole = new THREE.Path();
  rr(hole, 0.08, 0.05, 0.012);
  outer.holes.push(hole);
  const rim = track(new THREE.ExtrudeGeometry(outer, { depth: 0.01, bevelEnabled: false, curveSegments: 6 }));
  for (const side of [1, -1]) {
    H.add(mesh(rim, m.frame, [0.054 * side, 0.152, 0.163]));
    H.add(mesh(box(0.004, 0.004, 0.17), m.frame, [0.093 * side, 0.158, 0.09], [1, 1, 1], [0, 0.18 * side, 0]));
  }
  H.add(mesh(box(0.02, 0.008, 0.008), m.frame, [0, 0.162, 0.17]));

  // --- Arms ------------------------------------------------------------------
  const arm = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    const shoulder = joint(S, [0.215 * side, 0.43, 0]);
    shoulder.add(mesh(sphere, m.jacket, [0, 0, 0], [0.078, 0.074, 0.076]));
    shoulder.add(mesh(cap(0.06, 0.22), m.jacket, [0, -0.15, 0]));
    const elbow = joint(shoulder, [0, -0.3, 0]);
    elbow.add(mesh(sphereLo, m.jacket, [0, 0, 0], [0.056, 0.056, 0.056]));
    elbow.add(mesh(cap(0.053, 0.19), m.jacket, [0, -0.12, 0]));
    const wrist = joint(elbow, [0, -0.27, 0]);
    wrist.add(mesh(track(new THREE.CylinderGeometry(0.046, 0.05, 0.04, 18)), m.hoodie, [0, 0.015, 0]));
    wrist.add(mesh(sphere, m.skin, [0, -0.065, 0.006], [0.046, 0.062, 0.032]));
    wrist.add(mesh(cap(0.02, 0.05), m.skin, [0, -0.12, 0.012], [1.8, 1, 1])); // fingers
    wrist.add(mesh(cap(0.014, 0.036), m.skin, [0.038 * -side, -0.05, 0.024], [1, 1, 1], [0.5, 0, 0.6 * side]));
    if (side === 1) {
      shoulder.add(mesh(box(0.012, 0.06, 0.05), m.patch, [0.058, -0.1, 0.005]));
      wrist.add(mesh(track(new THREE.TorusGeometry(0.045, 0.008, 8, 24)), m.pad, [0, -0.02, 0], [1, 1, 0.8], [Math.PI / 2, 0, 0]));
      wrist.add(mesh(track(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 24)), m.bronze, [0.044, -0.02, 0], [1, 1, 1], [0, 0, Math.PI / 2]));
    }
    J[`shoulder${s}` as JointName] = shoulder;
    J[`elbow${s}` as JointName] = elbow;
    J[`wrist${s}` as JointName] = wrist;
  };
  arm(1);
  arm(-1);

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  const rest = new Map<JointName, THREE.Euler>();
  (Object.keys(J) as JointName[]).forEach((k) => rest.set(k, J[k].rotation.clone()));
  const hipsY = J.hips.position.y;
  const mixer = new PoseMixer();

  // Eyes: gaze follows the look target, with small saccades; blinks every few seconds.
  const gaze = { x: 0, y: 0, sx: 0, sy: 0, nextSaccade: 1, nextBlink: 2.5, blinkT: -1 };

  return {
    root,
    update(frame: CharacterFrame) {
      const pose = mixer.compute(frame);
      const k = Math.min(frame.delta * 14, 1);
      (Object.keys(J) as JointName[]).forEach((name) => {
        const target = pose[name];
        const r = rest.get(name)!;
        const j = J[name];
        j.rotation.x += (r.x + (target?.[0] ?? 0) - j.rotation.x) * k;
        j.rotation.y += (r.y + (target?.[1] ?? 0) - j.rotation.y) * k;
        j.rotation.z += (r.z + (target?.[2] ?? 0) - j.rotation.z) * k;
      });
      const bob = -0.034 * (1 - Math.abs(Math.cos(frame.phase))) * frame.walk;
      const breathe = 0.003 * Math.sin(frame.time * 1.35) * (1 - frame.walk);
      J.hips.position.y += (hipsY + bob + breathe - 0.012 * (1 - frame.walk) - J.hips.position.y) * k;

      // Saccades: tiny, quick re-targets around the gaze direction.
      if (frame.time > gaze.nextSaccade) {
        gaze.sx = (Math.random() - 0.5) * 0.18;
        gaze.sy = (Math.random() - 0.5) * 0.1;
        gaze.nextSaccade = frame.time + 0.6 + Math.random() * 2.2;
      }
      const ex = THREE.MathUtils.clamp(frame.lookPitch * 0.35 + gaze.sy, -0.3, 0.3);
      const ey = THREE.MathUtils.clamp(frame.lookYaw * 0.3 + gaze.sx, -0.4, 0.4);
      gaze.x += (ex - gaze.x) * Math.min(frame.delta * 18, 1);
      gaze.y += (ey - gaze.y) * Math.min(frame.delta * 18, 1);
      eyes.forEach((e) => e.rotation.set(gaze.x, gaze.y, 0));

      // Blink: lids sweep down and back up in ~150 ms.
      if (gaze.blinkT < 0 && frame.time > gaze.nextBlink) gaze.blinkT = 0;
      let open = 1;
      if (gaze.blinkT >= 0) {
        gaze.blinkT += frame.delta;
        const t = gaze.blinkT / 0.15;
        open = t < 0.5 ? 1 - t * 2 : Math.min((t - 0.5) * 2, 1);
        if (t >= 1) {
          gaze.blinkT = -1;
          gaze.nextBlink = frame.time + 2.2 + Math.random() * 3.8;
        }
      }
      // Upper lids rest slightly low (a calm, focused look), roll forward over the eye to blink,
      // and follow the gaze vertically like real lids.
      const lidRest = -0.3 + gaze.x * 0.6;
      lids.forEach((l) => (l.rotation.x = 1.45 + (lidRest - 1.45) * open));
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      m.dispose();
    },
  };
};
