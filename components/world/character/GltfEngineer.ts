import * as THREE from "three";

import type { GltfCharacterConfig } from "./config";
import type { CharacterAction, CharacterDriver, CharacterFrame, Outfit } from "./rig";

const ACTIONS: CharacterAction[] = ["idle", "confident", "carry", "inspect", "present", "type", "lookUp"];

/** Whole-body pose offsets for a model without a skeleton: [lean fwd, turn, tilt]. */
const STATIC_POSES: Record<CharacterAction, [number, number, number]> = {
  idle: [0, 0, 0],
  confident: [-0.02, 0, 0],
  carry: [-0.015, -0.05, 0],
  inspect: [0.04, 0.12, 0],
  present: [0, -0.18, 0.01],
  type: [0.05, 0, 0],
  lookUp: [-0.06, 0, 0],
};

/**
 * Drives a GLB with the same CharacterFrame the procedural stand-in uses.
 *
 * Rigged model: cross-fades clips per action, advances the walk clip by distance
 * travelled, and applies the look-at to the head bone.
 * Static model: animates the whole body (breathing, weight shift, walking bob and
 * roll, gesture leans, a slight extra turn toward what he is looking at).
 */
export const loadGltfEngineer = async (config: GltfCharacterConfig): Promise<CharacterDriver> => {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(config.url);

  const root = new THREE.Group();
  // body: gets the whole-body motion; model: the imported scene, scaled and oriented.
  const body = new THREE.Group();
  const model = gltf.scene;
  model.rotation.y = config.yaw ?? 0;
  // Fit: scale to the target height, stand on the floor, centre on the mark.
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.scale.setScalar((config.height ?? 1.85) / Math.max(size.y, 1e-6));
  model.updateMatrixWorld(true);
  box.setFromObject(model);
  const centre = box.getCenter(new THREE.Vector3());
  model.position.set(-centre.x, -box.min.y, -centre.z);
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if ("envMapIntensity" in m) m.envMapIntensity = 0.9;
    });
  });
  body.add(model);
  root.add(body);

  const layout = setOutfitFor(model);
  const rigged = Boolean(config.clips && gltf.animations.length);

  if (!rigged) {
    const pose = new THREE.Vector3();
    const target = new THREE.Vector3();
    return {
      root,
      update(frame: CharacterFrame) {
        const t = frame.time;
        const w = frame.walk;
        const k = Math.min(frame.delta * 3, 1);
        const [lean, turn, tilt] = STATIC_POSES[frame.action];
        target.set(lean, turn + frame.lookYaw * 0.18, tilt);
        pose.lerp(target, k);

        const breath = Math.sin(t * 1.35);
        const sway = Math.sin(t * 0.45);
        const s = Math.sin(frame.phase);
        // Walking: vertical bob twice per cycle, side-to-side roll, slight forward lean.
        const bob = Math.abs(s) * 0.028 * w;
        body.position.y = bob + breath * 0.002 * (1 - w);
        body.position.x = sway * 0.006 * (1 - w) + s * 0.01 * w;
        body.rotation.x = pose.x + 0.03 * w - frame.lookPitch * 0.06 + breath * 0.004;
        body.rotation.y = pose.y + Math.sin(t * 0.21) * 0.03 * (1 - w) + s * 0.04 * w;
        body.rotation.z = pose.z + sway * 0.012 * (1 - w) + s * 0.028 * w;
        // Breathing and the musical pulse, as a tiny chest-height scale.
        const sy = 1 + breath * 0.005 * (1 - w) + frame.pulse * 0.006;
        body.scale.set(2 - sy, sy, 2 - sy);
      },
      setOutfit: layout,
      dispose: () => disposeModel(model),
    };
  }

  const mixer = new THREE.AnimationMixer(model);
  const clips = config.clips!;
  const clip = (name?: string) => (name ? gltf.animations.find((a) => a.name === name) : undefined);
  const walk = mixer.clipAction(clip(clips.walk)!);
  const idleClip = clip(clips.idle)!;
  const actions = new Map<CharacterAction, THREE.AnimationAction>();
  ACTIONS.forEach((a) => {
    actions.set(a, mixer.clipAction(clip(clips[a]) ?? idleClip));
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
    setOutfit: layout,
    dispose() {
      mixer.stopAllAction();
      disposeModel(model);
    },
  };
};

/**
 * Per-world outfit: materials named Suit / Vest / Shirt / Tie / PocketSquare / Shoe
 * are retinted, and an object named Laptop is shown only in worlds where he carries
 * it. A model with one baked material (as image-to-3D exports are) keeps its look.
 */
const setOutfitFor = (model: THREE.Object3D) => (o: Outfit) => {
  const colours: Record<string, string> = { Suit: o.suit, Vest: o.vest, Shirt: o.shirt, Tie: o.tie, PocketSquare: o.square, Shoe: o.shoe };
  model.traverse((obj) => {
    if (obj.name === "Laptop") obj.visible = o.laptop;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => {
      const c = colours[mat.name];
      if (c && "color" in mat) (mat as THREE.MeshStandardMaterial).color.set(c);
    });
  });
};

const disposeModel = (model: THREE.Object3D) => {
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => {
      Object.values(mat).forEach((v) => v instanceof THREE.Texture && v.dispose());
      mat.dispose();
    });
  });
};
