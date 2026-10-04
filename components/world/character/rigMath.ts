import * as THREE from "three";

import type { Landmarks } from "./config";
import type { JointName } from "./rig";

/**
 * The numeric half of the in-browser auto-rig, free of the DOM so it can run in a
 * worker: joint placement, skin weights and the T/A-pose → relaxed bake. Works on
 * full-resolution meshes (millions of triangles) without stalling the page.
 */

/** Each bone's parent, in creation order (parents first). */
export const HIERARCHY: [JointName, JointName | null][] = [
  ["hips", null],
  ["spine", "hips"],
  ["neck", "spine"],
  ["head", "neck"],
  ["shoulderL", "spine"],
  ["elbowL", "shoulderL"],
  ["wristL", "elbowL"],
  ["shoulderR", "spine"],
  ["elbowR", "shoulderR"],
  ["wristR", "elbowR"],
  ["thighL", "hips"],
  ["kneeL", "thighL"],
  ["ankleL", "kneeL"],
  ["thighR", "hips"],
  ["kneeR", "thighR"],
  ["ankleR", "kneeR"],
];

export type Vec3 = [number, number, number];

export interface RigInput {
  parts: { position: Float32Array; normal: Float32Array }[];
  height: number;
  landmarks: Landmarks;
}

export interface RigOutput {
  /** Rest-pose joint positions (after any relaxing bake). */
  joints: Partial<Record<JointName, Vec3>>;
  parts: { position: Float32Array; normal: Float32Array; skinIndex: Uint16Array; skinWeight: Float32Array }[];
}

/** Radius of the body part each bone carries, as a fraction of height. */
const RADIUS: Partial<Record<JointName, number>> = {
  hips: 0.11,
  spine: 0.11,
  neck: 0.045,
  head: 0.08,
  shoulderL: 0.04,
  elbowL: 0.035,
  wristL: 0.03,
  thighL: 0.06,
  kneeL: 0.045,
  ankleL: 0.04,
};
const radiusOf = (name: JointName) => RADIUS[name] ?? RADIUS[name.replace(/R$/, "L") as JointName] ?? 0.05;
const sideOf = (name: JointName) => (/L$/.test(name) ? 1 : /R$/.test(name) ? -1 : 0);

export const computeRig = ({ parts, height: H, landmarks: lm }: RigInput): RigOutput => {
  const names = HIERARCHY.map(([n]) => n);

  // Depth of the body at a joint: the middle of the vertices around it.
  const depthAt = (x: number, y: number) => {
    const r = 0.05 * H;
    let lo = Infinity;
    let hi = -Infinity;
    parts.forEach(({ position: p }) => {
      for (let i = 0; i < p.length; i += 3) {
        if (Math.abs(p[i] - x) < r && Math.abs(p[i + 1] - y) < r) {
          const z = p[i + 2];
          if (z < lo) lo = z;
          if (z > hi) hi = z;
        }
      }
    });
    return Number.isFinite(lo) ? (lo + hi) / 2 : 0;
  };
  const point = (x: number, y: number) => new THREE.Vector3(x * H, y * H, depthAt(x * H, y * H));

  // Joint positions, and where each bone's segment ends.
  const at: Partial<Record<JointName, THREE.Vector3>> = {};
  const end: Partial<Record<JointName, THREE.Vector3>> = {};
  at.hips = point(0, lm.hips);
  at.spine = point(0, lm.spine);
  at.neck = point(0, lm.neck);
  at.head = point(0, lm.head);
  end.hips = at.spine;
  end.spine = at.neck;
  end.neck = at.head;
  end.head = new THREE.Vector3(0, H, at.head.z);
  ([1, -1] as const).forEach((s) => {
    const k = s === 1 ? "L" : "R";
    const el = point(lm.elbow[0] * s, lm.elbow[1]);
    const wr = point(lm.wrist[0] * s, lm.wrist[1]);
    const kn = point(lm.legX * s, lm.knee);
    const an = point(lm.legX * s, lm.ankle);
    at[`shoulder${k}` as JointName] = point(lm.shoulder[0] * s, lm.shoulder[1]);
    at[`elbow${k}` as JointName] = el;
    at[`wrist${k}` as JointName] = wr;
    at[`thigh${k}` as JointName] = point(lm.legX * s, lm.hips - 0.02);
    at[`knee${k}` as JointName] = kn;
    at[`ankle${k}` as JointName] = an;
    end[`shoulder${k}` as JointName] = el;
    end[`elbow${k}` as JointName] = wr;
    end[`wrist${k}` as JointName] = point(lm.hand[0] * s, lm.hand[1]);
    end[`thigh${k}` as JointName] = kn;
    end[`knee${k}` as JointName] = an;
    end[`ankle${k}` as JointName] = new THREE.Vector3(an.x, 0, an.z + 0.04 * H);
  });

  // Flat segment data for the hot loop.
  const B = names.length;
  const seg = new Float32Array(B * 6);
  const inv = new Float32Array(B);
  const side = new Int8Array(B);
  names.forEach((n, b) => {
    const a = at[n]!;
    const e = end[n]!;
    seg.set([a.x, a.y, a.z, e.x - a.x, e.y - a.y, e.z - a.z], b * 6);
    inv[b] = 1 / (radiusOf(n) * H);
    side[b] = sideOf(n);
  });
  const margin = -0.01 * H;

  // Skin weights: the four nearest bones by normalised distance, inverse-power falloff.
  const weighted = parts.map(({ position: p }) => {
    const count = p.length / 3;
    const skinIndex = new Uint16Array(count * 4);
    const skinWeight = new Float32Array(count * 4);
    const topI = [0, 0, 0, 0];
    const topS = [0, 0, 0, 0];
    for (let i = 0; i < count; i++) {
      const x = p[i * 3];
      const y = p[i * 3 + 1];
      const z = p[i * 3 + 2];
      topS.fill(-1);
      for (let b = 0; b < B; b++) {
        // A limb never takes vertices from the far side of the body.
        if (side[b] !== 0 && x * side[b] < margin) continue;
        const o = b * 6;
        const dx = x - seg[o];
        const dy = y - seg[o + 1];
        const dz = z - seg[o + 2];
        const len2 = seg[o + 3] * seg[o + 3] + seg[o + 4] * seg[o + 4] + seg[o + 5] * seg[o + 5];
        const t = len2 > 0 ? (dx * seg[o + 3] + dy * seg[o + 4] + dz * seg[o + 5]) / len2 : 0;
        const c = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = dx - seg[o + 3] * c;
        const ey = dy - seg[o + 4] * c;
        const ez = dz - seg[o + 5] * c;
        let dn = Math.sqrt(ex * ex + ey * ey + ez * ez) * inv[b];
        // Behind a limb's root (toward the torso), fall off fast.
        if (side[b] !== 0 && t < 0) dn *= 1.8;
        const dn2 = dn * dn;
        const score = 1 / (dn2 * dn2 + 1e-4);
        // Insert into the running top four.
        if (score <= topS[3]) continue;
        let k = 3;
        while (k > 0 && score > topS[k - 1]) {
          topS[k] = topS[k - 1];
          topI[k] = topI[k - 1];
          k--;
        }
        topS[k] = score;
        topI[k] = b;
      }
      let sum = 0;
      for (let k = 0; k < 4; k++) if (topS[k] > 0) sum += topS[k];
      for (let k = 0; k < 4; k++) {
        skinIndex[i * 4 + k] = topS[k] > 0 ? topI[k] : 0;
        skinWeight[i * 4 + k] = topS[k] > 0 ? topS[k] / (sum || 1) : 0;
      }
    }
    return { skinIndex, skinWeight };
  });

  let joints = at;
  let out = parts.map((p, k) => ({ position: p.position, normal: p.normal, ...weighted[k] }));

  // T/A-pose → relaxed: lower the arms and bake the result into the vertices.
  if (lm.armsDown) {
    const bones: Partial<Record<JointName, THREE.Bone>> = {};
    HIERARCHY.forEach(([n, parent]) => {
      const b = new THREE.Bone();
      if (parent) {
        b.position.subVectors(at[n]!, at[parent]!);
        bones[parent]!.add(b);
      } else b.position.copy(at[n]!);
      bones[n] = b;
    });
    bones.shoulderL!.rotation.z = -lm.armsDown;
    bones.shoulderR!.rotation.z = lm.armsDown;
    bones.elbowL!.rotation.x = -0.12;
    bones.elbowR!.rotation.x = -0.12;
    bones.hips!.updateMatrixWorld(true);
    // Skinning matrix per bone: posed world × inverse of the rest (translation-only) world.
    const mats = names.map((n) => new THREE.Matrix4().multiplyMatrices(bones[n]!.matrixWorld, new THREE.Matrix4().makeTranslation(at[n]!).invert()).elements);
    out = out.map(({ position: p, normal: nr, skinIndex, skinWeight }) => {
      const count = p.length / 3;
      const P = new Float32Array(p.length);
      const N = new Float32Array(nr.length);
      for (let i = 0; i < count; i++) {
        const x = p[i * 3];
        const y = p[i * 3 + 1];
        const z = p[i * 3 + 2];
        const nx = nr[i * 3];
        const ny = nr[i * 3 + 1];
        const nz = nr[i * 3 + 2];
        let px = 0;
        let py = 0;
        let pz = 0;
        let qx = 0;
        let qy = 0;
        let qz = 0;
        for (let k = 0; k < 4; k++) {
          const w = skinWeight[i * 4 + k];
          if (!w) continue;
          const e = mats[skinIndex[i * 4 + k]];
          px += w * (e[0] * x + e[4] * y + e[8] * z + e[12]);
          py += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
          pz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
          qx += w * (e[0] * nx + e[4] * ny + e[8] * nz);
          qy += w * (e[1] * nx + e[5] * ny + e[9] * nz);
          qz += w * (e[2] * nx + e[6] * ny + e[10] * nz);
        }
        const l = Math.hypot(qx, qy, qz) || 1;
        P[i * 3] = px;
        P[i * 3 + 1] = py;
        P[i * 3 + 2] = pz;
        N[i * 3] = qx / l;
        N[i * 3 + 1] = qy / l;
        N[i * 3 + 2] = qz / l;
      }
      return { position: P, normal: N, skinIndex, skinWeight };
    });
    const posed: Partial<Record<JointName, THREE.Vector3>> = {};
    names.forEach((n) => (posed[n] = bones[n]!.getWorldPosition(new THREE.Vector3())));
    joints = posed;
  }

  const result: Partial<Record<JointName, Vec3>> = {};
  names.forEach((n) => (result[n] = joints[n]!.toArray() as Vec3));
  return { joints: result, parts: out };
};
