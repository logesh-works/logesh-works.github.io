import * as THREE from "three";

/**
 * Materials for the suited engineer (reference: the three-world character sheet).
 * Warm brown fur that catches rim light, a peach face and hands, pink-peach ears,
 * a black three-piece suit, white shirt, polished shoes. Outfit colours are
 * retinted per world by the driver.
 */
export const createCharacterMaterials = () => {
  const fur = new THREE.MeshPhysicalMaterial({
    color: "#4a2d1e",
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color("#b67a4c"),
  });
  const furDark = new THREE.MeshPhysicalMaterial({ color: "#2e1b12", roughness: 0.8, sheen: 0.8, sheenColor: new THREE.Color("#8a5a38") });
  const skin = new THREE.MeshPhysicalMaterial({ color: "#dfa987", roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color("#ffd6bd") });
  const skinDeep = new THREE.MeshStandardMaterial({ color: "#b77c5c", roughness: 0.55 });
  const ear = new THREE.MeshPhysicalMaterial({ color: "#e9a58f", roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color("#ffc9b8"), transmission: 0 });
  const earInner = new THREE.MeshStandardMaterial({ color: "#d9837a", roughness: 0.55 });
  const suit = new THREE.MeshPhysicalMaterial({ color: "#1a1715", roughness: 0.62, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color("#5b5046") });
  const vest = new THREE.MeshPhysicalMaterial({ color: "#16130f", roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color("#4e443a") });
  const lapel = new THREE.MeshPhysicalMaterial({ color: "#121010", roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const shirt = new THREE.MeshStandardMaterial({ color: "#efe9df", roughness: 0.6 });
  const tie = new THREE.MeshPhysicalMaterial({ color: "#0e0d0c", roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const square = new THREE.MeshStandardMaterial({ color: "#f3eee6", roughness: 0.6 });
  const shoe = new THREE.MeshPhysicalMaterial({ color: "#0b0a09", roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
  const sole = new THREE.MeshStandardMaterial({ color: "#1a1512", roughness: 0.7 });
  const metal = new THREE.MeshStandardMaterial({ color: "#c9a46a", metalness: 1, roughness: 0.3 });
  const eyeWhite = new THREE.MeshPhysicalMaterial({ color: "#f3eee6", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 });
  const iris = new THREE.MeshPhysicalMaterial({ color: "#5a3317", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
  const pupil = new THREE.MeshPhysicalMaterial({ color: "#050403", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 });
  const glint = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  const mouth = new THREE.MeshStandardMaterial({ color: "#7a4432", roughness: 0.7 });
  const laptop = new THREE.MeshStandardMaterial({ color: "#b9b6b2", metalness: 0.9, roughness: 0.28 });

  const all = { fur, furDark, skin, skinDeep, ear, earInner, suit, vest, lapel, shirt, tie, square, shoe, sole, metal, eyeWhite, iris, pupil, glint, mouth, laptop };
  return { ...all, dispose: () => Object.values(all).forEach((m) => m.dispose()) };
};

export type CharacterMaterials = ReturnType<typeof createCharacterMaterials>;
