/** Software rasterisers: WebGL works there, but the 3D stage would lock the page up. */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|lavapipe/i;

/**
 * Hardware-accelerated WebGL 2 is available. Checks both the browser's own verdict
 * (failIfMajorPerformanceCaveat) and the renderer's name, since some software paths
 * (e.g. SwiftShader when it's force-enabled) don't report the caveat. The probe's
 * context is released straight away so it never counts against the browser's limit.
 */
export const hasFastWebGL = () => {
  try {
    const gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !SOFTWARE.test(renderer);
  } catch {
    return false;
  }
};
