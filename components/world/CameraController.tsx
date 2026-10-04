"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useWorld } from "@/lib/useWorld";
import { world } from "@/lib/world";

import { shotFor } from "./cameraPath";
import { characterState } from "./characterState";

const smooth = (t: number) => t * t * (3 - 2 * t);
/** Film offset that pushes the character away from the side the copy sits on. */
const FILM_SHIFT = 5.5;

/**
 * Scroll-driven camera: positions follow a Catmull-Rom spline through every
 * step's shot, so the move between steps is a continuous glide rather than a cut.
 * Everything is damped, with a little pointer parallax on top.
 */
const CameraController = () => {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const look = useRef(new THREE.Vector3(0, 1.6, 0));
  const init = useRef(false);
  const portrait = size.width / size.height < 0.9;
  useWorld("beats");
  const key = world.beatIds.join(",");

  // Rebuilt when the step list or orientation changes.
  const path = useMemo(() => {
    const ids = key ? key.split(",") : ["top"];
    const pts = ids.map((id) => {
      const s = shotFor(id);
      const p = new THREE.Vector3(...s.cam);
      if (portrait && s.text !== "center") {
        // Pull back so the whole character fits above the copy at the bottom.
        const t = new THREE.Vector3(...s.target);
        p.sub(t).multiplyScalar(1.45).add(t);
      }
      return p;
    });
    if (pts.length === 1) pts.push(pts[0].clone());
    return { ids, curve: new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5) };
  }, [key, portrait]);

  // Pointer parallax (fine pointers only).
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), right: new THREE.Vector3() }), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 20);
    const n = path.ids.length;
    const beat = THREE.MathUtils.clamp(world.beat, 0, Math.max(n - 1, 0));
    const i0 = Math.floor(beat);
    const i1 = Math.min(i0 + 1, n - 1);
    const f = world.reduced ? Math.round(beat - i0) : smooth(beat - i0);
    const u = n > 1 ? (i0 + f) / (n - 1) : 0;

    path.curve.getPoint(u, tmp.pos);
    const s0 = shotFor(path.ids[i0]);
    const s1 = shotFor(path.ids[i1]);
    tmp.a.set(...s0.target).lerp(tmp.b.set(...s1.target), f);
    // Portrait: copy sits at the bottom, so frame the character higher (not for centred shots).
    if (portrait) tmp.a.y -= 0.55 * ((s0.text === "center" ? 0 : 1) * (1 - f) + (s1.text === "center" ? 0 : 1) * f);

    // Shots are framed on the character: turned to the way they're walking, and moved with them.
    const h = characterState.heading;
    const c = Math.cos(h);
    const sn = Math.sin(h);
    const turn = (v: THREE.Vector3) => v.set(v.x * c + v.z * sn + characterState.x, v.y, -v.x * sn + v.z * c + characterState.z);
    turn(tmp.pos);
    turn(tmp.a);

    if (!world.reduced) {
      tmp.right.setFromMatrixColumn(cam.matrixWorld, 0);
      tmp.pos.addScaledVector(tmp.right, world.pointer.x * 0.12);
      tmp.pos.y -= world.pointer.y * 0.06;
    }

    const k = world.reduced || !init.current ? 1 : 1 - Math.exp(-delta * 5);
    init.current = true;
    cam.position.lerp(tmp.pos, k);
    look.current.lerp(tmp.a, world.reduced ? 1 : 1 - Math.exp(-delta * 5.5));
    cam.lookAt(look.current);

    const side = (f < 0.5 ? s0 : s1).text;
    const film = portrait ? 0 : side === "left" ? -FILM_SHIFT : side === "right" ? FILM_SHIFT : 0;
    const next = cam.filmOffset + (film - cam.filmOffset) * (world.reduced ? 1 : 1 - Math.exp(-delta * 3.5));
    if (Math.abs(next - cam.filmOffset) > 0.001) {
      cam.filmOffset = next;
      cam.updateProjectionMatrix();
    }
  });

  return null;
};

export default CameraController;
