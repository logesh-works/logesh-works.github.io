import * as THREE from "three";

/**
 * Prepares the shaders `object` needs without stalling the page. Programs are created
 * now and link in the background where the browser can (KHR_parallel_shader_compile);
 * this polls until they are ready. Unlike three's compileAsync, the poll stops as soon
 * as `alive()` turns false, so tearing the stage down mid-compile is safe.
 *
 * By default it compiles against a half-float target like the effect chain's, so the
 * shader variants match what will actually be drawn; `toScreen` compiles the variant
 * that draws straight to the canvas instead. With `targetScene`, `object` is compiled
 * as if it were in that scene (its lights, fog and environment).
 */
export const compileQuietly = (
  gl: THREE.WebGLRenderer,
  object: THREE.Object3D,
  camera: THREE.Camera,
  targetScene: THREE.Scene | null,
  alive: () => boolean,
  toScreen = false,
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace
): Promise<boolean> => {
  const probe = toScreen ? null : new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, colorSpace });
  const prev = gl.getRenderTarget();
  let pending: Set<THREE.Material>;
  try {
    gl.setRenderTarget(probe);
    pending = gl.compile(object, camera, targetScene);
  } catch {
    return Promise.resolve(alive());
  } finally {
    gl.setRenderTarget(prev);
    probe?.dispose();
  }
  return new Promise((resolve) => {
    const check = () => {
      if (!alive()) return resolve(false);
      pending.forEach((m) => {
        const program = (gl.properties.get(m) as { currentProgram?: { isReady: () => boolean } }).currentProgram;
        if (!program || program.isReady()) pending.delete(m);
      });
      if (!pending.size) return resolve(true);
      window.setTimeout(check, 16);
    };
    check();
  });
};

const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeometry = new THREE.PlaneGeometry(2, 2);

/** Compiles full-screen-pass materials (they draw on a quad, outside any scene) without stalling. */
export const compileMaterialsQuietly = (gl: THREE.WebGLRenderer, materials: THREE.Material[], alive: () => boolean, toScreen = false) => {
  const holder = new THREE.Scene();
  materials.forEach((m) => holder.add(new THREE.Mesh(quadGeometry, m)));
  return compileQuietly(gl, holder, quadCamera, null, alive, toScreen);
};

/**
 * Uploads the textures `object`'s materials use, one per task, so the first frame that
 * draws it doesn't upload them all at once (a 2048² texture can take a few hundred ms).
 */
export const uploadTexturesQuietly = async (gl: THREE.WebGLRenderer, object: THREE.Object3D, alive: () => boolean) => {
  const textures = new Set<THREE.Texture>();
  object.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    (Array.isArray(m) ? m : m ? [m] : []).forEach((mat) => Object.values(mat).forEach((v) => v instanceof THREE.Texture && textures.add(v)));
  });
  for (const t of Array.from(textures)) {
    if (!alive()) return false;
    gl.initTexture(t);
    await new Promise((r) => window.setTimeout(r, 0));
  }
  return alive();
};
