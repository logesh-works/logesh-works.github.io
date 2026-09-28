import * as THREE from "three";

/** Resolve the actual family names next/font generated, so 3D labels match the page type. */
const family = (cssVar: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return v ? `${v}, ${fallback}` : fallback;
};

export interface LabelOptions {
  font?: "mono" | "display" | "sans";
  size?: number;
  weight?: number;
  color?: string;
  sub?: string;
  subColor?: string;
  align?: "left" | "center";
  uppercase?: boolean;
  tracking?: number;
}

/**
 * Draws text into a canvas texture. Returns the texture and its aspect ratio so a
 * plane can be sized without stretching. Rendered at 2x for crisp edges.
 */
export const makeLabel = (text: string, opts: LabelOptions = {}) => {
  const {
    font = "mono",
    size = 44,
    weight = 500,
    color = "#ecebe6",
    sub,
    subColor = "#92959d",
    align = "center",
    uppercase = font === "mono",
    tracking = font === "mono" ? 0.14 : 0,
  } = opts;
  const fam =
    font === "mono"
      ? family("--font-mono", "ui-monospace, monospace")
      : font === "display"
        ? family("--font-display", "system-ui, sans-serif")
        : family("--font-sans", "system-ui, sans-serif");
  const main = uppercase ? text.toUpperCase() : text;
  const scale = 2;
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const mainFont = `${weight} ${size * scale}px ${fam}`;
  const subFont = `400 ${size * 0.55 * scale}px ${family("--font-mono", "monospace")}`;
  g.font = mainFont;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * size * scale}px`;
  const w1 = g.measureText(main).width;
  g.font = subFont;
  const w2 = sub ? g.measureText(sub.toUpperCase()).width : 0;
  const pad = size * 0.5 * scale;
  c.width = Math.ceil(Math.max(w1, w2) + pad * 2);
  c.height = Math.ceil(size * scale * (sub ? 2.1 : 1.45));

  g.font = mainFont;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * size * scale}px`;
  g.fillStyle = color;
  g.textBaseline = "middle";
  g.textAlign = align;
  const x = align === "center" ? c.width / 2 : pad;
  g.fillText(main, x, size * scale * 0.72);
  if (sub) {
    g.font = subFont;
    (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${0.12 * size * 0.55 * scale}px`;
    g.fillStyle = subColor;
    g.fillText(sub.toUpperCase(), x, size * scale * 1.55);
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: c.width / c.height };
};

/** Soft round sprite used for dust and event glows. */
export const makeGlowTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
