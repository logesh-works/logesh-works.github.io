"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { world } from "@/lib/world";

import { disposeGroup } from "./disposeGroup";
import { sunsetTexture } from "./textures";

/** Places a mesh and returns it (three.js positions can't be assigned directly). */
const at = (mesh: THREE.Mesh, x: number, y: number, z: number) => {
  mesh.position.set(x, y, z);
  return mesh;
};

/**
 * World 03, Dusk Studio: a curved warm wall with a great round window onto a
 * sunset over the mountains, a bonsai on a plinth, and a round dais with a desk
 * and an open laptop.
 */
const DuskSet = () => {
  const set = useMemo(() => {
    const g = new THREE.Group();

    // Curved wall around the back of the room.
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 12, 12, 64, 1, true, Math.PI * 0.55, Math.PI * 0.9),
      new THREE.MeshStandardMaterial({ color: "#3a2721", roughness: 0.85, side: THREE.BackSide })
    );
    wall.position.y = 6;
    g.add(wall);

    // The round window: sky behind, frame in front.
    const sky = sunsetTexture();
    const skyMat = new THREE.MeshBasicMaterial({ map: sky, fog: false, toneMapped: false });
    const win = new THREE.Group();
    const skyDisc = new THREE.Mesh(new THREE.CircleGeometry(5.2, 96), skyMat);
    win.add(skyDisc);
    const frameMat = new THREE.MeshStandardMaterial({ color: "#c9b8a8", roughness: 0.3, metalness: 0.6 });
    win.add(new THREE.Mesh(new THREE.TorusGeometry(5.25, 0.18, 16, 128), frameMat));
    win.position.set(-1.5, 4.6, -11.3);
    g.add(win);

    // A second, smaller porthole on the side for the side shots.
    const side = new THREE.Group();
    side.add(new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), skyMat));
    side.add(new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.12, 12, 96), frameMat));
    side.position.set(-10.8, 3.4, -3.2);
    side.rotation.y = Math.PI / 2 - 0.25;
    g.add(side);

    // Bonsai on a plinth.
    const bonsai = new THREE.Group();
    const plinthMat = new THREE.MeshStandardMaterial({ color: "#241915", roughness: 0.4, metalness: 0.3 });
    bonsai.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.9, 40), plinthMat), 0, 0.45, 0));
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0.15, 1.3, 0.05),
      new THREE.Vector3(-0.2, 1.7, 0),
      new THREE.Vector3(0.25, 2.05, -0.05),
      new THREE.Vector3(0.55, 2.2, 0),
    ]);
    const bark = new THREE.MeshStandardMaterial({ color: "#3b2519", roughness: 0.9 });
    bonsai.add(new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 32, 0.07, 8, false), bark));
    const leafMat = new THREE.MeshStandardMaterial({ color: "#7d4f78", roughness: 0.75, flatShading: true });
    const leafGeo = new THREE.IcosahedronGeometry(1, 1);
    [
      [0.55, 2.3, 0, 0.42],
      [-0.25, 1.95, 0.1, 0.34],
      [0.15, 2.45, -0.1, 0.3],
      [0.85, 2.15, 0.1, 0.26],
    ].forEach(([x, y, z, s]) => {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(x, y, z);
      leaf.scale.set(s * 1.3, s * 0.75, s);
      bonsai.add(leaf);
    });
    bonsai.position.set(5.2, 0, -6.5);
    g.add(bonsai);

    // Round dais with a desk and an open laptop.
    const dais = new THREE.Group();
    dais.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.28, 64), plinthMat), 0, 0.14, 0));
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(2.46, 0.015, 6, 128), new THREE.MeshBasicMaterial({ color: "#ffb48a", toneMapped: false }));
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.26;
    dais.add(glowRing);
    const deskMat = new THREE.MeshStandardMaterial({ color: "#1a1210", roughness: 0.3, metalness: 0.4 });
    dais.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.9), deskMat), 0, 1.02, 0));
    dais.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.7), deskMat), -0.95, 0.65, 0));
    dais.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.7), deskMat), 0.95, 0.65, 0));
    const alu = new THREE.MeshStandardMaterial({ color: "#c7c3be", metalness: 0.9, roughness: 0.3 });
    dais.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.34), alu), 0.2, 1.06, 0.05));
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.015), alu);
    screen.position.set(0.2, 1.22, -0.12);
    screen.rotation.x = -0.25;
    dais.add(screen);
    const glowScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), new THREE.MeshBasicMaterial({ color: "#ffe2c8", toneMapped: false }));
    glowScreen.position.set(0.2, 1.22, -0.11);
    glowScreen.rotation.x = -0.25;
    dais.add(glowScreen);
    dais.position.set(-5.4, 0, -5.6);
    dais.rotation.y = 0.7;
    g.add(dais);

    // Warm sunlight streaming in through the window.
    const sun = new THREE.PointLight("#ffb98a", 30, 22, 1.6);
    sun.position.set(-1.5, 4.5, -9.5);
    g.add(sun);

    return { g, sun };
  }, []);

  useEffect(() => () => disposeGroup(set.g), [set]);

  useFrame((state) => {
    if (world.reduced) return;
    set.sun.intensity = 30 + Math.sin(state.clock.elapsedTime * 0.3) * 3 + world.audioLevel * 8;
  });

  return <primitive object={set.g} />;
};

export default DuskSet;
