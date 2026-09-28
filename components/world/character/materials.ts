import * as THREE from "three";

/**
 * Material palette for the engineer: velvet fur that catches the warm rim light,
 * a warm tan face, and a premium dark tech outfit (technical jacket, hoodie, cargo
 * trousers, sneakers) with brushed-bronze hardware and headphones.
 */
export const createCharacterMaterials = () => {
  const fur = new THREE.MeshPhysicalMaterial({
    color: "#3b2a1f",
    roughness: 0.9,
    sheen: 1,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color("#c28f5c"),
  });
  const skin = new THREE.MeshPhysicalMaterial({ color: "#c99d78", roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.5 });
  const skinDeep = new THREE.MeshStandardMaterial({ color: "#a7775a", roughness: 0.6 });
  const jacket = new THREE.MeshPhysicalMaterial({
    color: "#231f1b",
    roughness: 0.46,
    clearcoat: 0.45,
    clearcoatRoughness: 0.5,
    sheen: 0.5,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#7a654e"),
  });
  const hoodie = new THREE.MeshPhysicalMaterial({ color: "#151413", roughness: 0.92, sheen: 0.6, sheenColor: new THREE.Color("#4a4540") });
  const cargo = new THREE.MeshPhysicalMaterial({ color: "#1c1b1a", roughness: 0.82, sheen: 0.3, sheenColor: new THREE.Color("#4d4841") });
  const sneaker = new THREE.MeshPhysicalMaterial({ color: "#111111", roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const sole = new THREE.MeshStandardMaterial({ color: "#ebe6dd", roughness: 0.6 });
  const bronze = new THREE.MeshStandardMaterial({ color: "#bb874c", metalness: 1, roughness: 0.28 });
  const pad = new THREE.MeshStandardMaterial({ color: "#161615", roughness: 0.65 });
  const patch = new THREE.MeshStandardMaterial({ color: "#8e6c43", roughness: 0.7 });
  const pack = new THREE.MeshPhysicalMaterial({ color: "#1d1a17", roughness: 0.7, sheen: 0.3, sheenColor: new THREE.Color("#5a4c3e") });
  const eyeWhite = new THREE.MeshPhysicalMaterial({ color: "#efe9df", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
  const iris = new THREE.MeshPhysicalMaterial({ color: "#6b4424", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  const pupil = new THREE.MeshPhysicalMaterial({ color: "#050505", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 });
  const glint = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  const frame = new THREE.MeshStandardMaterial({ color: "#141210", metalness: 0.7, roughness: 0.3 });
  const mouth = new THREE.MeshStandardMaterial({ color: "#5e3a2a", roughness: 0.7 });

  const all = { fur, skin, skinDeep, jacket, hoodie, cargo, sneaker, sole, bronze, pad, patch, pack, eyeWhite, iris, pupil, glint, frame, mouth };
  return { ...all, dispose: () => Object.values(all).forEach((m) => m.dispose()) };
};

export type CharacterMaterials = ReturnType<typeof createCharacterMaterials>;
