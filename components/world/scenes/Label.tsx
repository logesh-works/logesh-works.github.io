"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { makeLabel, type LabelOptions } from "../labels";

interface LabelProps extends LabelOptions {
  text: string;
  position: [number, number, number];
  /** World height of the label plane in metres. */
  height?: number;
  billboard?: boolean;
  rotationY?: number;
  opacity?: number;
}

/** Text drawn on a plane. Billboards turn to face the camera around the vertical axis. */
const Label = ({ text, position, height = 0.14, billboard = true, rotationY = 0, opacity = 1, ...opts }: LabelProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const key = JSON.stringify(opts);
  const { texture, aspect } = useMemo(() => makeLabel(text, opts), [text, key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => texture.dispose(), [texture]);

  // Face the camera, and fade with distance so far-off signage never competes with the copy.
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const p = ref.current.getWorldPosition(tmp);
    if (billboard) ref.current.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    if (mat.current) mat.current.opacity = opacity * (1 - THREE.MathUtils.smoothstep(camera.position.distanceTo(p), 7, 12));
  });

  return (
    <mesh ref={ref} position={position} rotation={[0, rotationY, 0]} renderOrder={2}>
      <planeGeometry args={[height * aspect, height]} />
      <meshBasicMaterial ref={mat} map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export default Label;
