"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { disposeGroup, ring } from "./disposeGroup";
import { codePanelTexture, rng } from "./textures";

/**
 * World 02, Engine Room: rows of server racks with blinking amber and blue LEDs,
 * floating glass panels of code, databases and service graphs, and a slowly
 * turning holographic globe of points.
 */
const EngineSet = () => {
  const set = useMemo(() => {
    const g = new THREE.Group();
    const r = rng(21);

    // Server racks around the room (instanced), each with a column of LEDs.
    const spots = [...ring(18, 9.2, 1.5), ...ring(24, 11.5, 2.5)];
    const rackGeo = new THREE.BoxGeometry(0.9, 2.4, 1.1);
    const rackMat = new THREE.MeshStandardMaterial({ color: "#10141c", roughness: 0.4, metalness: 0.7 });
    const racks = new THREE.InstancedMesh(rackGeo, rackMat, spots.length);
    const ledGeo = new THREE.BoxGeometry(0.5, 0.025, 0.02);
    const ledMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
    const perRack = 8;
    const leds = new THREE.InstancedMesh(ledGeo, ledMat, spots.length * perRack);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const amber = new THREE.Color("#ff9a3c");
    const blue = new THREE.Color("#4f9dff");
    const dim = new THREE.Color("#2a3140");
    spots.forEach(({ x, z, angle }, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
      m4.compose(new THREE.Vector3(x, 1.2, z), q, new THREE.Vector3(1, 1, 1));
      racks.setMatrixAt(i, m4);
      const inward = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(0.57);
      for (let k = 0; k < perRack; k++) {
        const pos = new THREE.Vector3(x, 0.35 + k * 0.26, z).add(inward);
        m4.compose(pos, q, new THREE.Vector3(1, 1, 1));
        leds.setMatrixAt(i * perRack + k, m4);
        const roll = r();
        leds.setColorAt(i * perRack + k, roll < 0.45 ? amber : roll < 0.8 ? blue : dim);
      }
    });
    g.add(racks, leds);

    // Floating glass panels facing the stage.
    const panels: { mesh: THREE.Mesh; base: number; phase: number }[] = [];
    const kinds = ["code", "graph", "code", "db", "code", "graph", "code", "db", "code"] as const;
    ring(12, 8.6, -1.5).forEach(({ x, z, angle }, i) => {
      const tex = codePanelTexture(i, kinds[i % kinds.length]);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.19), mat);
      const base = 2.1 + (i % 3) * 0.9;
      mesh.position.set(x, base, z);
      mesh.rotation.y = -angle + Math.PI;
      mesh.rotation.x = (r() - 0.5) * 0.12;
      panels.push({ mesh, base, phase: r() * Math.PI * 2 });
      g.add(mesh);
    });

    // Holographic globe: points on a sphere plus latitude rings.
    const globe = new THREE.Group();
    const n = 900;
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      pts[i * 3] = Math.cos(th) * rad * 1.7;
      pts[i * 3 + 1] = y * 1.7;
      pts[i * 3 + 2] = Math.sin(th) * rad * 1.7;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    globe.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: "#6fb0ff", size: 0.035, transparent: true, opacity: 0.9, toneMapped: false })));
    const lineMat = new THREE.MeshBasicMaterial({ color: "#3d7fe0", transparent: true, opacity: 0.35, toneMapped: false });
    for (let k = -2; k <= 2; k++) {
      const y = (k / 3) * 1.7;
      const rr = Math.sqrt(1.7 * 1.7 - y * y);
      const lat = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.006, 4, 96), lineMat);
      lat.rotation.x = Math.PI / 2;
      lat.position.y = y;
      globe.add(lat);
    }
    globe.position.set(4.2, 3.6, -10.5);
    g.add(globe);

    // Faint blue floor grid.
    const grid = new THREE.GridHelper(40, 40, "#1d3b66", "#0f1d33");
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.012;
    g.add(grid);

    return { g, panels, globe, leds, ledMat };
  }, []);

  useEffect(() => () => disposeGroup(set.g), [set]);

  useFrame((state, delta) => {
    if (world.reduced) return;
    const t = state.clock.elapsedTime;
    set.panels.forEach((p) => {
      p.mesh.position.y = p.base + Math.sin(t * 0.7 + p.phase) * 0.08;
    });
    set.globe.rotation.y += delta * 0.12;
    set.ledMat.color.setScalar(0.75 + 0.25 * Math.sin(t * 6) + world.pulse * 0.3);
  });

  return <primitive object={set.g} />;
};

export default EngineSet;
