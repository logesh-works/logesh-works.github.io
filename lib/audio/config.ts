/**
 * Music source.
 *
 * `track: null` plays the original generative score in `ambient.ts` (nothing to
 * download or license). To use a licensed track instead, put the file in
 * /public/audio (a loopable ~128 kbps MP3/OGG keeps it light), set `url`, and the
 * same sound toggle, fades and visual pulses apply to it. Only use audio you hold
 * the rights to.
 */
export interface TrackConfig {
  url: string;
  /** 0 → 1 output gain. */
  volume?: number;
}

export const audioConfig: { track: TrackConfig | null } = {
  track: { url: "/audio/ambient.mp3", volume: 0.8 },
};
