/**
 * The three worlds. Switching a world changes everything together: the set, the
 * lighting and atmosphere, the character's outfit and animation style, the UI
 * accents and type treatment, and the score. Kept free of three.js so the HUD
 * and the inline boot script can use it.
 */

export type WorldId = "lobby" | "engine" | "dusk";

export interface WorldTheme {
  id: WorldId;
  index: string;
  name: string;
  tagline: string;

  /** Scene atmosphere. Colours are hex strings; the stage eases between worlds. */
  scene: {
    background: string;
    fog: [string, number, number];
    exposure: number;
    bloom: number;
    hemi: [string, string, number];
    key: { color: string; intensity: number; position: [number, number, number] };
    rim: { color: string; intensity: number };
    fill: { color: string; intensity: number };
    floor: { color: string; roughness: number; metalness: number; reflect: number };
    dust: string;
  };

  /** Character: outfit colours and how he carries himself in this world. */
  character: {
    suit: string;
    vest: string;
    shirt: string;
    tie: string;
    square: string;
    shoe: string;
    /** Replaces the plain "idle" stance in this world. */
    idle: "idle" | "confident" | "carry";
    /** Walk cadence (m/s equivalent) when walking in place. */
    walkSpeed: number;
    /** Carries a laptop under the arm. */
    laptop: boolean;
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
    id: "lobby",
    index: "01",
    name: "Gold Lobby",
    tagline: "Where the work is presented",
    scene: {
      background: "#0b0907",
      fog: ["#0b0907", 10, 28],
      exposure: 1.05,
      bloom: 0.62,
      hemi: ["#7a6446", "#0a0806", 0.3],
      key: { color: "#ffd9a3", intensity: 60, position: [2.6, 5.4, 4.2] },
      rim: { color: "#f0a64a", intensity: 3.2 },
      fill: { color: "#b8773a", intensity: 0.8 },
      floor: { color: "#0d0b09", roughness: 0.12, metalness: 0.55, reflect: 0.55 },
      dust: "#f0c27d",
    },
    character: {
      suit: "#1a1715",
      vest: "#16130f",
      shirt: "#efe9df",
      tie: "#0e0d0c",
      square: "#f3eee6",
      shoe: "#0b0a09",
      idle: "confident",
      walkSpeed: 1.2,
      laptop: false,
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
      brightness: 0.35,
      pluckRate: 0.2,
    },
  },
  {
    id: "engine",
    index: "02",
    name: "Engine Room",
    tagline: "Where the systems run",
    scene: {
      background: "#05080f",
      fog: ["#05080f", 9, 26],
      exposure: 1.0,
      bloom: 0.85,
      hemi: ["#2f4e78", "#04060a", 0.34],
      key: { color: "#a9c8ff", intensity: 48, position: [-2.4, 5.6, 4.0] },
      rim: { color: "#f59a3c", intensity: 2.6 },
      fill: { color: "#3f78c9", intensity: 1.1 },
      floor: { color: "#070a10", roughness: 0.18, metalness: 0.6, reflect: 0.5 },
      dust: "#8fb6ff",
    },
    character: {
      suit: "#15161a",
      vest: "#111216",
      shirt: "#e9edf2",
      tie: "#0c0d10",
      square: "#e9edf2",
      shoe: "#08090b",
      idle: "idle",
      walkSpeed: 1.4,
      laptop: false,
    },
    music: {
      bpm: 88,
      chords: [
        { bass: 40, pad: [59, 62, 66, 67] },
        { bass: 36, pad: [55, 59, 62, 67] },
        { bass: 43, pad: [59, 62, 67, 71] },
        { bass: 38, pad: [57, 62, 66, 69] },
      ],
      pluck: [76, 79, 81, 83, 86, 88, 91],
      padWave: "square",
      brightness: 0.55,
      pluckRate: 0.34,
    },
  },
  {
    id: "dusk",
    index: "03",
    name: "Dusk Studio",
    tagline: "Where the ideas start",
    scene: {
      background: "#140d0b",
      fog: ["#1a110d", 11, 30],
      exposure: 1.12,
      bloom: 0.5,
      hemi: ["#e0a88c", "#1a0f0b", 0.45],
      key: { color: "#ffc9a1", intensity: 52, position: [-3.2, 4.8, -2.4] },
      rim: { color: "#ff9d76", intensity: 2.8 },
      fill: { color: "#c98a73", intensity: 0.9 },
      floor: { color: "#1c1411", roughness: 0.28, metalness: 0.35, reflect: 0.38 },
      dust: "#ffcfae",
    },
    character: {
      suit: "#1c1714",
      vest: "#181411",
      shirt: "#f4eee6",
      tie: "#15110f",
      square: "#f4eee6",
      shoe: "#0d0b0a",
      idle: "carry",
      walkSpeed: 1.0,
      laptop: true,
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
];

export const worldById = (id: string | null | undefined) => WORLDS.find((w) => w.id === id) ?? WORLDS[0];

export const WORLD_STORAGE_KEY = "lk-world";
