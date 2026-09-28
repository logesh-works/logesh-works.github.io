import * as THREE from "three";

import type { GltfCharacterConfig } from "./config";
import type { CharacterAction, CharacterDriver, CharacterFrame } from "./rig";

/**
 * Drives a rigged GLB with the same CharacterFrame the procedural stand-in uses:
 * cross-fades clips per action, scales walk playback with locomotion, and applies
 * the look-at to the head bone after the mixer runs.
 */
export const loadGltfEngineer = async (config: GltfCharacterConfig): Promise<CharacterDriver> => {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const gltf = await new GLTFLoader().loadAsync(config.url);

  const root = new THREE.Group();
  const model = gltf.scene;
  model.scale.setScalar(config.scale);
  model.rotation.y = config.yaw ?? 0;
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  root.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const clip = (name?: string) => (name ? gltf.animations.find((a) => a.name === name) : undefined);
  const walk = mixer.clipAction(clip(config.clips.walk)!);
  const idleClip = clip(config.clips.idle)!;
  const actions = new Map<CharacterAction, THREE.AnimationAction>();
  (["idle", "confident", "inspect", "present", "type", "lookUp"] as CharacterAction[]).forEach((a) => {
    actions.set(a, mixer.clipAction(clip(config.clips[a]) ?? idleClip));
  });
  walk.play();
  actions.forEach((a) => a.play());

  const head = config.headBone ? model.getObjectByName(config.headBone) : undefined;
  const weights = new Map<CharacterAction, number>();
  let lastPhase = 0;

  return {
    root,
    update(frame: CharacterFrame) {
      const rate = Math.min(frame.delta * 2.6, 1);
      // Several actions may share a clip (unmapped ones fall back to idle), so sum per clip action.
      const total = new Map<THREE.AnimationAction, number>();
      actions.forEach((action, name) => {
        const prev = weights.get(name) ?? 0;
        const w = prev + ((name === frame.action ? 1 : 0) - prev) * rate;
        weights.set(name, w);
        total.set(action, (total.get(action) ?? 0) + w);
      });
      total.forEach((w, action) => action.setEffectiveWeight(Math.min(w, 1) * (1 - frame.walk)));
      walk.setEffectiveWeight(frame.walk);
      // Advance the walk clip by the distance actually travelled.
      const dPhase = frame.phase - lastPhase;
      lastPhase = frame.phase;
      walk.time = (walk.time + (dPhase / (Math.PI * 2)) * walk.getClip().duration) % walk.getClip().duration;
      walk.timeScale = 0;
      mixer.update(frame.delta);
      if (head) {
        head.rotation.y += frame.lookYaw * 0.8;
        head.rotation.x += frame.lookPitch * 0.8;
      }
    },
    dispose() {
      mixer.stopAllAction();
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => mat.dispose());
      });
    },
  };
};
