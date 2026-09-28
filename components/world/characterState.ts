import * as THREE from "three";

/** Where the character actually is this frame (he lags his mark while walking). The camera tracks this. */
export const characterState = {
  pos: new THREE.Vector3(0, 0, 1.3),
  yaw: 0,
  moving: false,
};
