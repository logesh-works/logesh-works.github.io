"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { postmanMcp } from "@/constants";
import { beatWeight, setCursorLabel, world } from "@/lib/world";

import { GATES, WORKSTATION, gate } from "../stations";
import Label from "./Label";

const SIGNAL = new THREE.Color("#dea45a");
const STEEL = new THREE.Color("#8a7c69");
const DIM = new THREE.Color("#3a4250");
const BRASS = new THREE.Color("#8a6636");

/** The output the project README shows for `/postman:syncapi create_payment --into payments`. */
const TERMINAL = [
  { t: "$ /postman:syncapi create_payment --into payments", c: "#92959d" },
  { t: "", c: "" },
  { t: "Collection: Acme Backend", c: "#92959d" },
  { t: "Plan: 1 new · 0 modified", c: "#92959d" },
  { t: "", c: "" },
  { t: "[NEW] POST /payments  → payments  ✓ verified (app/payments.py:12)", c: "#ecebe6" },
  { t: "", c: "" },
  { t: "Write to Postman? Re-run with confirm=true to apply.", c: "#dea45a" },
];

const terminalTexture = () => {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 720;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b0c0f";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "rgba(236,235,230,0.12)";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, c.width - 3, c.height - 3);
  g.fillStyle = "rgba(236,235,230,0.15)";
  [40, 70, 100].forEach((x) => {
    g.beginPath();
    g.arc(x, 38, 9, 0, Math.PI * 2);
    g.fill();
  });
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
  g.font = `30px ${mono}, monospace`;
  TERMINAL.forEach((l, i) => {
    g.fillStyle = l.c || "#fff";
    g.fillText(l.t, 44, 140 + i * 62);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/**
 * Where Postman MCP is run: a standing workstation whose terminal feeds a line of
 * gates, one per real pipeline stage. As the visitor scrolls the stages, each gate
 * lights and an event packet travels through to the Postman collection.
 */
const PostmanStation = () => {
  const stages = postmanMcp.stages;
  const gateMats = useMemo(
    () => stages.map(() => new THREE.MeshStandardMaterial({ color: STEEL, metalness: 0.5, roughness: 0.35, emissive: STEEL, emissiveIntensity: 0.08 })),
    [stages]
  );
  useEffect(() => () => gateMats.forEach((m) => m.dispose()), [gateMats]);
  const packet = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.PointLight>(null);
  const screen = useMemo(() => terminalTexture(), []);
  useEffect(() => () => screen.dispose(), [screen]);

  const frame = useMemo(() => {
    const s = GATES.size;
    const bar = 0.035;
    return {
      h: new THREE.BoxGeometry(s, bar, bar),
      v: new THREE.BoxGeometry(bar, s, bar),
      s,
    };
  }, []);
  useEffect(
    () => () => {
      frame.h.dispose();
      frame.v.dispose();
    },
    [frame]
  );

  const start = useMemo(() => new THREE.Vector3(...WORKSTATION.terminal), []);
  const end = useMemo(() => new THREE.Vector3(...gate(stages.length)), [stages.length]);

  const run = useRef(-1);

  useFrame((state, delta) => {
    // While the chapter is on screen the pipeline runs: gates light in order, then it loops.
    const focus = beatWeight("oss-intro");
    if (focus > 0.4) run.current = run.current < 0 ? 0 : (run.current + delta * 1.6) % (stages.length + 2);
    else run.current = -1;
    const progress = world.reduced && focus > 0.4 ? stages.length : Math.min(run.current, stages.length);

    gateMats.forEach((m, k) => {
      const lit = THREE.MathUtils.clamp(progress - k + 1, 0, 1);
      m.emissive.copy(lit > 0.01 ? SIGNAL : STEEL);
      m.emissiveIntensity = 0.06 + lit * 0.45;
      m.color.lerpColors(DIM, BRASS, lit);
    });

    // The event packet rides to the furthest lit gate, looping while you read.
    const p = packet.current;
    if (p) {
      const reach = THREE.MathUtils.clamp((progress + 1) / (stages.length + 0.001), 0, 1);
      const loop = world.reduced ? 1 : (state.clock.elapsedTime * 0.35) % 1;
      const u = reach * loop;
      p.position.lerpVectors(start, end, u);
      p.position.y += Math.sin(u * Math.PI) * 0.25;
      p.visible = progress > -1;
      if (halo.current) {
        halo.current.position.copy(p.position);
        halo.current.intensity = p.visible ? 3 + world.audioLevel * 6 : 0;
      }
    }
  });

  const over = (label: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setCursorLabel(label);
  };

  return (
    <group>
      {/* Standing desk with keyboard, and the terminal floating above it. */}
      <mesh position={WORKSTATION.desk}>
        <boxGeometry args={[1.25, 0.04, 0.55]} />
        <meshStandardMaterial color="#14161a" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[WORKSTATION.desk[0], 0.51, WORKSTATION.desk[2]]}>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color="#14161a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[WORKSTATION.desk[0], WORKSTATION.desk[1] + 0.03, WORKSTATION.desk[2] + 0.1]}>
        <boxGeometry args={[0.5, 0.015, 0.17]} />
        <meshStandardMaterial color="#1e2126" metalness={0.4} roughness={0.5} emissive={SIGNAL} emissiveIntensity={0.05} />
      </mesh>
      <mesh position={WORKSTATION.terminal} rotation={[-0.08, 0, 0]} onPointerOver={over("Postman MCP")} onPointerOut={() => setCursorLabel(null)}>
        <planeGeometry args={[1.28, 0.72]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>

      {stages.map((s, k) => {
        const [x, y, z] = gate(k);
        const half = frame.s / 2;
        return (
          <group key={s.label} position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} onPointerOver={over(s.label)} onPointerOut={() => setCursorLabel(null)}>
            {[
              { g: frame.h, p: [0, half, 0] },
              { g: frame.h, p: [0, -half, 0] },
              { g: frame.v, p: [-half, 0, 0] },
              { g: frame.v, p: [half, 0, 0] },
            ].map((bar, j) => (
              <mesh key={j} geometry={bar.g} material={gateMats[k]} position={bar.p as [number, number, number]} />
            ))}
            <Label
              text={s.label}
              sub={String(k + 1).padStart(2, "0")}
              position={[0, half + 0.28, 0]}
              height={0.2}
            />
          </group>
        );
      })}

      {/* The Postman collection the pipeline writes to. */}
      <group position={gate(stages.length)}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, -0.18 + i * 0.12, 0]} rotation={[0, 0.3 * i, 0]}>
            <boxGeometry args={[0.7, 0.05, 0.5]} />
            <meshStandardMaterial color="#1b1e24" metalness={0.6} roughness={0.3} emissive={SIGNAL} emissiveIntensity={0.15 + i * 0.1} />
          </mesh>
        ))}
      </group>

      <mesh ref={packet}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={SIGNAL} toneMapped={false} />
      </mesh>
      <pointLight ref={halo} distance={3} decay={2} color="#dea45a" />
    </group>
  );
};

export default PostmanStation;
