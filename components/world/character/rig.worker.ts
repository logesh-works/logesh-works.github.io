import { computeRig, type RigInput } from "./rigMath";

/** Runs the auto-rig maths off the main thread and hands the arrays back without copying. */
self.onmessage = (e: MessageEvent<RigInput>) => {
  const out = computeRig(e.data);
  const transfer: ArrayBuffer[] = [];
  out.parts.forEach((p) => transfer.push(p.position.buffer as ArrayBuffer, p.normal.buffer as ArrayBuffer, p.skinIndex.buffer as ArrayBuffer, p.skinWeight.buffer as ArrayBuffer));
  // Arrays passed through unchanged would be listed twice; keep each buffer once.
  (self as unknown as Worker).postMessage(out, Array.from(new Set(transfer)));
};
