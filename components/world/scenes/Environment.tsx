"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { CHAPTER_BG as PALETTE } from "@/lib/palette";
import { world } from "@/lib/world";

import { planFor } from "../choreography";
import { makeGlowTexture } from "../labels";

const SIGNAL = new THREE.Color("#dea45a");

/** Floor, lighting, atmosphere and the path the engineer walks. */
const Environment = ({ dust }: { dust: number }) => {
  const { scene } = useThree();
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const glow = useRef<THREE.PointLight>(null);
  const dustRef = useRef<THREE.Points>(null);
  const packets = useRef<THREE.InstancedMesh>(null);
  const fogColor = useMemo(() => new THREE.Color(PALETTE.top), []);

  // Grid floor drawn once into a tiling texture.
  const grid = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#100e0c";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(222,164,90,0.10)";
    g.lineWidth = 2;
    g.strokeRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(239,233,225,0.035)";
    g.lineWidth = 1;
    for (let i = 64; i < 256; i += 64) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.moveTo(0, i);
      g.lineTo(256, i);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const glowTex = useMemo(() => makeGlowTexture(), []);

  // Dust motes spread through the whole campus.
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(dust * 3);
    for (let i = 0; i < dust; i++) {
      p[i * 3] = (Math.random() - 0.5) * 44;
      p[i * 3 + 1] = Math.random() * 9 + 0.2;
      p[i * 3 + 2] = 6 - Math.random() * 34;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [dust]);

  // The journey: a curve on the floor through every character mark, carrying events.
  const path = useMemo(() => {
    const pts = ["hero", "about-2", "stack", "exp-cyces", "exp-sync", "exp-events", "exp-more", "exp-before", "oss-intro", "research", "contact"]
      .map((id) => planFor(id)!.mark.pos)
      .map(([x, , z]) => new THREE.Vector3(x, 0.01, z));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(400));
    const mat = new THREE.LineBasicMaterial({ color: "#dea45a", transparent: true, opacity: 0.18 });
    return { curve, geo, mat, line: new THREE.Line(geo, mat) };
  }, []);
  const packetGeo = useMemo(() => new THREE.SphereGeometry(0.03, 8, 8), []);
  const packetMat = useMemo(() => new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false }), []);
  const PACKETS = 36;

  useEffect(
    () => () => {
      grid.dispose();
      glowTex.dispose();
      dustGeo.dispose();
      path.geo.dispose();
      path.mat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
    },
    [grid, glowTex, dustGeo, path, packetGeo, packetMat]
  );

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color() }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const level = world.audioLevel;
    world.pulse = Math.max(0, world.pulse - delta * 1.8);

    fogColor.lerp(tmp.c.set(PALETTE[world.chapter] ?? PALETTE.top), Math.min(delta * 1.5, 1));
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(fogColor);
    if (scene.background !== fogColor) scene.background = fogColor;

    if (key.current) key.current.intensity = 1.05 + level * 0.5;
    if (rim.current) rim.current.intensity = 3.2 + level * 1.8 + world.pulse * 0.7;
    if (glow.current) glow.current.intensity = 1.6 + world.pulse * 3 + level * 3;

    if (dustRef.current && !world.reduced) {
      dustRef.current.rotation.y = t * 0.004;
      dustRef.current.position.y = Math.sin(t * 0.2) * 0.15;
    }

    const inst = packets.current;
    if (inst) {
      const speed = world.reduced ? 0 : 0.012 + level * 0.02;
      for (let i = 0; i < PACKETS; i++) {
        const u = (i / PACKETS + t * speed) % 1;
        path.curve.getPointAt(u, tmp.v);
        tmp.v.y = 0.035;
        tmp.s.setScalar(0.7 + 0.6 * Math.sin(u * 80 + t));
        tmp.m.compose(tmp.v, tmp.q, tmp.s);
        inst.setMatrixAt(i, tmp.m);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <fog attach="fog" args={[PALETTE.top, 9, 30]} />
      <hemisphereLight args={["#6d6255", "#140e09", 0.2]} />
      <ambientLight intensity={0.06} />
      {/* Warm key from the front-left, strong warm rim from behind: gold edges on fur and cloth. */}
      <directionalLight ref={key} position={[4, 7, 6]} intensity={1.6} color="#ffe2bf" />
      <directionalLight ref={rim} position={[-3, 6, -7]} intensity={2.2} color="#f0c083" />
      <directionalLight position={[-6, 2, 4]} intensity={0.35} color="#8a7c69" />
      <pointLight ref={glow} position={[0, 4.2, -3.4]} intensity={1.6} distance={6} decay={2} color="#dea45a" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={grid} roughness={0.46} metalness={0.25} envMapIntensity={0.35} />
      </mesh>

      <primitive object={path.line} />
      <instancedMesh ref={packets} args={[packetGeo, packetMat, PACKETS]} frustumCulled={false} />

      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          map={glowTex}
          color="#ecc48f"
          size={0.09}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

export default Environment;
