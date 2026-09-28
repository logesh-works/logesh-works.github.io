import { edges, nodeIndex, nodes, toPortrait } from "./graph";

/** Flat rendering of the hero graph for devices without WebGL or with Save-Data on. */
const StaticGraph = ({ portrait, className }: { portrait: boolean; className?: string }) => {
  const pts = nodes.map((n) => {
    const [x, y] = portrait ? toPortrait(n.pos) : n.pos;
    return { x, y: -y, n };
  });
  const box = portrait ? "-3.6 -4.2 7.2 8.4" : "-5.4 -3.6 10.8 7.2";

  return (
    <svg viewBox={box} className={className} aria-hidden>
      {edges.map(([a, b]) => {
        const p = pts[nodeIndex.get(a)!];
        const q = pts[nodeIndex.get(b)!];
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="rgb(138 124 105 / 0.45)"
            strokeWidth={0.02}
          />
        );
      })}
      {pts.map(({ x, y, n }) =>
        n.shape === "store" ? (
          <ellipse key={n.id} cx={x} cy={y} rx={0.26} ry={0.2} fill="#15181d" stroke="#8a7c69" strokeWidth={0.025} />
        ) : n.shape === "model" ? (
          <polygon
            key={n.id}
            points={`${x},${y - 0.28} ${x + 0.26},${y + 0.18} ${x - 0.26},${y + 0.18}`}
            fill="#15181d"
            stroke="#8a7c69"
            strokeWidth={0.025}
          />
        ) : (
          <rect
            key={n.id}
            x={x - 0.24}
            y={y - 0.2}
            width={0.48}
            height={0.4}
            rx={0.05}
            fill="#15181d"
            stroke={n.shape === "queue" ? "#dea45a" : "#8a7c69"}
            strokeWidth={0.025}
          />
        )
      )}
    </svg>
  );
};

export default StaticGraph;
