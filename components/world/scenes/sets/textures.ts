import * as THREE from "three";

/** Small canvas-drawn textures for the world sets (no image downloads). */

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
};

const finish = (c: HTMLCanvasElement, repeat?: [number, number]) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
};

/** Seeded pseudo-random so the sets look the same on every visit. */
export const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Black marble with warm gold veins. */
export const marbleTexture = () => {
  const { c, g } = canvas(512, 1024);
  const r = rng(7);
  g.fillStyle = "#0d0b09";
  g.fillRect(0, 0, 512, 1024);
  for (let k = 0; k < 26; k++) {
    g.strokeStyle = `rgba(${200 + r() * 40},${140 + r() * 40},${70 + r() * 30},${0.08 + r() * 0.22})`;
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    let x = r() * 512;
    let y = -20;
    g.moveTo(x, y);
    while (y < 1044) {
      x += (r() - 0.5) * 70;
      y += 20 + r() * 50;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  return finish(c);
};

/** Soft vertical light shaft for additive god-rays. */
export const shaftTexture = () => {
  const { c, g } = canvas(64, 256);
  const h = g.createLinearGradient(0, 0, 0, 256);
  h.addColorStop(0, "rgba(255,255,255,0.9)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = h;
  g.fillRect(0, 0, 64, 256);
  const v = g.createLinearGradient(0, 0, 64, 0);
  v.addColorStop(0, "rgba(0,0,0,1)");
  v.addColorStop(0.5, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = v;
  g.fillRect(0, 0, 64, 256);
  return finish(c);
};

const CODE = [
  ["async def sync_records(source, since):", "#7fb2ff"],
  ["    batch = await source.fetch(since)", "#d7e3f5"],
  ["    for record in batch:", "#d7e3f5"],
  ["        await queue.publish(record)", "#f5a55a"],
  ["    return len(batch)", "#d7e3f5"],
  ["", ""],
  ["@app.post(\"/orders\", status_code=201)", "#9fd39a"],
  ["def create_order(body: OrderIn):", "#7fb2ff"],
  ["    order = repo.save(body)", "#d7e3f5"],
  ["    bus.emit(\"order.created\", order)", "#f5a55a"],
  ["    return order", "#d7e3f5"],
  ["", ""],
  ["SELECT id, status FROM orders", "#c7a2ff"],
  ["  WHERE updated_at > $1", "#c7a2ff"],
  ["cache.set(key, value, ex=300)", "#9fd39a"],
] as const;

/** A floating code / diagram panel: dark glass with syntax-coloured lines. */
export const codePanelTexture = (seed: number, kind: "code" | "db" | "graph") => {
  const { c, g } = canvas(640, 400);
  const r = rng(seed + 11);
  g.fillStyle = "rgba(10,20,38,0.78)";
  g.fillRect(0, 0, 640, 400);
  g.strokeStyle = "rgba(120,170,255,0.55)";
  g.lineWidth = 3;
  g.strokeRect(2, 2, 636, 396);
  g.fillStyle = "rgba(120,170,255,0.18)";
  g.fillRect(2, 2, 636, 34);
  ["#f06a5a", "#f5b04a", "#5ec26a"].forEach((col, k) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(22 + k * 22, 19, 6, 0, Math.PI * 2);
    g.fill();
  });
  g.font = "20px ui-monospace, Menlo, monospace";
  if (kind === "code") {
    const start = Math.floor(r() * 6);
    for (let i = 0; i < 12; i++) {
      const [txt, col] = CODE[(start + i) % CODE.length];
      if (!txt) continue;
      g.fillStyle = col;
      g.fillText(txt, 22, 70 + i * 26);
    }
  } else if (kind === "db") {
    g.strokeStyle = "#8fbaff";
    g.lineWidth = 4;
    for (let k = 0; k < 3; k++) {
      const cx = 140 + k * 180;
      g.beginPath();
      g.ellipse(cx, 130, 55, 18, 0, 0, Math.PI * 2);
      g.moveTo(cx - 55, 130);
      g.lineTo(cx - 55, 250);
      g.ellipse(cx, 250, 55, 18, 0, Math.PI, 0, true);
      g.lineTo(cx + 55, 130);
      g.stroke();
      g.fillStyle = "#d7e3f5";
      g.fillText(["postgres", "redis", "queue"][k], cx - 42, 310);
    }
  } else {
    const nodes = Array.from({ length: 7 }, () => [60 + r() * 520, 70 + r() * 290]);
    g.strokeStyle = "rgba(143,186,255,0.7)";
    g.lineWidth = 2;
    nodes.forEach(([x, y], i) => {
      const [x2, y2] = nodes[(i + 1 + Math.floor(r() * 3)) % nodes.length];
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x2, y2);
      g.stroke();
    });
    nodes.forEach(([x, y], i) => {
      g.fillStyle = i % 3 === 0 ? "#f5a55a" : "#7fb2ff";
      g.fillRect(x - 22, y - 14, 44, 28);
    });
  }
  return finish(c);
};

/** Sunset sky with layered mountain silhouettes, for the round studio window. */
export const sunsetTexture = () => {
  const { c, g } = canvas(1024, 1024);
  const sky = g.createLinearGradient(0, 0, 0, 1024);
  sky.addColorStop(0, "#5d4a6e");
  sky.addColorStop(0.35, "#c98a86");
  sky.addColorStop(0.58, "#f3b487");
  sky.addColorStop(0.7, "#ffd9a8");
  sky.addColorStop(1, "#8f5d56");
  g.fillStyle = sky;
  g.fillRect(0, 0, 1024, 1024);
  const sun = g.createRadialGradient(620, 640, 10, 620, 640, 260);
  sun.addColorStop(0, "rgba(255,244,214,1)");
  sun.addColorStop(0.2, "rgba(255,222,170,0.7)");
  sun.addColorStop(1, "rgba(255,200,150,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, 1024, 1024);
  const r = rng(3);
  const ridges = [
    ["#b77f7c", 600, 90],
    ["#8f6069", 660, 110],
    ["#6a4656", 730, 130],
    ["#4a3040", 820, 120],
  ] as const;
  for (const [col, base, amp] of ridges) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, 1024);
    let x = 0;
    let y = base;
    g.lineTo(0, y);
    while (x < 1024) {
      x += 40 + r() * 70;
      y = base - r() * amp;
      g.lineTo(x, y);
    }
    g.lineTo(1024, 1024);
    g.closePath();
    g.fill();
  }
  return finish(c);
};
