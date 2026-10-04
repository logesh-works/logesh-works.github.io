import type { CharacterAction, CharacterFrame, JointName, Pose } from "./rig";

/**
 * Procedural animation for a humanoid rig: walk cycle, idle breathing and a small
 * set of purposeful poses. Model-agnostic: it only produces joint rotations.
 *
 * Conventions (character faces +z): negative x on a thigh/shoulder swings the limb
 * forward, positive x on a knee bends it, negative x on an elbow bends it.
 */

type J = [number, number, number];
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/** A natural, unhurried walk: counter-rotating hips and shoulders, rolling knees and ankles. */
const walkPose = (phase: number): Pose => {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const kneeL = 0.06 + 0.78 * Math.pow(clamp01(c), 1.4) + 0.1 * clamp01(-s);
  const kneeR = 0.06 + 0.78 * Math.pow(clamp01(-c), 1.4) + 0.1 * clamp01(s);
  const thighL = -0.44 * s;
  const thighR = 0.44 * s;
  return {
    hips: [0.04, 0.11 * s, 0.035 * c],
    spine: [0.05, -0.17 * s, -0.02 * c],
    neck: [0, 0.05 * s, 0],
    head: [0.02 * Math.cos(phase * 2), 0.04 * s, 0.015 * c],
    thighL: [thighL, 0, 0.02],
    kneeL: [kneeL, 0, 0],
    ankleL: [-(thighL + kneeL) * 0.85 + 0.05, 0, 0],
    thighR: [thighR, 0, -0.02],
    kneeR: [kneeR, 0, 0],
    ankleR: [-(thighR + kneeR) * 0.85 + 0.05, 0, 0],
    shoulderL: [0.34 * s, 0, 0.09],
    elbowL: [-0.22 - 0.22 * clamp01(-s), 0, 0],
    wristL: [0.05, 0, 0],
    shoulderR: [-0.34 * s, 0, -0.09],
    elbowR: [-0.22 - 0.22 * clamp01(s), 0, 0],
    wristR: [0.05, 0, 0],
    tail: [0.12 * c, 0.25 * s, 0],
  };
};

/** Standing still: slow breathing, a gentle weight shift, relaxed arms. */
const idlePose = (t: number): Pose => {
  const breath = Math.sin(t * 1.35);
  const sway = Math.sin(t * 0.45);
  return {
    hips: [0, 0.03 * sway, 0.018 * sway],
    spine: [0.012 * breath, -0.02 * sway, -0.012 * sway],
    neck: [-0.006 * breath, 0, 0],
    // Unhurried looking-around, layered under whatever he is looking at.
    head: [0.03 * Math.sin(t * 0.37), 0.14 * Math.sin(t * 0.21) + 0.05 * Math.sin(t * 0.83), 0.01 * sway],
    thighL: [0.01, 0, 0.03 + 0.012 * sway],
    kneeL: [0.05 + 0.03 * Math.max(sway, 0), 0, 0],
    ankleL: [-0.05, 0, 0],
    thighR: [0.01, 0, -0.03 + 0.012 * sway],
    kneeR: [0.05 + 0.03 * Math.max(-sway, 0), 0, 0],
    ankleR: [-0.05, 0, 0],
    shoulderL: [0.02 + 0.01 * breath, 0, 0.1],
    elbowL: [-0.16, 0, 0],
    wristL: [0.05 * Math.sin(t * 0.9), 0.1 * Math.sin(t * 0.6), 0],
    shoulderR: [0.02 + 0.01 * breath, 0, -0.1],
    elbowR: [-0.16, 0, 0],
    wristR: [0.05 * Math.sin(t * 0.8 + 1), 0.1 * Math.sin(t * 0.55 + 2), 0],
    tail: [0.1 * Math.sin(t * 0.7), 0.3 * Math.sin(t * 0.5), 0],
  };
};

/** Poses layered over idle once he has arrived somewhere. Only listed joints are affected. */
const actionPose = (action: CharacterAction, t: number, pulse: number): Pose => {
  switch (action) {
    case "confident": // hands in pockets, settled stance
      return {
        spine: [-0.02, 0, 0],
        shoulderL: [0.16, 0, 0.14],
        elbowL: [-0.5, 0, 0],
        wristL: [0.25, 0, 0],
        shoulderR: [0.16, 0, -0.14],
        elbowR: [-0.5, 0, 0],
        wristR: [0.25, 0, 0],
        head: [0.02 - 0.03 * pulse, 0, 0],
      };
    case "carry": // left hand in pocket, laptop held at the right side
      return {
        spine: [-0.02, 0.04, 0],
        shoulderL: [0.16, 0, 0.14],
        elbowL: [-0.5, 0, 0],
        wristL: [0.25, 0, 0],
        shoulderR: [0.04, 0, -0.16],
        elbowR: [-0.14, 0, 0],
        wristR: [0.05, 0.25, 0],
        head: [0.02 - 0.03 * pulse, 0, 0],
      };
    case "inspect": // right hand reaching toward the system in front of him
      return {
        spine: [-0.05, 0.08, 0],
        shoulderR: [-1.18 - 0.04 * Math.sin(t * 0.9), 0.1, -0.12],
        elbowR: [-0.42, 0, 0],
        wristR: [-0.18 + 0.1 * pulse, 0, 0],
        shoulderL: [0.1, 0, 0.12],
        elbowL: [-0.35, 0, 0],
        head: [-0.12, 0, 0],
      };
    case "present": // left arm opens toward the work beside him
      return {
        spine: [0, -0.14, 0],
        shoulderL: [-0.42, 0, 0.72 + 0.03 * Math.sin(t * 0.8)],
        elbowL: [-0.32, 0, 0],
        wristL: [0.1, 0.4, 0],
        shoulderR: [0.1, 0, -0.12],
        elbowR: [-0.3, 0, 0],
      };
    case "type": // both hands on the keyboard, eyes on the terminal
      return {
        spine: [0.1, 0, 0],
        neck: [0.06, 0, 0],
        head: [0.16, 0, 0],
        shoulderL: [-0.62, 0, -0.14],
        elbowL: [-1.12, 0, 0],
        wristL: [0.28 + 0.07 * Math.sin(t * 17), 0, 0],
        shoulderR: [-0.62, 0, 0.14],
        elbowR: [-1.12, 0, 0],
        wristR: [0.28 + 0.07 * Math.sin(t * 15 + 1.7), 0, 0],
      };
    case "lookUp": // hands behind the back, head raised toward the award
      return {
        spine: [-0.07, 0, 0],
        neck: [-0.12, 0, 0],
        head: [-0.3, 0, 0],
        shoulderL: [0.38, 0, -0.1],
        elbowL: [-0.75, 0, 0],
        shoulderR: [0.38, 0, 0.1],
        elbowR: [-0.75, 0, 0],
      };
    case "wave": // right arm up, forearm waving hello, head tilted warmly
      return {
        spine: [-0.02, -0.06, 0.03],
        neck: [0, 0, 0.04],
        head: [-0.04, 0, 0.1],
        shoulderR: [-0.15, 0, -1.4],
        elbowR: [0, 0, -1.25 + 0.32 * Math.sin(t * 7.5)],
        wristR: [0, 0, 0.15 * Math.sin(t * 7.5 + 0.6)],
        shoulderL: [0.05, 0, 0.1],
        elbowL: [-0.2, 0, 0],
      };
    case "think": // right hand to the chin, left arm across the waist, gaze up and away
      return {
        spine: [0.04, 0.06, 0],
        neck: [-0.05, 0.08, 0],
        head: [-0.14, 0.18, 0.06],
        shoulderR: [-0.95, 0, 0.32],
        elbowR: [-2.05, 0, 0],
        wristR: [0.2 + 0.04 * Math.sin(t * 0.8), 0, 0],
        shoulderL: [-0.35, 0, -0.35],
        elbowL: [-1.35, 0, 0],
        wristL: [0.1, 0, 0],
      };
    default:
      return {};
  }
};

const ACTIONS: CharacterAction[] = ["idle", "confident", "carry", "inspect", "present", "type", "lookUp", "wave", "think"];

/**
 * Blends idle, walk and weighted actions into one pose. Keeps per-action weights
 * so switching action cross-fades instead of snapping.
 */
export class PoseMixer {
  private weights: Record<CharacterAction, number> = { idle: 1, confident: 0, carry: 0, inspect: 0, present: 0, type: 0, lookUp: 0, wave: 0, think: 0 };

  compute(frame: CharacterFrame): Pose {
    const rate = Math.min(frame.delta * 2.6, 1);
    for (const a of ACTIONS) this.weights[a] += ((a === frame.action ? 1 : 0) - this.weights[a]) * rate;

    const idle = idlePose(frame.time);
    const walk = walkPose(frame.phase);
    const out: Pose = {};
    const keys = new Set<JointName>([...(Object.keys(idle) as JointName[]), ...(Object.keys(walk) as JointName[])]);
    keys.forEach((k) => {
      const a = idle[k] ?? [0, 0, 0];
      const b = walk[k] ?? [0, 0, 0];
      out[k] = [a[0] + (b[0] - a[0]) * frame.walk, a[1] + (b[1] - a[1]) * frame.walk, a[2] + (b[2] - a[2]) * frame.walk];
    });

    const standing = 1 - frame.walk;
    for (const a of ACTIONS) {
      const w = this.weights[a] * standing;
      if (w < 0.001) continue;
      const pose = actionPose(a, frame.time, frame.pulse);
      (Object.keys(pose) as JointName[]).forEach((k) => {
        const base = out[k] ?? [0, 0, 0];
        const target = pose[k] as J;
        out[k] = [base[0] + (target[0] - base[0]) * w, base[1] + (target[1] - base[1]) * w, base[2] + (target[2] - base[2]) * w];
      });
    }

    // Gaze: split between neck and head, calmer while walking.
    const gaze = 1 - frame.walk * 0.6;
    const neck = out.neck ?? [0, 0, 0];
    const head = out.head ?? [0, 0, 0];
    out.neck = [neck[0] + frame.lookPitch * 0.35 * gaze, neck[1] + frame.lookYaw * 0.4 * gaze, neck[2]];
    out.head = [head[0] + frame.lookPitch * 0.65 * gaze, head[1] + frame.lookYaw * 0.6 * gaze, head[2]];
    return out;
  }
}
