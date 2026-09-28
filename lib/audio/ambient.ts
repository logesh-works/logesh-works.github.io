/**
 * Original generative ambient score, synthesised live with the Web Audio API.
 * No audio files are downloaded, so nothing is copyrighted and nothing blocks loading.
 *
 * Layers: a slow cinematic minor pad, a sub bass, a soft half-time heartbeat,
 * airy filtered noise, and sparse delayed plucks. Plucks and heartbeats call
 * `onAccent` so the visuals can pulse in time with the music.
 */

import { audioConfig } from "./config";

const BPM = 72;
const EIGHTH = 60 / BPM / 2;
const STEPS_PER_CHORD = 16; // two bars

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// D minor → Bb → F → C: dark, wide, resolved-but-open.
const CHORDS = [
  { bass: 38, pad: [57, 60, 64, 65] },
  { bass: 34, pad: [58, 62, 65, 69] },
  { bass: 41, pad: [57, 60, 64, 67] },
  { bass: 36, pad: [55, 62, 64, 67] },
];
const PLUCK_SCALE = [74, 77, 79, 81, 84, 86, 89];

type AccentKind = "pluck" | "beat" | "chord";

class Ambient {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private analyser!: AnalyserNode;
  private padFilter!: BiquadFilterNode;
  private padBus!: GainNode;
  private pluckBus!: GainNode;
  private reverb!: ConvolverNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private raf = 0;
  private step = 0;
  private nextTime = 0;
  private depth = 0;
  private levelBuf: Float32Array | null = null;
  private metering = false;
  private track: HTMLAudioElement | null = null;
  private lastOnset = 0;
  private smoothed = 0;

  onAccent: ((kind: AccentKind) => void) | null = null;
  onLevel: ((level: number) => void) | null = null;

  get running() {
    return this.ctx?.state === "running";
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  async start() {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    if (ctx.state !== "running") await ctx.resume();
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.9, now + 2.5);
    if (audioConfig.track) {
      // Licensed track mode: stream the file through the same master, meter and fades.
      if (!this.track) {
        const el = new Audio(audioConfig.track.url);
        el.loop = true;
        el.preload = "auto";
        el.crossOrigin = "anonymous";
        const gain = ctx.createGain();
        gain.gain.value = audioConfig.track.volume ?? 0.8;
        ctx.createMediaElementSource(el).connect(gain).connect(this.master);
        this.track = el;
      }
      await this.track.play();
    } else if (this.timer === null) {
      this.nextTime = ctx.currentTime + 0.1;
      this.timer = window.setInterval(() => this.schedule(), 50);
    }
    if (!this.metering) this.meter();
  }

  async stop() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.6);
    await new Promise((r) => window.setTimeout(r, 650));
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.track?.pause();
    cancelAnimationFrame(this.raf);
    this.metering = false;
    this.smoothed = 0;
    this.onLevel?.(0);
    await ctx.suspend();
  }

  /** 0 at the top of the page → 1 at the end: the pad opens up as you go deeper. */
  setDepth(d: number) {
    this.depth = Math.min(Math.max(d, 0), 1);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.padFilter.frequency.setTargetAtTime(420 + this.depth * 1900, t, 0.8);
  }

  /** A soft filtered-noise swell, played on chapter changes. */
  whoosh() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(260, t);
    band.frequency.exponentialRampToValueAtTime(2600, t + 1.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.7);
    g.gain.linearRampToValueAtTime(0, t + 1.4);
    src.connect(band).connect(g);
    g.connect(this.master);
    g.connect(this.reverb);
    src.start(t, Math.random() * 2);
    src.stop(t + 1.5);
  }

  private build() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = (this.ctx = new AC({ latencyHint: "playback" }));

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.master.connect(comp).connect(this.analyser).connect(ctx.destination);

    // Generated stereo impulse response: a long, dark hall.
    const len = ctx.sampleRate * 4.5;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // Pad bus with a slowly breathing low-pass.
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = 420;
    this.padFilter.Q.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 260;
    lfo.connect(lfoAmt).connect(this.padFilter.frequency);
    lfo.start();
    this.padBus = ctx.createGain();
    this.padBus.gain.value = 0.075;
    this.padFilter.connect(this.padBus);
    this.padBus.connect(this.master);
    this.padBus.connect(this.reverb);

    // Plucks go through a dotted-eighth delay into the hall.
    this.pluckBus = ctx.createGain();
    this.pluckBus.gain.value = 0.11;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = EIGHTH * 1.5;
    const fb = ctx.createGain();
    fb.gain.value = 0.36;
    const fbTone = ctx.createBiquadFilter();
    fbTone.type = "lowpass";
    fbTone.frequency.value = 2400;
    this.pluckBus.connect(this.master);
    this.pluckBus.connect(delay);
    delay.connect(fbTone).connect(fb).connect(delay);
    fbTone.connect(this.reverb);
    fbTone.connect(this.master);

    // Air: quiet band-passed noise bed.
    const air = ctx.createBufferSource();
    air.buffer = this.noise;
    air.loop = true;
    const airBand = ctx.createBiquadFilter();
    airBand.type = "bandpass";
    airBand.frequency.value = 5200;
    airBand.Q.value = 0.8;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.01;
    air.connect(airBand).connect(airGain).connect(this.master);
    air.start();

    document.addEventListener("visibilitychange", () => {
      if (!this.ctx || (this.timer === null && !this.track)) return;
      if (document.hidden) this.ctx.suspend();
      else this.ctx.resume();
    });
  }

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += EIGHTH;
      this.step++;
    }
  }

  private playStep(step: number, t: number) {
    const local = step % STEPS_PER_CHORD;
    const chord = CHORDS[Math.floor(step / STEPS_PER_CHORD) % CHORDS.length];
    const chordLen = STEPS_PER_CHORD * EIGHTH;

    if (local === 0) {
      chord.pad.forEach((n) => this.padVoice(midi(n), t, chordLen));
      this.bassVoice(midi(chord.bass), t, chordLen);
      this.accent("chord", t);
    }
    // Half-time heartbeat on beats 1 and 3.
    if (local % 8 === 0 || local % 8 === 4) {
      if (local % 8 === 0 || this.depth > 0.35) {
        this.heartbeat(t, local % 8 === 0 ? 1 : 0.55);
        this.accent("beat", t);
      }
    }
    const chance = 0.18 + this.depth * 0.22;
    if (local % 2 === 1 ? Math.random() < chance * 0.5 : Math.random() < chance) {
      const n = PLUCK_SCALE[Math.floor(Math.random() * PLUCK_SCALE.length)];
      this.pluck(midi(n), t);
      this.accent("pluck", t);
    }
  }

  private padVoice(freq: number, t: number, len: number) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 2.4);
    env.gain.setValueAtTime(1, t + len - 0.2);
    env.gain.linearRampToValueAtTime(0, t + len + 2.8);
    env.connect(this.padFilter);
    for (const detune of [-8, 7]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(env);
      o.start(t);
      o.stop(t + len + 3);
    }
  }

  private bassVoice(freq: number, t: number, len: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 1.5);
    g.gain.setValueAtTime(0.16, t + len - 0.2);
    g.gain.linearRampToValueAtTime(0, t + len + 1.5);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + len + 1.6);
  }

  private heartbeat(t: number, amount: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(78, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.32 * amount, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.6);
  }

  private pluck(freq: number, t: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    g.connect(this.pluckBus);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    o.start(t);
    o2.start(t);
    o.stop(t + 1.5);
    o2.stop(t + 1.5);
  }

  private accent(kind: AccentKind, t: number) {
    const delay = Math.max(0, (t - this.ctx!.currentTime) * 1000);
    window.setTimeout(() => this.onAccent?.(kind), delay);
  }

  private meter() {
    this.metering = true;
    const tick = () => {
      if (!this.levelBuf) this.levelBuf = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(this.levelBuf);
      let sum = 0;
      for (let i = 0; i < this.levelBuf.length; i++) sum += this.levelBuf[i] * this.levelBuf[i];
      const rms = Math.sqrt(sum / this.levelBuf.length);
      const level = Math.min(rms * 5, 1);
      // With a recorded track there is no score to read accents from: detect onsets instead.
      if (this.track && level > this.smoothed * 1.35 + 0.05 && performance.now() - this.lastOnset > 260) {
        this.lastOnset = performance.now();
        this.onAccent?.("pluck");
      }
      this.smoothed += (level - this.smoothed) * 0.12;
      this.onLevel?.(this.smoothed);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
}

export const ambient = new Ambient();
export type { AccentKind };
