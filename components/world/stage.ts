import type * as THREE from "three";

import { WORLDS, type WorldId } from "@/lib/themes";
import { world } from "@/lib/world";

/** The live scene of each world (index into WORLDS), registered by the stage for the renderer. */
export const stage = {
  scenes: [] as (THREE.Scene | null)[],
  /** The effect chain has started drawing (the first world is ready). */
  drawing: false,
  /** Shared studio environment map (image-based lighting), once it has been built. */
  env: null as THREE.Texture | null,
};

/** True while a world is on screen: the current one, or the one a switch is revealing. */
export const isShown = (id: WorldId) => WORLDS[world.theme].id === id || (world.transition && WORLDS[world.pendingTheme].id === id);
