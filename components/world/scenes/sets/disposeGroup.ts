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

