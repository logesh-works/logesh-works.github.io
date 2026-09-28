/**
 * The hero system graph. Each node belongs to one of the stack layers shown in the
 * "System stack" section, so hovering the 3D graph reads out real skills rather
 * than decoration. Coordinates are for the landscape layout (pipeline left → right).
 */

export type LayerId = "client" | "api" | "async" | "data" | "intelligence";
export type NodeShape = "screen" | "service" | "queue" | "store" | "model";

export interface GraphNode {
  id: string;
  layer: LayerId;
  shape: NodeShape;
  pos: [number, number, number];
}

/** Order in which layers assemble during the intro (the "idea → system" build). */
export const layerOrder: LayerId[] = ["client", "api", "intelligence", "async", "data"];

export const nodes: GraphNode[] = [
  { id: "c1", layer: "client", shape: "screen", pos: [-4.2, 1.3, 0.4] },
  { id: "c2", layer: "client", shape: "screen", pos: [-4.4, 0, -0.6] },
  { id: "c3", layer: "client", shape: "screen", pos: [-4.2, -1.3, 0.3] },

  { id: "a1", layer: "api", shape: "service", pos: [-1.5, 0.75, 0] },
  { id: "a2", layer: "api", shape: "service", pos: [-1.5, -0.85, 0.5] },

  { id: "m1", layer: "intelligence", shape: "model", pos: [-0.3, 2.55, -0.8] },
  { id: "m2", layer: "intelligence", shape: "model", pos: [0.9, 2.85, 0.3] },

  { id: "q1", layer: "async", shape: "queue", pos: [1.3, -0.05, -0.2] },
  { id: "w1", layer: "async", shape: "service", pos: [1.5, 1.45, 0.6] },
  { id: "w2", layer: "async", shape: "service", pos: [1.5, -1.5, 0.4] },

  { id: "d1", layer: "data", shape: "store", pos: [4.2, 1.05, -0.2] },
  { id: "d2", layer: "data", shape: "store", pos: [4.4, -0.3, 0.6] },
  { id: "d3", layer: "data", shape: "store", pos: [4.2, -1.55, -0.5] },
];

/** Directed edges: events always flow from the first node to the second. */
export const edges: [string, string][] = [
  ["c1", "a1"],
  ["c2", "a1"],
  ["c2", "a2"],
  ["c3", "a2"],
  ["a1", "q1"],
  ["a2", "q1"],
  ["a1", "m1"],
  ["m1", "m2"],
  ["m2", "w1"],
  ["q1", "w1"],
  ["q1", "w2"],
  ["a2", "w2"],
  ["w1", "d1"],
  ["w1", "d2"],
  ["q1", "d2"],
  ["w2", "d2"],
  ["w2", "d3"],
];

export const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));

/** Portrait screens run the pipeline top → bottom instead of left → right. */
export const toPortrait = ([x, y, z]: [number, number, number]): [number, number, number] => [
  -y * 0.95,
  -x * 0.8,
  z,
];
