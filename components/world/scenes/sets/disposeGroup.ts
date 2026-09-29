import * as THREE from "three";

/** Frees every geometry, material and texture under a set's root group. */
export const disposeGroup = (root: THREE.Object3D) => {
  const textures = new Set<THREE.Texture>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
    mats.forEach((m) => {
      Object.values(m).forEach((v) => {
        if (v instanceof THREE.Texture) textures.add(v);
      });
      m.dispose();
    });
  });
  textures.forEach((t) => t.dispose());
};

/** Positions around the stage, skipping the front arc the camera travels through. */
export const ring = (count: number, radius: number, frontLimit = 2) => {
  const out: { x: number; z: number; angle: number }[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = Math.sin(a) * radius;
    const z = -Math.cos(a) * radius;
    if (z > frontLimit) continue;
    out.push({ x, z, angle: a });
  }
  return out;
};
