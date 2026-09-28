"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { skillLayers } from "@/constants";
import { beatWeight, setCursorLabel, setHoveredLayer, world } from "@/lib/world";

import { edges, layerOrder, nodeIndex, nodes, type NodeShape } from "../graph";
import { GRAPH } from "../stations";

const SIGNAL = new THREE.Color("#dea45a");
const STEEL = new THREE.Color("#8a7c69");
const BODY = new THREE.Color("#1b1e24");
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const nodeDelay = nodes.map((n, i) => 0.4 + layerOrder.indexOf(n.layer) * 0.22 + (i % 3) * 0.06);

/**
 * The system the engineer studies: clients → APIs → AI → async workers → data.
 * Hovering a node (or a row in the skills list) lights its whole layer; musical
 * accents flash a node and send events down the wires. In the "Systems" chapter
 * the layers pull apart into an exploded view.
 */
const ArchitectureGraph = ({ packets }: { packets: number }) => {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const outlines = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const inst = useRef<THREE.InstancedMesh>(null);
  const start = useRef<number | null>(null);
  const flash = useMemo(() => new Float32Array(nodes.length), []);
  const lastPulse = useRef(0);

  const targets = useMemo(() => nodes.map((n) => new THREE.Vector3(...n.pos)), []);
  const current = useMemo(() => targets.map(() => new THREE.Vector3()), [targets]);
  const assembled = useMemo(() => new Float32Array(nodes.length), []);
  const ends = useMemo(() => edges.map(([a, b]) => [nodeIndex.get(a)!, nodeIndex.get(b)!] as const), []);

  const res = useMemo(() => {
    const geometries: Record<NodeShape, THREE.BufferGeometry> = {
      screen: new THREE.BoxGeometry(0.66, 0.44, 0.05),
      service: new THREE.BoxGeometry(0.46, 0.46, 0.46),
      queue: new THREE.BoxGeometry(0.34, 0.34, 1.15),
      store: new THREE.CylinderGeometry(0.27, 0.27, 0.46, 28),
      model: new THREE.IcosahedronGeometry(0.3, 0),
    };
    const lines = Object.fromEntries(
      Object.entries(geometries).map(([k, g]) => [k, new THREE.EdgesGeometry(g, 25)])
    ) as Record<NodeShape, THREE.EdgesGeometry>;
    const wires = new THREE.BufferGeometry();
    wires.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    wires.setAttribute("color", new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    const wireMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 });
    const dot = new THREE.SphereGeometry(0.05, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false });
    return { geometries, lines, wires, wireMat, dot, dotMat, segs: new THREE.LineSegments(wires, wireMat) };
  }, []);

  useEffect(
    () => () => {
      Object.values(res.geometries).forEach((g) => g.dispose());
      Object.values(res.lines).forEach((g) => g.dispose());
      res.wires.dispose();
      res.wireMat.dispose();
      res.dot.dispose();
      res.dotMat.dispose();
    },
    [res]
  );

  const flow = useMemo(
    () =>
      Array.from({ length: packets }, (_, i) => ({
        edge: i % edges.length,
        offset: Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1,
        speed: 0.14 + (Math.abs(Math.sin(i * 78.233) * 12345.678) % 1) * 0.2,
      })),
    [packets]
  );
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !world.entered) return;
    // The system assembles once the visitor leaves the opening shot.
    if (start.current === null) {
      if (!world.reduced && world.beat < 0.3) {
        g.scale.setScalar(0.0001);
        return;
      }
      start.current = state.clock.elapsedTime;
      g.scale.setScalar(GRAPH.scale);
    }
    const t = world.reduced ? 99 : state.clock.elapsedTime - start.current;
    const explode = beatWeight("stack");
    const hovered = world.hoveredLayer;

    // Musical accent → flash one node.
    if (world.pulse > 0.95 && state.clock.elapsedTime - lastPulse.current > 0.1) {
      lastPulse.current = state.clock.elapsedTime;
      flash[Math.floor(world.pulseSeed * nodes.length)] = 1;
    }

    for (let i = 0; i < nodes.length; i++) {
      const k = easeOut((t - nodeDelay[i]) / 1.1);
      assembled[i] = k;
      const li = layerOrder.indexOf(nodes[i].layer);
      current[i].copy(targets[i]).multiplyScalar(k);
      current[i].z += explode * (li - 2) * 1.6;
      current[i].y += explode * (li - 2) * 0.5;
      flash[i] = Math.max(0, flash[i] - delta * 2.2);
      const ref = nodeRefs.current[i];
      if (ref) {
        ref.position.copy(current[i]);
        ref.scale.setScalar(Math.max(k, 0.0001));
        if (!world.reduced) ref.rotation.y = Math.sin(t * 0.4 + i) * 0.25;
      }
      const lit = hovered === nodes[i].layer;
      const mat = mats.current[i];
      if (mat) {
        mat.emissive.copy(lit || flash[i] > 0.01 ? SIGNAL : BODY);
        mat.emissiveIntensity = lit ? 0.6 : 0.12 + flash[i] * 0.9;
      }
      const o = outlines.current[i];
      if (o) o.color.copy(lit || flash[i] > 0.3 ? SIGNAL : STEEL);
    }

    const pos = res.wires.getAttribute("position") as THREE.BufferAttribute;
    const col = res.wires.getAttribute("color") as THREE.BufferAttribute;
    ends.forEach(([a, b], e) => {
      pos.setXYZ(e * 2, current[a].x, current[a].y, current[a].z);
      pos.setXYZ(e * 2 + 1, current[b].x, current[b].y, current[b].z);
      const lit = hovered && (nodes[a].layer === hovered || nodes[b].layer === hovered);
      const c = lit ? SIGNAL : STEEL;
      const w = Math.min(assembled[a], assembled[b]) * (lit ? 1 : 0.7);
      col.setXYZ(e * 2, c.r * w, c.g * w, c.b * w);
      col.setXYZ(e * 2 + 1, c.r * w, c.g * w, c.b * w);
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;

    const mesh = inst.current;
    if (mesh) {
      const boost = 1 + world.audioLevel * 1.5;
      for (let i = 0; i < flow.length; i++) {
        const f = flow[i];
        const [a, b] = ends[f.edge];
        const ready = Math.min(assembled[a], assembled[b]);
        const u = world.reduced ? f.offset : (f.offset + t * f.speed * boost) % 1;
        tmp.v.lerpVectors(current[a], current[b], u);
        tmp.s.setScalar(ready < 0.98 ? 0 : Math.sin(u * Math.PI) * 1.1 + 0.25);
        tmp.m.compose(tmp.v, tmp.q, tmp.s);
        mesh.setMatrixAt(i, tmp.m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (!world.reduced) {
      g.rotation.y = -0.25 + Math.sin(t * 0.12) * 0.18 + explode * 0.5;
      g.position.y = GRAPH.pos[1] + Math.sin(t * 0.6) * 0.06;
    }
  });

  const over = (layer: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredLayer(layer);
    setCursorLabel(skillLayers.find((l) => l.id === layer)?.layer ?? null);
  };
  const out = () => {
    setHoveredLayer(null);
    setCursorLabel(null);
  };

  return (
    <group ref={group} position={GRAPH.pos} scale={GRAPH.scale}>
      <primitive object={res.segs} />
      {nodes.map((n, i) => {
        const rot: [number, number, number] = n.shape === "store" ? [0, 0, 0] : [0.35, 0.5, 0];
        return (
          <group
            key={n.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            onPointerOver={over(n.layer)}
            onPointerOut={out}
          >
            <mesh geometry={res.geometries[n.shape]} rotation={rot}>
              <meshStandardMaterial
                ref={(m) => {
                  mats.current[i] = m;
                }}
                color={BODY}
                metalness={0.6}
                roughness={0.32}
              />
            </mesh>
            <lineSegments geometry={res.lines[n.shape]} rotation={rot}>
              <lineBasicMaterial
                ref={(m) => {
                  outlines.current[i] = m;
                }}
                color={STEEL}
                transparent
                opacity={0.85}
              />
            </lineSegments>
          </group>
        );
      })}
      <instancedMesh ref={inst} args={[res.dot, res.dotMat, packets]} frustumCulled={false} />
    </group>
  );
};

export default ArchitectureGraph;
