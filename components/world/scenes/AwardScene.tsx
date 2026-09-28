"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { award } from "@/constants";
import { beatWeight, world } from "@/lib/world";

import { makeLabel } from "../labels";
import { AWARD } from "../stations";

/**
 * Research recognition as a quiet object: a gold ring turning slowly above the
 * floor, carrying the award name. It glows only while its chapter is on screen.
 */
const AwardScene = () => {
  const ring = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const face = useMemo(
    () => makeLabel(award.title, { font: "display", weight: 300, size: 60, uppercase: true, color: "#ecc48f", sub: award.event }),
    []
  );
  useEffect(() => () => face.texture.dispose(), [face]);

  useFrame((state, delta) => {
    const focus = beatWeight("research");
    const r = ring.current;
    if (r && !world.reduced) {
      r.rotation.y += delta * (0.15 + focus * 0.1);
      r.position.y = AWARD.pos[1] + Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
    }
    if (light.current) light.current.intensity = 1 + focus * 9 + world.pulse * focus * 4;
  });

  const w = 1.25;
  return (
    <group>
      <group ref={ring} position={AWARD.pos}>
        <mesh>
          <torusGeometry args={[0.78, 0.035, 24, 96]} />
          <meshStandardMaterial color="#d9a55a" metalness={1} roughness={0.22} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.66, 0.012, 12, 96]} />
          <meshStandardMaterial color="#d9a55a" metalness={1} roughness={0.3} />
        </mesh>
        {[1, -1].map((side) => (
          <mesh key={side} rotation={[0, side === 1 ? 0 : Math.PI, 0]} position={[0, 0, 0.001 * side]}>
            <planeGeometry args={[w, w / face.aspect]} />
            <meshBasicMaterial map={face.texture} transparent depthWrite={false} toneMapped={false} side={THREE.FrontSide} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[AWARD.pos[0], AWARD.pos[1] - 0.6, AWARD.pos[2] + 0.8]} distance={6} decay={2} color="#dea45a" />
      <mesh position={[AWARD.pos[0], 0.02, AWARD.pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 0.93, 64]} />
        <meshBasicMaterial color="#dea45a" transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
};

export default AwardScene;
