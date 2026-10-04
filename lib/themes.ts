/**
 * The three worlds. Switching a world changes everything together: the set, the
 * lighting and atmosphere, the character, the UI accents and type treatment, and
 * the score. Kept free of three.js so the HUD and the inline boot script can use it.
 */

export type WorldId = "space" | "anime" | "village";

export interface WorldTheme {
  id: WorldId;
  index: string;
  name: string;

  /** Scene atmosphere. Colours are hex strings. */
  scene: {
    background: string;
    fog: [string, number, number];
    exposure: number;
    bloom: number;
    hemi: [string, string, number];
    key: { color: string; intensity: number; position: [number, number, number] };
    rim: { color: string; intensity: number };
    fill: { color: string; intensity: number };
    /** `hidden`: the set brings its own ground (e.g. terrain that curves away), so the stage draws none. */
    floor: { color: string; roughness: number; metalness: number; reflect: number; hidden?: boolean };
    dust: string;
    /** Darkening toward the frame edges, 0 → 1. */
    vignette: number;
  };

  /** Score: chord set (MIDI), pluck scale, tempo and colour of the pad. */
  music: {
    bpm: number;
    chords: { bass: number; pad: number[] }[];
    pluck: number[];
    padWave: OscillatorType;
    brightness: number;
    pluckRate: number;
  };
}

export const WORLDS: WorldTheme[] = [
  {
    id: "space",
    index: "01",
    name: "Logesh",
    scene: {
      // The ruined Temple of Olympian Zeus adrift in open space: weathered marble in
      // soft starlight, a few fires, the Milky Way and a black hole overhead. Clear,
      // so the sky reads. The set brings its own starlight, fires and ground.
      background: "#020308",
      fog: ["#03040a", 60, 320],
      exposure: 0.92,
      bloom: 0.6,
      vignette: 0.55,
      hemi: ["#8496c8", "#0c0a10", 0.16],
      key: { color: "#e6ecff", intensity: 11, position: [2.4, 6.0, 3.6] },
      rim: { color: "#ffc48a", intensity: 2.2 },
      fill: { color: "#8fa6e0", intensity: 0.5 },
      floor: { color: "#020203", roughness: 0.95, metalness: 0, reflect: 0, hidden: true },
      dust: "#c8d4f0",
    },
    music: {
      bpm: 72,
      chords: [
        { bass: 38, pad: [57, 60, 64, 65] },
        { bass: 34, pad: [58, 62, 65, 69] },
        { bass: 41, pad: [57, 60, 64, 67] },
        { bass: 36, pad: [55, 62, 64, 67] },
      ],
      pluck: [74, 77, 79, 81, 84, 86, 89],
      padWave: "sawtooth",
      brightness: 0.4,
      pluckRate: 0.2,
    },
  },
  {
    id: "village",
    index: "02",
    name: "Old Village",
    scene: {
      // A South Indian village deep in the night: cool moonlight, the Milky Way overhead,
      // and only oil lamps and windows for warmth. Haze swallows the distance. The set
      // brings its own ground, moon and lamps.
      background: "#02030a",
      fog: ["#070a14", 14, 62],
      exposure: 0.95,
      bloom: 0.55,
      hemi: ["#5d6f9e", "#0c0906", 0.2],
      key: { color: "#b4c4ef", intensity: 6, position: [-3.0, 4.6, 3.2] },
      rim: { color: "#8fa6ff", intensity: 2.6 },
      fill: { color: "#ff9a50", intensity: 0.7 },
      floor: { color: "#3a2e22", roughness: 0.92, metalness: 0, reflect: 0, hidden: true },
      dust: "#ffd27a",
      vignette: 0.55,
    },
    music: {
      bpm: 64,
      chords: [
        { bass: 41, pad: [57, 60, 64, 67] },
        { bass: 38, pad: [57, 60, 62, 65] },
        { bass: 34, pad: [58, 62, 65, 69] },
        { bass: 36, pad: [55, 60, 64, 67] },
      ],
      pluck: [72, 76, 77, 79, 81, 84, 88],
      padWave: "triangle",
      brightness: 0.25,
      pluckRate: 0.14,
    },
  },
  {
    id: "anime",
    index: "03",
    name: "Mita",
    scene: {
      // A Shibuya-style crossing at night: neon on wet asphalt, city glow in the sky.
      // A clean, cool-white key keeps the character crisp against the colour; magenta
      // and cyan rims cut her out of the dark. The set brings its own street and lights.
      background: "#030209",
      fog: ["#07041a", 18, 80],
      exposure: 0.82,
      bloom: 0.8,
      hemi: ["#5a4fc0", "#08040c", 0.16],
      key: { color: "#fff6fb", intensity: 17, position: [-2.6, 5.8, 4.2] },
      rim: { color: "#ff4fd8", intensity: 3.8 },
      fill: { color: "#36d6ff", intensity: 0.8 },
      floor: { color: "#0c0b10", roughness: 0.3, metalness: 0.1, reflect: 0, hidden: true },
      dust: "#ff9ad5",
      vignette: 0.6,
    },
    music: {
      bpm: 88,
      chords: [
        { bass: 41, pad: [60, 64, 67, 72] },
        { bass: 43, pad: [59, 62, 67, 71] },
        { bass: 45, pad: [60, 64, 69, 72] },
        { bass: 40, pad: [59, 64, 67, 71] },
      ],
      pluck: [76, 79, 81, 84, 86, 88, 91],
      padWave: "triangle",
      brightness: 0.6,
      pluckRate: 0.34,
    },
  },
];

export const WORLD_STORAGE_KEY = "lk-world";
