"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { FlowStep, SystemFlow } from "@/interfaces";
import { beatWeight, setCursorLabel, world } from "@/lib/world";

import type { Vec3 } from "../stations";
import Label from "./Label";

const SIGNAL = new THREE.Color("#dea45a");
const STEEL = new THREE.Color("#8a7c69");
const BODY = new THREE.Color("#1b1e24");

const shapeFor = (kind: FlowStep["kind"]): THREE.BufferGeometry => {
  switch (kind) {
    case "queue":
      return new THREE.BoxGeometry(0.7, 0.26, 0.26);
    case "store":
      return new THREE.CylinderGeometry(0.22, 0.22, 0.36, 28);
    case "client":
      return new THREE.BoxGeometry(0.5, 0.34, 0.04);
    case "source":
      return new THREE.OctahedronGeometry(0.24, 0);
    case "check":
      return new THREE.TorusGeometry(0.2, 0.035, 10, 32);
    default:
      return new THREE.BoxGeometry(0.36, 0.36, 0.36);
  }
};

interface PipelineProps {
  flow: SystemFlow;
  from: Vec3;
  to: Vec3;
  /** Beat during which this pipeline is the subject. */
  beat: string;
  title?: string;
}

/**
 * A real system flow as a floating rail: one node per step, the wire between them,
 * and events travelling along it. It wakes up (step by step) when its beat arrives.
 */
const Pipeline = ({ flow, from, to, beat, title }: PipelineProps) => {
  const n = flow.steps.length;
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);
  const pts = useMemo(() => flow.steps.map((_, i) => a.clone().lerp(b, i / (n - 1))), [a, b, n, flow.steps]);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const inst = useRef<THREE.InstancedMesh>(null);
  const wake = useRef(0);
  const PACKETS = 14;

  const res = useMemo(() => {
    const geos = flow.steps.map((s) => shapeFor(s.kind));
    const wireGeo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const wireMat = new THREE.LineBasicMaterial({ color: STEEL, transparent: true, opacity: 0.45 });
    const dot = new THREE.SphereGeometry(0.04, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false });
    return { geos, wireGeo, wireMat, dot, dotMat, wire: new THREE.Line(wireGeo, wireMat) };
  }, [flow.steps, a, b]);

  useEffect(
    () => () => {
      res.geos.forEach((g) => g.dispose());
      res.wireGeo.dispose();
      res.wireMat.dispose();
      res.dot.dispose();
      res.dotMat.dispose();
    },
    [res]
  );

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const focus = beatWeight(beat);
    wake.current += ((focus > 0.4 ? 1 : 0) - wake.current) * Math.min(delta * 1.2, 1);
    const w = wake.current;

    for (let i = 0; i < n; i++) {
      // Steps light up in order as the pipeline wakes.
      const lit = THREE.MathUtils.clamp(w * (n + 1) - i, 0, 1);
      const mat = mats.current[i];
      if (mat) {
        mat.emissive.copy(lit > 0.01 ? SIGNAL : BODY);
        mat.emissiveIntensity = 0.08 + lit * 0.16;
      }
      const node = nodeRefs.current[i];
      if (node && !world.reduced) {
        node.rotation.y = t * 0.3 + i;
        node.position.y = pts[i].y + Math.sin(t * 0.9 + i) * 0.04;
      }
    }
    res.wireMat.opacity = 0.3 + w * 0.4;
    res.wireMat.color.copy(STEEL).lerp(SIGNAL, w * 0.6);

    const mesh = inst.current;
    if (mesh) {
      const speed = 0.08 + w * 0.12 + world.audioLevel * 0.1;
      for (let i = 0; i < PACKETS; i++) {
        const u = world.reduced ? i / PACKETS : (i / PACKETS + t * speed) % 1;
        tmp.v.lerpVectors(a, b, u);
        tmp.s.setScalar((0.35 + w * 0.9) * Math.sin(u * Math.PI));
        tmp.m.compose(tmp.v, tmp.q, tmp.s);
        mesh.setMatrixAt(i, tmp.m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const over = (label: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setCursorLabel(label);
  };

  return (
    <group>
      <primitive object={res.wire} />
      {flow.steps.map((s, i) => (
        <group key={s.label}>
          <mesh
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            geometry={res.geos[i]}
            position={pts[i]}
            onPointerOver={over(s.label)}
            onPointerOut={() => setCursorLabel(null)}
          >
            <meshStandardMaterial
              ref={(m) => {
                mats.current[i] = m;
              }}
              color={BODY}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <Label text={s.label} position={[pts[i].x, pts[i].y - 0.42, pts[i].z]} height={0.11} />
        </group>
      ))}
      {title && (
        <Label
          text={title}
          font="display"
          weight={300}
          uppercase
          size={56}
          position={[pts[0].x, pts[0].y + 0.5, pts[0].z]}
          height={0.12}
        />
      )}
      <instancedMesh ref={inst} args={[res.dot, res.dotMat, PACKETS]} frustumCulled={false} />
    </group>
  );
};

export default Pipeline;
