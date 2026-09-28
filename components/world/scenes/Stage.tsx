"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

const BG = new THREE.Color("#0f0f0f");

/**
 * A seamless photo-studio cove: the floor bends up into the backdrop with no
 * visible horizon. Built from a 2D profile swept along x.
 */
const coveGeometry = () => {
  const profile: [number, number][] = []; // (z, y)
  profile.push([14, 0], [4, 0], [-3, 0]);
  const r = 5;
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    profile.push([-3 - Math.sin(a) * r, r - Math.cos(a) * r]);
  }
  profile.push([-8, 16]);
  const width = 48;
  const xs = 24;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  profile.forEach(([z, y], j) => {
    for (let i = 0; i <= xs; i++) {
      pos.push(-width / 2 + (i / xs) * width, y, z);
      uv.push(i / xs, j / (profile.length - 1));
    }
  });
  const row = xs + 1;
  for (let j = 0; j < profile.length - 1; j++) {
    for (let i = 0; i < xs; i++) {
      const a = j * row + i;
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const glowTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Low-key studio: dark cove, soft key, warm bronze rim, floating dust. */
const Stage = ({ dust }: { dust: number }) => {
  const { scene } = useThree();
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const dustRef = useRef<THREE.Points>(null);

  const res = useMemo(() => {
    const cove = coveGeometry();
    const glow = glowTexture();
    const dustGeo = new THREE.BufferGeometry();
    const p = new Float32Array(dust * 3);
    for (let i = 0; i < dust; i++) {
      p[i * 3] = (Math.random() - 0.5) * 14;
      p[i * 3 + 1] = Math.random() * 5 + 0.1;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return { cove, glow, dustGeo };
  }, [dust]);

  useEffect(() => {
    scene.background = BG;
    return () => {
      res.cove.dispose();
      res.glow.dispose();
      res.dustGeo.dispose();
    };
  }, [res, scene]);

  // The key light aims at the character's chest.
  useEffect(() => {
    const k = key.current;
    if (!k) return;
    k.target.position.set(0, 1.1, 0);
    scene.add(k.target);
    return () => {
      scene.remove(k.target);
    };
  }, [scene]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    world.pulse = Math.max(0, world.pulse - delta * 1.8);
    const level = world.audioLevel;
    if (key.current) key.current.intensity = 55 + level * 18;
    if (rim.current) rim.current.intensity = 2.4 + level * 1.4 + world.pulse * 0.8;
    const d = dustRef.current;
    if (d && !world.reduced) {
      d.rotation.y = t * 0.01;
      d.position.y = Math.sin(t * 0.25) * 0.08;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#0f0f0f", 9, 24]} />
      <hemisphereLight args={["#6f675d", "#0d0b09", 0.28]} />
      <spotLight
        ref={key}
        position={[2.8, 5.2, 4.2]}
        angle={0.55}
        penumbra={0.9}
        decay={2}
        distance={20}
        intensity={55}
        color="#fff1e0"
      />
      {/* Warm bronze rim from behind: edges of fur and cloth catch the light. */}
      <directionalLight ref={rim} position={[-3, 4.5, -5]} intensity={2.4} color="#c9955a" />
      <directionalLight position={[4, 2, -3]} intensity={0.7} color="#9c7443" />
      <pointLight position={[0, 0.6, 2.5]} intensity={0.6} distance={6} color="#8a7a66" />

      <mesh geometry={res.cove} receiveShadow>
        <meshStandardMaterial color="#1b1a19" roughness={0.92} metalness={0.02} envMapIntensity={0.25} />
      </mesh>

      {/* A soft pool of light on the floor under the character. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[2.6, 48]} />
        <meshBasicMaterial map={res.glow} color="#6b5a45" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <points ref={dustRef} geometry={res.dustGeo}>
        <pointsMaterial
          map={res.glow}
          color="#d7b182"
          size={0.05}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

export default Stage;
