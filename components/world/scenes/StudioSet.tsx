"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { beatWeight, world } from "@/lib/world";

import { planFor } from "../choreography";
import { WORKSTATION } from "../stations";

const GOLD = new THREE.Color("#dea45a");

/** The system card beside the engineer in the opening shot (flow from the brief). */
const CARD_STEPS = ["API", "Service", "Queue", "Worker", "Database"];

const drawIcon = (g: CanvasRenderingContext2D, kind: string, x: number, y: number, s: number) => {
  g.save();
  g.translate(x, y);
  g.strokeStyle = "#ecc48f";
  g.lineWidth = 3;
  g.beginPath();
  switch (kind) {
    case "API": // cloud-ish endpoint
      g.arc(-s * 0.2, 0, s * 0.28, Math.PI * 0.9, Math.PI * 1.95);
      g.arc(s * 0.18, -s * 0.05, s * 0.32, Math.PI * 1.1, Math.PI * 0.1);
      g.lineTo(-s * 0.46, s * 0.26);
      g.closePath();
      break;
    case "Service": // cube
      g.moveTo(0, -s * 0.42);
      g.lineTo(s * 0.4, -s * 0.2);
      g.lineTo(s * 0.4, s * 0.25);
      g.lineTo(0, s * 0.45);
      g.lineTo(-s * 0.4, s * 0.25);
      g.lineTo(-s * 0.4, -s * 0.2);
      g.closePath();
      g.moveTo(-s * 0.4, -s * 0.2);
      g.lineTo(0, 0);
      g.lineTo(s * 0.4, -s * 0.2);
      g.moveTo(0, 0);
      g.lineTo(0, s * 0.45);
      break;
    case "Queue": // stacked messages
      for (let i = 0; i < 3; i++) g.rect(-s * 0.42 + i * s * 0.1, -s * 0.3 + i * s * 0.18, s * 0.6, s * 0.18);
      break;
    case "Worker": // gear-ish
      g.arc(0, 0, s * 0.2, 0, Math.PI * 2);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.moveTo(Math.cos(a) * s * 0.28, Math.sin(a) * s * 0.28);
        g.lineTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42);
      }
      break;
    default: // database cylinder
      g.ellipse(0, -s * 0.3, s * 0.34, s * 0.12, 0, 0, Math.PI * 2);
      g.moveTo(-s * 0.34, -s * 0.3);
      g.lineTo(-s * 0.34, s * 0.3);
      g.ellipse(0, s * 0.3, s * 0.34, s * 0.12, 0, Math.PI, 0, true);
      g.lineTo(s * 0.34, -s * 0.3);
      g.moveTo(-s * 0.34, 0);
      g.ellipse(0, 0, s * 0.34, s * 0.12, 0, Math.PI, 0, true);
  }
  g.stroke();
  g.restore();
};

const cardTexture = () => {
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 420;
  const g = c.getContext("2d")!;
  const r = 36;
  g.fillStyle = "rgba(20,17,14,0.72)";
  g.strokeStyle = "rgba(222,164,90,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(4, 4, c.width - 8, c.height - 8, r);
  g.fill();
  g.stroke();
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
  const disp = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
  g.font = `26px ${mono}, monospace`;
  g.fillStyle = "rgba(239,233,225,0.45)";
  g.fillText("~/systems $ trace request", 48, 62);
  const step = (c.width - 160) / (CARD_STEPS.length - 1);
  CARD_STEPS.forEach((label, i) => {
    const x = 80 + i * step;
    const y = 220;
    g.fillStyle = "rgba(239,233,225,0.05)";
    g.beginPath();
    g.roundRect(x - 62, y - 62, 124, 124, 26);
    g.fill();
    drawIcon(g, label, x, y, 90);
    g.font = `300 30px ${disp}, sans-serif`;
    g.fillStyle = "#efe9e1";
    g.textAlign = "center";
    g.fillText(label.toUpperCase(), x, y + 118);
    g.textAlign = "left";
    if (i < CARD_STEPS.length - 1) {
      g.strokeStyle = "rgba(222,164,90,0.7)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 82, y);
      g.lineTo(x + step - 82, y);
      g.lineTo(x + step - 94, y - 9);
      g.moveTo(x + step - 82, y);
      g.lineTo(x + step - 94, y + 9);
      g.stroke();
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** Thin glowing floor frame around a station. */
const LedFrame = ({ center, w, d }: { center: [number, number, number]; w: number; d: number }) => {
  const t = 0.022;
  const bars: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [center[0], 0.006, center[2] - d / 2], s: [w, 0.012, t] },
    { p: [center[0], 0.006, center[2] + d / 2], s: [w, 0.012, t] },
    { p: [center[0] - w / 2, 0.006, center[2]], s: [t, 0.012, d] },
    { p: [center[0] + w / 2, 0.006, center[2]], s: [t, 0.012, d] },
  ];
  return (
    <>
      {bars.map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.s} />
          <meshBasicMaterial color="#b98247" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
};

/**
 * Architecture of the studio: tall dark perimeter walls cut with warm light slits,
 * LED frames marking stations on the floor, and the opening system card.
 */
const StudioSet = () => {
  const card = useRef<THREE.Mesh>(null);
  const cardMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => cardTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const hero = planFor("hero")!.mark.pos;
  // In portrait the card would be cropped; the page copy carries the flow there instead.
  const portrait = useThree((s) => s.size.width / s.size.height < 0.9);

  const walls = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number; len: number; slits: boolean }[] = [
      { pos: [4, 0, -30], rot: 0, len: 56, slits: true },
      { pos: [-19, 0, -8], rot: Math.PI / 2, len: 48, slits: false },
      { pos: [29, 0, -8], rot: -Math.PI / 2, len: 48, slits: false },
    ];
    return out;
  }, []);

  useFrame((state) => {
    const c = card.current;
    if (!c) return;
    const t = state.clock.elapsedTime;
    if (!world.reduced) c.position.y = 1.95 + Math.sin(t * 0.8) * 0.04;
    const w = beatWeight("hero");
    c.visible = w > 0.01 && !portrait;
    if (cardMat.current) cardMat.current.opacity = w;
  });

  return (
    <group>
      {walls.map((w, i) => (
        <group key={i} position={w.pos} rotation={[0, w.rot, 0]}>
          <mesh position={[0, 6, 0]}>
            <boxGeometry args={[w.len, 12, 0.3]} />
            <meshStandardMaterial color="#12100e" roughness={0.55} metalness={0.4} />
          </mesh>
          {w.slits &&
            Array.from({ length: Math.floor(w.len / 7) }).map((_, k) => (
              <mesh key={k} position={[-w.len / 2 + 3.5 + k * 7, 4.2, 0.16]}>
                <boxGeometry args={[0.04, 6, 0.02]} />
                <meshBasicMaterial color="#6e4b28" />
              </mesh>
            ))}
          <mesh position={[0, 0.12, 0.2]}>
            <boxGeometry args={[w.len, 0.03, 0.03]} />
            <meshBasicMaterial color="#8a5f33" />
          </mesh>
        </group>
      ))}

      <LedFrame center={[hero[0], 0, hero[2]]} w={3.4} d={2.6} />
      <LedFrame center={[WORKSTATION.mark[0], 0, WORKSTATION.mark[2] - 0.4]} w={2.4} d={2.2} />

      <mesh ref={card} position={[hero[0] + 1.5, 2.1, hero[2] - 0.7]} rotation={[0, -0.28, 0]}>
        <planeGeometry args={[1.6, 0.48]} />
        <meshBasicMaterial ref={cardMat} map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

export default StudioSet;
