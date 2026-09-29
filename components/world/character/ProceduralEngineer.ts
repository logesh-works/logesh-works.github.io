import * as THREE from "three";

import { PoseMixer } from "./animation";
import { createCharacterMaterials } from "./materials";
import type { CharacterDriver, CharacterFrame, JointName, Outfit } from "./rig";

type V = [number, number, number];

/**
 * Code-built stand-in for the engineer, modelled on the reference character sheet:
 * a slim, adult-proportioned monkey with a brown swept quiff, heavy brows, big
 * brown eyes, a large rounded peach muzzle with a calm closed smile and big
 * pink-peach ears, in a black three-piece suit, white shirt, black tie, pocket
 * square and polished oxfords. About 1.85 m tall, facing +z.
 *
 * Primitives can only approximate a sculpted character. For an exact match, drop a
 * rigged GLB of the reference into `character/config.ts`; nothing else changes.
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

  const sphere = track(new THREE.SphereGeometry(1, 40, 30));
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

  // --- Hips, trousers, oxfords --------------------------------------------
  J.hips = joint(root, [0, 0.97, 0]);
  J.hips.add(mesh(sphere, m.suit, [0, 0, 0], [0.165, 0.11, 0.12]));

  const leg = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    const thigh = joint(J.hips, [0.09 * side, -0.02, 0]);
    thigh.add(mesh(cap(0.07, 0.32), m.suit, [0, -0.23, 0]));
    const knee = joint(thigh, [0, -0.45, 0]);
    knee.add(mesh(sphereLo, m.suit, [0, 0, 0], [0.064, 0.064, 0.064]));
    knee.add(mesh(cap(0.062, 0.33), m.suit, [0, -0.2, 0]));
    knee.add(mesh(box(0.004, 0.36, 0.004), m.lapel, [0, -0.2, 0.061])); // front crease
    const ankle = joint(knee, [0, -0.45, 0]);
    // oxford: glossy upper, toe cap, low sole and heel, laces
    ankle.add(mesh(cap(0.05, 0.17), m.shoe, [0, -0.045, 0.06], [1.05, 0.9, 0.72], [Math.PI / 2, 0, 0]));
    ankle.add(mesh(sphere, m.shoe, [0, -0.05, 0.16], [0.052, 0.04, 0.055]));
    ankle.add(mesh(box(0.105, 0.018, 0.3), m.sole, [0, -0.083, 0.055]));
    ankle.add(mesh(box(0.1, 0.03, 0.07), m.sole, [0, -0.075, -0.06]));
    ankle.add(mesh(box(0.05, 0.004, 0.06), m.lapel, [0, -0.012, 0.08], [1, 1, 1], [0.4, 0, 0]));
    J[`thigh${s}` as JointName] = thigh;
    J[`knee${s}` as JointName] = knee;
    J[`ankle${s}` as JointName] = ankle;
  };
  leg(1);
  leg(-1);

  // The tail stays tucked away under the jacket: the joint exists for the rig contract.
  J.tail = joint(J.hips, [0, -0.04, -0.12]);

  // --- Torso: jacket open over vest, shirt and tie ------------------------
  J.spine = joint(J.hips, [0, 0.08, 0]);
  const S = J.spine;
  const chestZ = 0.185 * 0.72;
  S.add(mesh(cap(0.185, 0.26), m.suit, [0, 0.26, 0], [1.08, 1, 0.72]));
  S.add(mesh(track(new THREE.CylinderGeometry(0.2, 0.215, 0.2, 30, 1, true)), m.suit, [0, 0.0, 0], [1.02, 1, 0.74])); // jacket skirt
  // vest in the jacket opening, with buttons
  const vestShape = new THREE.Shape();
  vestShape.moveTo(-0.075, 0);
  vestShape.lineTo(0.075, 0);
  vestShape.lineTo(0.075, 0.2);
  vestShape.lineTo(0, 0.32);
  vestShape.lineTo(-0.075, 0.2);
  vestShape.closePath();
  S.add(mesh(track(new THREE.ShapeGeometry(vestShape)), m.vest, [0, 0.12, chestZ + 0.004]));
  for (let b = 0; b < 4; b++) S.add(mesh(sphereLo, m.lapel, [0, 0.16 + b * 0.045, chestZ + 0.008], [0.008, 0.008, 0.004]));
  // shirt V above the vest, collar, tie with knot
  const shirtShape = new THREE.Shape();
  shirtShape.moveTo(-0.05, 0.2);
  shirtShape.lineTo(0.05, 0.2);
  shirtShape.lineTo(0, 0.0);
  shirtShape.closePath();
  S.add(mesh(track(new THREE.ShapeGeometry(shirtShape)), m.shirt, [0, 0.34, chestZ + 0.006]));
  const collar = box(0.05, 0.034, 0.012);
  S.add(mesh(collar, m.shirt, [-0.035, 0.535, 0.11], [1, 1, 1], [0.35, 0.2, 0.5]));
  S.add(mesh(collar, m.shirt, [0.035, 0.535, 0.11], [1, 1, 1], [0.35, -0.2, -0.5]));
  S.add(mesh(track(new THREE.CylinderGeometry(0.075, 0.08, 0.06, 26, 1, true)), m.shirt, [0, 0.53, 0], [1, 1, 0.95]));
  S.add(mesh(sphereLo, m.tie, [0, 0.515, chestZ + 0.02], [0.018, 0.016, 0.012]));
  const tieShape = new THREE.Shape();
  tieShape.moveTo(-0.012, 0.2);
  tieShape.lineTo(0.012, 0.2);
  tieShape.lineTo(0.022, 0.03);
  tieShape.lineTo(0, 0);
  tieShape.lineTo(-0.022, 0.03);
  tieShape.closePath();
  S.add(mesh(track(new THREE.ShapeGeometry(tieShape)), m.tie, [0, 0.3, chestZ + 0.012]));
  // notched lapels
  const lapelGeo = box(0.05, 0.27, 0.014);
  S.add(mesh(lapelGeo, m.lapel, [-0.07, 0.4, chestZ + 0.01], [1, 1, 1], [0, 0, -0.3]));
  S.add(mesh(lapelGeo, m.lapel, [0.07, 0.4, chestZ + 0.01], [1, 1, 1], [0, 0, 0.3]));
  // jacket fronts closing below the vest, one button
  S.add(mesh(box(0.1, 0.16, 0.02), m.suit, [-0.06, 0.1, chestZ - 0.002], [1, 1, 1], [0, 0, 0.08]));
  S.add(mesh(box(0.1, 0.16, 0.02), m.suit, [0.06, 0.1, chestZ - 0.002], [1, 1, 1], [0, 0, -0.08]));
  S.add(mesh(sphereLo, m.lapel, [0, 0.1, chestZ + 0.012], [0.01, 0.01, 0.005]));
  // pocket square on his left chest
  const sq = new THREE.Shape();
  sq.moveTo(0, 0);
  sq.lineTo(0.045, 0);
  sq.lineTo(0.036, 0.02);
  sq.lineTo(0.018, 0.012);
  sq.lineTo(0.006, 0.022);
  sq.closePath();
  S.add(mesh(track(new THREE.ShapeGeometry(sq)), m.square, [0.085, 0.385, chestZ - 0.014], [1, 1, 1], [0, 0.32, 0]));
  S.add(mesh(box(0.06, 0.004, 0.006), m.lapel, [0.105, 0.384, chestZ - 0.02], [1, 1, 1], [0, 0.32, 0]));

  // --- Neck & head ---------------------------------------------------------
  J.neck = joint(S, [0, 0.53, 0]);
  J.neck.add(mesh(track(new THREE.CylinderGeometry(0.055, 0.062, 0.1, 18)), m.fur, [0, 0.04, 0]));
  J.head = joint(J.neck, [0, 0.09, 0.012]);
  const H = J.head;
  H.add(mesh(sphere, m.fur, [0, 0.15, -0.015], [0.158, 0.165, 0.158])); // cranium
  // swept quiff: volume plus tufts brushed up and back
  H.add(mesh(sphere, m.fur, [0.01, 0.285, 0.035], [0.1, 0.05, 0.085], [-0.3, 0, -0.12]));
  const tuft = track(new THREE.ConeGeometry(0.03, 0.1, 12));
  for (const [x, y, z, rx, rz] of [
    [-0.03, 0.31, 0.07, -1.0, 0.35],
    [0.0, 0.32, 0.05, -1.15, 0.05],
    [0.035, 0.315, 0.035, -1.05, -0.3],
    [0.06, 0.3, 0.0, -0.9, -0.55],
    [-0.055, 0.3, 0.02, -0.85, 0.6],
  ] as [number, number, number, number, number][]) {
    H.add(mesh(tuft, m.fur, [x, y, z], [1, 1, 1], [rx, 0, rz]));
  }
  // heart-shaped peach face: two lobes around the eyes, then the big muzzle and chin
  for (const side of [1, -1]) H.add(mesh(sphere, m.skin, [0.05 * side, 0.165, 0.095], [0.074, 0.08, 0.05]));
  H.add(mesh(sphere, m.skin, [0, 0.085, 0.112], [0.108, 0.086, 0.09]));
  H.add(mesh(sphere, m.skin, [0, 0.035, 0.095], [0.085, 0.052, 0.07]));
  // heavy expressive brows
  for (const side of [1, -1]) H.add(mesh(cap(0.017, 0.07), m.furDark, [0.05 * side, 0.232, 0.125], [1, 1, 0.75], [0, 0.15 * side, Math.PI / 2 - 0.16 * side]));
  // nose: two nostrils high on the muzzle, and a calm closed smile
  H.add(mesh(sphere, m.skinDeep, [0, 0.135, 0.19], [0.03, 0.016, 0.016]));
  for (const side of [1, -1]) H.add(mesh(sphereLo, m.mouth, [0.012 * side, 0.128, 0.203], [0.007, 0.005, 0.004]));
  H.add(mesh(track(new THREE.TorusGeometry(0.036, 0.0035, 6, 24, Math.PI * 0.62)), m.mouth, [0, 0.083, 0.2], [1.25, 0.55, 1], [0, 0, Math.PI * 1.19]));
  // big round pink-peach ears
  for (const side of [1, -1]) {
    H.add(mesh(sphere, m.ear, [0.185 * side, 0.165, 0.005], [0.028, 0.078, 0.078], [0, -0.25 * side, 0]));
    H.add(mesh(sphere, m.earInner, [0.197 * side, 0.165, 0.016], [0.012, 0.055, 0.055], [0, -0.25 * side, 0]));
  }

  // eyes: sclera, brown iris, pupil, glint; lids blink. Eye groups rotate for gaze.
  const eyes: THREE.Group[] = [];
  const lids: THREE.Group[] = [];
  const lidGeo = track(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2));
  for (const side of [1, -1]) {
    const socket = joint(H, [0.05 * side, 0.168, 0.128]);
    const eye = joint(socket, [0, 0, 0]);
    eye.add(mesh(sphere, m.eyeWhite, [0, 0, 0], [0.034, 0.036, 0.026]));
    eye.add(mesh(sphere, m.iris, [0, 0, 0.019], [0.022, 0.023, 0.009]));
    eye.add(mesh(sphereLo, m.pupil, [0, 0, 0.025], [0.011, 0.011, 0.004]));
    eye.add(mesh(sphereLo, m.glint, [0.008, 0.01, 0.028], [0.004, 0.004, 0.002]));
    const lid = joint(socket, [0, 0, 0]);
    lid.add(mesh(lidGeo, m.skin, [0, 0, 0], [0.037, 0.039, 0.03]));
    eyes.push(eye);
    lids.push(lid);
  }

  // --- Arms ------------------------------------------------------------------
  let laptop: THREE.Object3D | null = null;
  const arm = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    const shoulder = joint(S, [0.205 * side, 0.43, 0]);
    shoulder.add(mesh(sphere, m.suit, [0, 0, 0], [0.07, 0.066, 0.068]));
    shoulder.add(mesh(cap(0.054, 0.23), m.suit, [0, -0.155, 0]));
    const elbow = joint(shoulder, [0, -0.31, 0]);
    elbow.add(mesh(sphereLo, m.suit, [0, 0, 0], [0.05, 0.05, 0.05]));
    elbow.add(mesh(cap(0.049, 0.2), m.suit, [0, -0.125, 0]));
    const wrist = joint(elbow, [0, -0.28, 0]);
    wrist.add(mesh(track(new THREE.CylinderGeometry(0.042, 0.044, 0.03, 18)), m.shirt, [0, 0.018, 0])); // shirt cuff
    wrist.add(mesh(sphere, m.skin, [0, -0.06, 0.006], [0.042, 0.058, 0.03]));
    wrist.add(mesh(cap(0.018, 0.05), m.skin, [0, -0.115, 0.012], [1.8, 1, 1])); // fingers
    wrist.add(mesh(cap(0.013, 0.034), m.skin, [0.036 * -side, -0.048, 0.022], [1, 1, 1], [0.5, 0, 0.6 * side])); // thumb
    if (side === -1) {
      // Laptop carried at his right side (shown in worlds that call for it).
      const lap = new THREE.Group();
      lap.position.set(-0.012, -0.13, 0.05);
      lap.rotation.set(0.18, 0, 0);
      lap.add(mesh(box(0.018, 0.23, 0.32), m.laptop));
      lap.add(mesh(sphereLo, m.glint, [-0.0095, 0.02, 0.02], [0.0005, 0.014, 0.014]));
      lap.visible = false;
      wrist.add(lap);
      laptop = lap;
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
      // Lids rest open (bright, attentive eyes like the reference), follow the gaze, roll down to blink.
      const lidRest = -0.55 + gaze.x * 0.6;
      lids.forEach((l) => (l.rotation.x = 1.45 + (lidRest - 1.45) * open));
    },
    setOutfit(o: Outfit) {
      m.suit.color.set(o.suit);
      m.vest.color.set(o.vest);
      m.shirt.color.set(o.shirt);
      m.tie.color.set(o.tie);
      m.square.color.set(o.square);
      m.shoe.color.set(o.shoe);
      if (laptop) laptop.visible = o.laptop;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      m.dispose();
    },
  };
};
