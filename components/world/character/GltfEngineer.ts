import * as THREE from "three";

import { PoseMixer } from "./animation";
import { autoRig } from "./autoRig";
import type { GltfCharacterConfig } from "./config";
import type { CharacterAction, CharacterDriver, CharacterFrame, JointName } from "./rig";

const ACTIONS: CharacterAction[] = ["idle", "confident", "carry", "inspect", "present", "type", "lookUp", "wave", "think"];

/** Whole-body pose offsets for a model without a skeleton: [lean fwd, turn, tilt]. */
const STATIC_POSES: Record<CharacterAction, [number, number, number]> = {
  idle: [0, 0, 0],
  confident: [-0.02, 0, 0],
  carry: [-0.015, -0.05, 0],
  inspect: [0.04, 0.12, 0],
  present: [0, -0.18, 0.01],
  type: [0.05, 0, 0],
  lookUp: [-0.06, 0, 0],
  wave: [-0.02, -0.08, 0.03],
  think: [0.03, 0.1, 0.02],
};

/**
 * A weighty, unhurried look-around, like a motion-captured idle: every few seconds
 * the head picks somewhere new to look and gets there on a slightly underdamped
 * spring (a little overshoot, then settles), with the neck and chest following through.
 */
class LookAround {
  private target = new THREE.Vector3();
  private pos = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private next = 0.8;

  update(time: number, delta: number) {
    if (time > this.next) {
      const wide = Math.random() < 0.35;
      this.target.set(
        (Math.random() - 0.4) * (wide ? 0.32 : 0.14),
        (Math.random() - 0.5) * (wide ? 1.0 : 0.45),
        (Math.random() - 0.5) * 0.16
      );
      this.next = time + 2.4 + Math.random() * 3.6;
    }
    // Spring: ω ≈ 5 rad/s, ζ ≈ 0.75.
    const w = 5;
    const z = 0.75;
    const ax = new THREE.Vector3().subVectors(this.target, this.pos).multiplyScalar(w * w).addScaledVector(this.vel, -2 * z * w);
    this.vel.addScaledVector(ax, delta);
    this.pos.addScaledVector(this.vel, delta);
    return this.pos;
  }
}

/**
 * Drives a GLB with the same CharacterFrame the procedural stand-in uses.
 *
 * Rigged model: cross-fades clips per action and applies the look-at to the head bone.
 * Model with landmarks: rigged on load, then posed procedurally (breathing, weight
 * shift, look-around, gestures per scroll step, gaze toward the visitor).
 * Anything else: animates the whole body (breathing, sway, gesture leans).
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
  const height = config.height ?? 1.85;
  model.rotation.y = config.yaw ?? 0;
  // Fit: scale to the target height, stand on the floor, centre on the mark. Skinned
  // meshes are measured as posed by their skeleton (Mixamo exports carry the scale on the bones).
  const skinned = gltf.animations.length > 0;
  if (skinned) {
    // Measure in the idle pose, not the bind pose: Mixamo clips move the hips well away from
    // where the rest pose has them, and the character should stand on the floor as animated.
    const probe = new THREE.AnimationMixer(model);
    const idle = gltf.animations.find((a) => a.name === config.clips?.idle) ?? gltf.animations[0];
    probe.clipAction(idle).play();
    // Left posed (stopping it would snap the bones back to the rest pose); never updated again.
    probe.update(0);
  }
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, skinned);
  const size = box.getSize(new THREE.Vector3());
  const k = height / Math.max(size.y, 1e-6);
  model.scale.multiplyScalar(k);
  model.updateMatrixWorld(true);
  // Scaling about the model's origin scales its box the same way, so the (per-vertex,
  // for a skinned model) measurement isn't repeated.
  box.min.sub(model.position).multiplyScalar(k).add(model.position);
  box.max.sub(model.position).multiplyScalar(k).add(model.position);
  const centre = box.getCenter(new THREE.Vector3());
  model.position.set(model.position.x - centre.x, model.position.y - box.min.y, model.position.z - centre.z);
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if ("envMapIntensity" in m) m.envMapIntensity = 0.9;
      // Full anisotropic filtering (clamped to the GPU's maximum), so faces and fabric stay sharp at an angle.
      Object.values(m).forEach((v) => {
        if (v instanceof THREE.Texture) {
          v.anisotropy = 16;
          v.needsUpdate = true;
        }
      });
    });
  });
  body.add(model);
  root.add(body);

  const rigged = Boolean(config.clips && gltf.animations.length);

  if (!rigged && config.landmarks) {
    const rig = await autoRig(model, height, config.landmarks);
    body.remove(model);
    body.add(rig.root);
    // The source meshes' geometry was copied; free the originals (materials are reused).
    model.traverse((o) => (o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.dispose());

    const mixer = new PoseMixer();
    const look = new LookAround();
    const bones = rig.bones;
    const names = Object.keys(bones) as JointName[];
    const hipsY = bones.hips!.position.y;
    return {
      root,
      update(frame: CharacterFrame) {
        const pose = mixer.compute(frame);
        const la = look.update(frame.time, frame.delta);
        // Follow-through: chest a little, neck more, head most.
        const add = (j: JointName, s: number) => {
          const p = pose[j] ?? [0, 0, 0];
          pose[j] = [p[0] + la.x * s, p[1] + la.y * s, p[2] + la.z * s];
        };
        // Calmer looking-around while walking: eyes on the path.
        const roam = 1 - frame.walk * 0.7;
        add("spine", 0.15 * roam);
        add("neck", 0.35 * roam);
        add("head", 0.55 * roam);
        const k = Math.min(frame.delta * 12, 1);
        names.forEach((name) => {
          const target = pose[name];
          const b = bones[name]!;
          b.rotation.x += ((target?.[0] ?? 0) - b.rotation.x) * k;
          b.rotation.y += ((target?.[1] ?? 0) - b.rotation.y) * k;
          b.rotation.z += ((target?.[2] ?? 0) - b.rotation.z) * k;
        });
        const breath = Math.sin(frame.time * 1.35);
        // Walking: the hips dip as each foot plants, twice per stride.
        const bob = -0.018 * height * (1 - Math.abs(Math.cos(frame.phase))) * frame.walk;
        bones.hips!.position.y = hipsY + bob + breath * 0.003 * height * (1 - frame.walk) - frame.pulse * 0.004;
        // Breathing lifts the chest; the musical pulse adds a tiny nod.
        body.scale.set(1, 1 + breath * 0.002, 1);
      },
      dispose: () => disposeModel(rig.root),
    };
  }

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
        const st = Math.sin(frame.phase);
        // Walking: vertical bob twice per cycle, side-to-side roll, slight forward lean.
        body.position.y = Math.abs(st) * 0.028 * w + breath * 0.002 * (1 - w);
        body.position.x = sway * 0.006 * (1 - w) + st * 0.01 * w;
        body.rotation.x = pose.x + 0.03 * w - frame.lookPitch * 0.06 + breath * 0.004;
        body.rotation.y = pose.y + Math.sin(t * 0.21) * 0.03 * (1 - w) + st * 0.04 * w;
        body.rotation.z = pose.z + sway * 0.012 * (1 - w) + st * 0.028 * w;
        // Breathing and the musical pulse, as a tiny chest-height scale.
        const sy = 1 + breath * 0.005 + frame.pulse * 0.006;
        body.scale.set(2 - sy, sy, 2 - sy);
      },
      dispose: () => disposeModel(model),
    };
  }

  const mixer = new THREE.AnimationMixer(model);
  const clips = config.clips!;
  const clip = (name?: string) => (name ? gltf.animations.find((a) => a.name === name) : undefined);
  const idleClip = clip(clips.idle)!;
  const actions = new Map<CharacterAction, THREE.AnimationAction>();
  ACTIONS.forEach((a) => {
    actions.set(a, mixer.clipAction(clip(clips[a]) ?? idleClip));
  });
  actions.forEach((a) => a.play());
  const walkClip = clip(clips.walk);
  const walk = walkClip ? mixer.clipAction(walkClip) : null;
  walk?.play();
  let lastPhase = 0;

  const head = config.headBone ? model.getObjectByName(config.headBone) : undefined;
  const weights = new Map<CharacterAction, number>();

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
      const standing = walk ? 1 - frame.walk : 1;
      total.forEach((w, action) => action.setEffectiveWeight(Math.min(w, 1) * standing));
      if (walk) {
        // Advance the walk clip by the distance actually travelled, so feet don't slide.
        const d = walk.getClip().duration;
        walk.setEffectiveWeight(frame.walk);
        walk.timeScale = 0;
        walk.time = (walk.time + ((frame.phase - lastPhase) / (Math.PI * 2)) * d + d) % d;
        lastPhase = frame.phase;
      }
      mixer.update(frame.delta);
      // Gaze on top of the motion capture: toward the visitor and their cursor, calmer mid-stride.
      if (head) {
        const g = 0.5 * (1 - frame.walk * 0.6);
        head.rotation.y += frame.lookYaw * g;
        head.rotation.x += frame.lookPitch * g;
      }
    },
    dispose() {
      mixer.stopAllAction();
      disposeModel(model);
    },
  };
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
