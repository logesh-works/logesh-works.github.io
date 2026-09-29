"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { WORLDS } from "@/lib/themes";
import { world } from "@/lib/world";

/**
 * Studio reflections (a prefiltered room environment on metals, glass and the
 * floor) and a controlled bloom: high threshold, half-resolution, so only lights,
 * events and hot highlights glow. Then a film finish: slight RGB fringing and
 * animated grain, for the photographic, low-key look. Takes over rendering when mounted.
 */
const PostFX = ({ bloom }: { bloom: boolean }) => {
  const { gl, scene, camera, size } = useThree();

  // Image-based lighting: warm, low intensity, so metals read as metal.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.32;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  const fx = useMemo(() => {
    if (!bloom) return null;
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const pass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.65, 0.88);
    composer.addPass(pass);
    const fringe = new ShaderPass(RGBShiftShader);
    fringe.uniforms.amount.value = 0.0011;
    composer.addPass(fringe);
    composer.addPass(new FilmPass(0.42, false));
    composer.addPass(new OutputPass());
    return { composer, pass, fringe };
  }, [bloom, gl, scene, camera]);

  useEffect(() => {
    if (!fx) return;
    fx.composer.setPixelRatio(gl.getPixelRatio());
    fx.composer.setSize(size.width, size.height);
    fx.pass.resolution.set(size.width / 2, size.height / 2);
  }, [fx, gl, size]);

  useEffect(() => () => fx?.composer.dispose(), [fx]);

  // Priority 1 replaces R3F's own render call while bloom is on.
  useFrame((_, delta) => {
    if (!fx) return;
    // Each world has its own glow; eased so it swells with the new world's light.
    const target = WORLDS[world.theme].scene.bloom + world.audioLevel * 0.35 + world.pulse * 0.12;
    fx.pass.strength += (target - fx.pass.strength) * Math.min(delta * 2.4, 1);
    // Musical accents widen the fringe for a beat.
    fx.fringe.uniforms.amount.value = 0.0011 + world.pulse * 0.0012;
    fx.composer.render(delta);
  }, bloom ? 1 : 0);

  return null;
};

export default PostFX;
