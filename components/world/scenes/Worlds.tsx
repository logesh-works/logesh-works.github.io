"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

import { WORLDS } from "@/lib/themes";
import { useWorld } from "@/lib/useWorld";
import { world } from "@/lib/world";

import DuskSet from "./sets/DuskSet";
import EngineSet from "./sets/EngineSet";
import LobbySet from "./sets/LobbySet";

const SETS = { lobby: LobbySet, engine: EngineSet, dusk: DuskSet };

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

/**
 * The shared world rig: background, fog, light rig, reflective floor and dust,
 * all easing toward the active world's values, plus that world's set. The set
 * swaps while the screen is dark mid-transition; the light "comes up" on the
 * new world as the transition reveals it.
 */
const Worlds = ({ dust, reflections }: { dust: number; reflections: boolean }) => {
  const { scene, gl, size } = useThree();
  const { theme } = useWorld("theme");
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const dustRef = useRef<THREE.Points>(null);

  const res = useMemo(() => {
    const s0 = WORLDS[world.theme].scene;
    const background = new THREE.Color(s0.background);
    const fog = new THREE.Fog(s0.fog[0], s0.fog[1], s0.fog[2]);
    const floorMat = new THREE.MeshStandardMaterial({
      color: s0.floor.color,
      roughness: s0.floor.roughness,
      metalness: s0.floor.metalness,
      transparent: true,
      opacity: 1,
      envMapIntensity: 0.6,
    });
    const floorGeo = new THREE.CircleGeometry(40, 64);
    const glow = glowTexture();
    const dustGeo = new THREE.BufferGeometry();
    const p = new Float32Array(dust * 3);
    for (let i = 0; i < dust; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = Math.random() * 6 + 0.1;
      p[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const dustMat = new THREE.PointsMaterial({
      map: glow,
      color: s0.dust,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { background, fog, floorMat, floorGeo, glow, dustGeo, dustMat };
  }, [dust]);

  // Mirror under the glossy floor (high tier): the character and set reflect, as on polished stone.
  const mirror = useMemo(() => {
    if (!reflections) return null;
    const pr = Math.min(gl.getPixelRatio(), 1.5);
    const r = new Reflector(new THREE.CircleGeometry(40, 64), {
      textureWidth: Math.round(size.width * pr * 0.5),
      textureHeight: Math.round(size.height * pr * 0.5),
      color: 0x888888,
    });
    r.rotation.x = -Math.PI / 2;
    r.position.y = -0.002;
    return r;
  }, [reflections, gl, size.width, size.height]);

  useEffect(
    () => () => {
      mirror?.getRenderTarget().dispose();
      mirror?.geometry.dispose();
      (mirror?.material as THREE.Material | undefined)?.dispose();
    },
    [mirror]
  );

  useEffect(() => {
    scene.background = res.background;
    scene.fog = res.fog;
    return () => {
      scene.fog = null;
      res.floorMat.dispose();
      res.floorGeo.dispose();
      res.glow.dispose();
      res.dustGeo.dispose();
      res.dustMat.dispose();
    };
  }, [res, scene]);

  useEffect(() => {
    const k = key.current;
    if (!k) return;
    k.target.position.set(0, 1.1, 0);
    scene.add(k.target);
    return () => {
      scene.remove(k.target);
    };
  }, [scene]);

  const tmp = useMemo(() => ({ c: new THREE.Color(), v: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const s = WORLDS[world.theme].scene;
    const k = world.reduced ? 1 : 1 - Math.exp(-delta * 2.4);
    const level = world.audioLevel;
    world.pulse = Math.max(0, world.pulse - delta * 1.8);

    res.background.lerp(tmp.c.set(s.background), k);
    res.fog.color.lerp(tmp.c.set(s.fog[0]), k);
    res.fog.near += (s.fog[1] - res.fog.near) * k;
    res.fog.far += (s.fog[2] - res.fog.far) * k;
    gl.toneMappingExposure += (s.exposure - gl.toneMappingExposure) * k;

    if (hemi.current) {
      hemi.current.color.lerp(tmp.c.set(s.hemi[0]), k);
      hemi.current.groundColor.lerp(tmp.c.set(s.hemi[1]), k);
      hemi.current.intensity += (s.hemi[2] - hemi.current.intensity) * k;
    }
    if (key.current) {
      key.current.color.lerp(tmp.c.set(s.key.color), k);
      key.current.intensity += (s.key.intensity + level * 18 - key.current.intensity) * k;
      key.current.position.lerp(tmp.v.set(...s.key.position), k);
    }
    if (rim.current) {
      rim.current.color.lerp(tmp.c.set(s.rim.color), k);
      rim.current.intensity += (s.rim.intensity + level * 1.4 + world.pulse * 0.8 - rim.current.intensity) * k;
    }
    if (fill.current) {
      fill.current.color.lerp(tmp.c.set(s.fill.color), k);
      fill.current.intensity += (s.fill.intensity - fill.current.intensity) * k;
    }
    const f = res.floorMat;
    f.color.lerp(tmp.c.set(s.floor.color), k);
    f.roughness += (s.floor.roughness - f.roughness) * k;
    f.metalness += (s.floor.metalness - f.metalness) * k;
    const targetOpacity = mirror ? 1 - s.floor.reflect : 1;
    f.opacity += (targetOpacity - f.opacity) * k;
    res.dustMat.color.lerp(tmp.c.set(s.dust), k);

    const d = dustRef.current;
    if (d && !world.reduced) {
      d.rotation.y = state.clock.elapsedTime * 0.01;
      d.position.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
    }
  });

  const Set = SETS[WORLDS[theme].id];

  return (
    <>
      <hemisphereLight ref={hemi} args={["#7a6446", "#0a0806", 0.3]} />
      <spotLight ref={key} position={[2.6, 5.4, 4.2]} angle={0.55} penumbra={0.9} decay={2} distance={22} intensity={55} color="#fff1e0" />
      <directionalLight ref={rim} position={[-3, 4.5, -5]} intensity={2.4} color="#c9955a" />
      <directionalLight ref={fill} position={[4, 2, -3]} intensity={0.7} color="#9c7443" />

      {mirror && <primitive object={mirror} />}
      <mesh geometry={res.floorGeo} material={res.floorMat} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <points ref={dustRef} geometry={res.dustGeo} material={res.dustMat} />

      <Set key={theme} />
    </>
  );
};

export default Worlds;
