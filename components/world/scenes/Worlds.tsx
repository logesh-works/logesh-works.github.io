"use client";

import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

import { WORLDS } from "@/lib/themes";
import { on, world } from "@/lib/world";

import Character from "../character/Character";
import { compileQuietly } from "../compile";
import { stage } from "../stage";
import AnimeSet from "./sets/AnimeSet";
import { paintIdle, trackPaint } from "./sets/paintQueue";
import SpaceSet from "./sets/SpaceSet";
import VillageSet from "./sets/VillageSet";

const SETS = { space: SpaceSet, anime: AnimeSet, village: VillageSet };

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

interface SceneProps {
  index: number;
  dust: number;
  reflections: boolean;
}

/**
 * One complete world in its own scene: background, fog, light rig, floor, dust,
 * set and character. Only the current world's set is built at first; the next one
 * follows quietly a few seconds after the visitor is in, and any other the moment a
 * switch to it starts. Once built, a world stays mounted (so switching back never
 * waits); the renderer draws only the current world, plus the next one while it is
 * being revealed.
 */
const WorldScene = ({ index, dust, reflections }: SceneProps) => {
  const { gl, size, camera } = useThree();
  const theme = WORLDS[index];
  const s = theme.scene;
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const dustRef = useRef<THREE.Points>(null);
  const [built, setBuilt] = useState(() => index === world.theme);

  // When to build this world's set (mirrors when its character loads).
  useEffect(() => {
    if (built) return;
    let preload = 0;
    const build = () => setBuilt(true);
    const check = () => {
      window.clearTimeout(preload);
      if (index === world.theme || (world.transition && world.pendingTheme === index)) return build();
      if (!world.entered || index !== (world.theme + 1) % WORLDS.length) return;
      preload = window.setTimeout(() => {
        const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o: { timeout: number }) => void }).requestIdleCallback;
        if (idle) idle(build, { timeout: 1500 });
        else build();
      }, 3000);
    };
    check();
    const offs = [on("theme", check), on("ready", check), on("transition", check)];
    return () => {
      window.clearTimeout(preload);
      offs.forEach((off) => off());
    };
  }, [built, index]);

  const scene = useMemo(() => {
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(s.background);
    sc.fog = new THREE.Fog(s.fog[0], s.fog[1], s.fog[2]);
    // The shared environment map arrives once built (see Worlds); worlds wait for it before compiling.
    sc.environment = stage.env;
    sc.environmentIntensity = 0.32;
    return sc;
  }, [s]);

  useEffect(() => {
    stage.scenes[index] = scene;
    return () => {
      stage.scenes[index] = null;
      world.compiledWorlds.delete(index);
    };
  }, [index, scene]);

  // Prepare the world once its set is built, so no frame of it ever stalls on setup: let its
  // textures finish painting, compile its shaders (in the background where the browser can),
  // then draw it once into a tiny offscreen buffer, which uploads its textures and sets up
  // anything else a first draw would. Nothing draws the world until this is done; its
  // character prepares itself the same way when it arrives (see Character).
  useEffect(() => {
    if (!built) return;
    let alive = true;
    // A beat later, so the set that was just mounted is actually in the scene.
    const timer = window.setTimeout(async () => {
      await paintIdle();
      if (!alive || !(await compileQuietly(gl, scene, camera, null, () => alive))) return;
      const probe = new THREE.WebGLRenderTarget(32, 32, { type: THREE.HalfFloatType });
      const before = gl.getRenderTarget();
      gl.setRenderTarget(probe);
      gl.render(scene, camera);
      gl.setRenderTarget(before);
      probe.dispose();
      world.compiledWorlds.add(index);
    }, 50);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [built, gl, camera, index, scene]);

  const res = useMemo(() => {
    const floorMat = new THREE.MeshStandardMaterial({
      color: s.floor.color,
      roughness: s.floor.roughness,
      metalness: s.floor.metalness,
      transparent: reflections && s.floor.reflect > 0,
      opacity: reflections ? 1 - s.floor.reflect : 1,
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
      color: s.dust,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { floorMat, floorGeo, glow, dustGeo, dustMat };
  }, [dust, reflections, s]);

  useEffect(
    () => () => {
      res.floorMat.dispose();
      res.floorGeo.dispose();
      res.glow.dispose();
      res.dustGeo.dispose();
      res.dustMat.dispose();
    },
    [res]
  );

  // Mirror under a glossy floor (high tier): the character and set reflect, as on polished stone.
  const mirror = useMemo(() => {
    if (!reflections || s.floor.reflect <= 0) return null;
    const pr = Math.min(gl.getPixelRatio(), 1.5);
    const r = new Reflector(new THREE.CircleGeometry(40, 64), {
      textureWidth: Math.round(size.width * pr * 0.5),
      textureHeight: Math.round(size.height * pr * 0.5),
      color: 0x888888,
    });
    r.rotation.x = -Math.PI / 2;
    r.position.y = -0.002;
    return r;
  }, [reflections, s, gl, size.width, size.height]);

  useEffect(
    () => () => {
      mirror?.getRenderTarget().dispose();
      mirror?.geometry.dispose();
      (mirror?.material as THREE.Material | undefined)?.dispose();
    },
    [mirror]
  );

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
    const shown = world.theme === index || (world.transition && world.pendingTheme === index);
    if (!shown) return;
    const k = 1 - Math.exp(-delta * 4);
    const level = world.audioLevel;
    if (key.current) key.current.intensity += (s.key.intensity + level * 18 - key.current.intensity) * k;
    if (rim.current) rim.current.intensity += (s.rim.intensity + level * 1.4 + world.pulse * 0.8 - rim.current.intensity) * k;
    const d = dustRef.current;
    if (d && !world.reduced) {
      d.rotation.y = state.clock.elapsedTime * 0.01;
      d.position.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
    }
  });

  const Set = SETS[theme.id];

  return createPortal(
    <>
      <hemisphereLight args={[s.hemi[0], s.hemi[1], s.hemi[2]]} />
      <spotLight ref={key} position={s.key.position} angle={0.55} penumbra={0.9} decay={2} distance={22} intensity={s.key.intensity} color={s.key.color} />
      <directionalLight ref={rim} position={[-3, 4.5, -5]} intensity={s.rim.intensity} color={s.rim.color} />
      <directionalLight position={[4, 2, -3]} intensity={s.fill.intensity} color={s.fill.color} />

      {mirror && <primitive object={mirror} />}
      {!s.floor.hidden && <mesh geometry={res.floorGeo} material={res.floorMat} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />}
      <points ref={dustRef} geometry={res.dustGeo} material={res.dustMat} />

      {built && <Set />}
      <Character index={index} />
    </>,
    scene
  );
};

/**
 * Image-based lighting: warm, low intensity, so metals read as metal. Built once, in the
 * background: the room's shaders compile quietly first, so the bake itself is quick. The
 * worlds don't compile (or draw) until it is in, as it changes their shaders (paintIdle).
 */
const useEnvironment = (gl: THREE.WebGLRenderer) => {
  // (Runs before any world's preparation looks at paintIdle: theirs waits a beat first.)
  useEffect(() => {
    let alive = true;
    const room = new RoomEnvironment();
    // In a task of its own, not the one that just built the first world.
    const job = new Promise((r) => window.setTimeout(r, 0))
      .then(() => compileQuietly(gl, room, new THREE.PerspectiveCamera(90, 1, 0.1, 100), null, () => alive, false, THREE.LinearSRGBColorSpace))
      .then((ok) => {
        if (ok && alive) {
          const pmrem = new THREE.PMREMGenerator(gl);
          stage.env = pmrem.fromScene(room, 0.04).texture;
          pmrem.dispose();
          stage.scenes.forEach((sc) => sc && (sc.environment = stage.env));
        }
        room.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      });
    trackPaint(job);
    return () => {
      alive = false;
      stage.env?.dispose();
      stage.env = null;
    };
  }, [gl]);
};

/** The three worlds, sharing one studio environment map for reflections. */
const Worlds = ({ dust, reflections }: { dust: number; reflections: boolean }) => {
  const { gl } = useThree();
  useEnvironment(gl);

  return (
    <>
      {WORLDS.map((w, i) => (
        <WorldScene key={w.id} index={i} dust={dust} reflections={reflections} />
      ))}
    </>
  );
};

export default Worlds;
