"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { disposeGroup, ring } from "./disposeGroup";
import { marbleTexture, shaftTexture } from "./textures";

/**
 * World 01, Gold Lobby: a ring of polished black-marble pillars split by tall
 * gold light slits, warm shafts falling from above, and gold step edges around
 * the stage.
 */
const LobbySet = () => {
  const set = useMemo(() => {
    const g = new THREE.Group();
    const marble = marbleTexture();
    const pillarMat = new THREE.MeshStandardMaterial({ map: marble, color: "#ffffff", roughness: 0.18, metalness: 0.3, envMapIntensity: 0.9 });
    const goldMat = new THREE.MeshBasicMaterial({ color: "#ffb45a", toneMapped: false });
    const goldSoft = new THREE.MeshBasicMaterial({ color: "#c88a3e", toneMapped: false });

    const pillarGeo = new THREE.BoxGeometry(1.5, 10, 1.1);
    const slitGeo = new THREE.BoxGeometry(0.07, 9, 0.07);
    ring(14, 9.5).forEach(({ x, z, angle }, i) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, 5, z);
      p.rotation.y = -angle;
      g.add(p);
      if (i % 2 === 0) {
        // Gold slit in the gap to the next pillar.
        const a2 = angle + Math.PI / 14;
        const s = new THREE.Mesh(slitGeo, goldMat);
        s.position.set(Math.sin(a2) * 9.6, 4.5, -Math.cos(a2) * 9.6);
        g.add(s);
      }
    });

    // Gold step edges: two concentric rings on the floor.
    [3.6, 4.4].forEach((r, k) => {
      const edge = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 160, Math.PI * 1.35), k ? goldSoft : goldMat);
      edge.rotation.set(Math.PI / 2, 0, Math.PI * 0.82);
      edge.position.y = 0.01 + k * 0.004;
      g.add(edge);
    });
    const step = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 4.4, 96, 1, Math.PI * 0.82, Math.PI * 1.35),
      new THREE.MeshStandardMaterial({ color: "#0f0c09", roughness: 0.25, metalness: 0.5 })
    );
    step.rotation.x = -Math.PI / 2;
    step.position.y = 0.006;
    g.add(step);

    // Warm light shafts from the ceiling.
    const shaft = shaftTexture();
    const shaftMat = new THREE.MeshBasicMaterial({
      map: shaft,
      color: "#ffcb87",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    const shafts: THREE.Mesh[] = [];
    [
      [-3.5, -6, 0.35],
      [2.5, -7.5, -0.25],
      [-6.5, -2.5, 0.8],
      [6, -3.5, -0.7],
    ].forEach(([x, z, rot]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 12), shaftMat);
      m.position.set(x, 6, z);
      m.rotation.set(0, rot, 0.22);
      shafts.push(m);
      g.add(m);
    });
    return { g, shaftMat, shafts };
  }, []);

  useEffect(() => () => disposeGroup(set.g), [set]);

  useFrame((state) => {
    if (world.reduced) return;
    const t = state.clock.elapsedTime;
    set.shaftMat.opacity = 0.13 + Math.sin(t * 0.4) * 0.03 + world.audioLevel * 0.08;
  });

  return <primitive object={set.g} />;
};

export default LobbySet;
