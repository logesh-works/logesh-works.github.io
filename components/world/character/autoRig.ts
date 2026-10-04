import * as THREE from "three";

import type { Landmarks } from "./config";
import type { JointName } from "./rig";
import { HIERARCHY, computeRig, type RigInput, type RigOutput } from "./rigMath";

/** Plain float copy of an attribute (meshopt stores quantised, normalised integers). */
const toFloat = (attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const n = attr.count * attr.itemSize;
  if (!(attr instanceof THREE.InterleavedBufferAttribute)) {
    const src = attr.array;
    if (src instanceof Float32Array) return src.slice(0, n);
    const out = new Float32Array(n);
    // Normalised integers map to [-1, 1] (signed) or [0, 1] (unsigned).
    const scale =
      !attr.normalized ? 1
      : src instanceof Int8Array ? 1 / 127
      : src instanceof Uint8Array ? 1 / 255
      : src instanceof Int16Array ? 1 / 32767
      : src instanceof Uint16Array ? 1 / 65535
      : 1;
    const signed = attr.normalized && (src instanceof Int8Array || src instanceof Int16Array);
    for (let i = 0; i < n; i++) {
      const v = src[i] * scale;
      out[i] = signed && v < -1 ? -1 : v;
    }
    return out;
  }
  const out = new Float32Array(n);
  for (let i = 0; i < attr.count; i++) for (let k = 0; k < attr.itemSize; k++) out[i * attr.itemSize + k] = attr.getComponent(i, k);
  return out;
};

/** Runs the rig maths in a worker (the meshes can be millions of triangles), or inline where workers are unavailable. */
const solve = (input: RigInput): Promise<RigOutput> => {
  if (typeof Worker === "undefined") return Promise.resolve(computeRig(input));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./rig.worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<RigOutput>) => {
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    worker.postMessage(input);
  });
};

/**
 * Rigs a static, standing humanoid in the browser.
 *
 * Builds a skeleton from landmark positions, gives every vertex weights for its
 * nearest bones (distance to each bone's segment, scaled by the thickness of the
 * part it carries, so a slim arm does not claim the side of a broad chest), and
 * returns skinned meshes. A T- or A-pose is first baked into a relaxed stance, so
 * the rest pose always has the arms at the sides and procedural poses read correctly.
 *
 * `model` must already be fitted (scaled, stood on the floor at the origin, facing +z).
 */
export const autoRig = async (model: THREE.Object3D, height: number, lm: Landmarks) => {
  model.updateMatrixWorld(true);
  const toBody = new THREE.Matrix4().copy(model.parent?.matrixWorld ?? new THREE.Matrix4()).invert();

  // Every mesh in body space, with plain float positions and normals (meshopt quantises them).
  const sources: { mesh: THREE.Mesh; geometry: THREE.BufferGeometry }[] = [];
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.geometry;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(toFloat(src.attributes.position), 3));
    if (src.attributes.normal) g.setAttribute("normal", new THREE.BufferAttribute(toFloat(src.attributes.normal), 3));
    if (src.index) g.setIndex(src.index);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toBody, mesh.matrixWorld));
    if (!g.attributes.normal) g.computeVertexNormals();
    sources.push({ mesh, geometry: g });
  });

  const result = await solve({
    parts: sources.map(({ geometry }) => ({
      position: (geometry.attributes.position as THREE.BufferAttribute).array as Float32Array,
      normal: (geometry.attributes.normal as THREE.BufferAttribute).array as Float32Array,
    })),
    height,
    landmarks: lm,
  });

  // Skeleton in the relaxed rest pose.
  const bones: Partial<Record<JointName, THREE.Bone>> = {};
  HIERARCHY.forEach(([n, parent]) => {
    const b = new THREE.Bone();
    b.name = n;
    const p = new THREE.Vector3(...result.joints[n]!);
    if (parent) {
      b.position.copy(p).sub(new THREE.Vector3(...result.joints[parent]!));
      bones[parent]!.add(b);
    } else b.position.copy(p);
    bones[n] = b;
  });
  const skeleton = new THREE.Skeleton(HIERARCHY.map(([n]) => bones[n]!));

  const meshes = sources.map(({ mesh }, k) => {
    const part = result.parts[k];
    const src = mesh.geometry;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(part.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(part.normal, 3));
    if (src.attributes.uv) g.setAttribute("uv", src.attributes.uv);
    if (src.attributes.color) g.setAttribute("color", src.attributes.color);
    if (src.index) g.setIndex(src.index);
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(part.skinIndex, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(part.skinWeight, 4));
    g.computeBoundingSphere();
    const m = new THREE.SkinnedMesh(g, mesh.material);
    m.castShadow = true;
    m.frustumCulled = false;
    return m;
  });
  sources.forEach(({ geometry }) => geometry.dispose());

  // The bones ride under the first mesh; every part shares the one skeleton.
  meshes[0].add(bones.hips!);
  meshes[0].updateMatrixWorld(true);
  meshes.forEach((m) => m.bind(skeleton));

  const root = new THREE.Group();
  meshes.forEach((m) => root.add(m));
  return { root, bones, skeleton, meshes };
};
