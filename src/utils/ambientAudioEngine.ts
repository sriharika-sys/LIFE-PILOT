import { AmbientSoundPreset } from '../types/index.ts';

export interface AmbientPresetMeta {
  id: AmbientSoundPreset;
  label: string;
  description: string;
}

export const AMBIENT_SOUND_PRESETS: AmbientPresetMeta[] = [
  {
    id: 'piano',
    label: 'Calm Piano',
    description: 'Warm synthesized harmonic chords & gentle arpeggios',
  },
  {
    id: 'serene',
    label: 'Serene Instrumental',
    description: 'Soft felt piano melody layered with warm strings & gentle flute pad',
  },
  {
    id: 'rain',
    label: 'Rain Sounds',
    description: 'Soft filtered rainfall texture with subtle droplets',
  },
  {
    id: 'nature',
    label: 'Nature Breeze',
    description: 'Gentle wind rustle with soft ambient harmonic chimes',
  },
  {
    id: 'noise',
    label: 'Soft Ambient Noise',
    description: 'Smooth warm brown-pink noise floor for deep focus',
  },
];

type CleanupFn = () => void;

/**
 * Offline Web Audio API soundscape generator.
 * Never auto-creates AudioContext on import or mount; initializes only inside explicit user play actions.
 */
export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private cleanupActivePreset: CleanupFn | null = null;
  private currentPreset: AmbientSoundPreset = 'piano';
  private playing = false;
  private volume = 0.55; // 0..1
  private muted = false;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  }

  private ensureContext(): AudioContext {
    if (!AmbientAudioEngine.isSupported()) {
      throw new Error('Web Audio API is not supported in this browser.');
    }
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public async play(preset: AmbientSoundPreset, volumePercent: number, muted: boolean): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volumePercent / 100));
    this.muted = muted;

    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop any previous preset nodes cleanly before starting new graph
    this.teardownPresetNodes();
    this.currentPreset = preset;

    if (this.masterGain) {
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, this.muted ? 0.001 : this.volume),
        now + 0.35
      );
      if (this.muted) {
        this.masterGain.gain.setValueAtTime(0, now + 0.36);
      }
    }

    switch (preset) {
      case 'piano':
        this.cleanupActivePreset = this.startCalmPiano(ctx);
        break;
      case 'serene':
        this.cleanupActivePreset = this.startSereneInstrumental(ctx);
        break;
      case 'rain':
        this.cleanupActivePreset = this.startRain(ctx);
        break;
      case 'nature':
        this.cleanupActivePreset = this.startNature(ctx);
        break;
      case 'noise':
        this.cleanupActivePreset = this.startSoftAmbientNoise(ctx);
        break;
    }

    this.playing = true;
  }

  public async pause(): Promise<void> {
    this.playing = false;
    this.teardownPresetNodes();
    if (this.ctx && this.ctx.state === 'running') {
      try {
        await this.ctx.suspend();
      } catch {
        // Ignore suspend errors on closed/unavailable context
      }
    }
  }

  public stop(): void {
    this.playing = false;
    this.teardownPresetNodes();
  }

  public setVolume(volumePercent: number, muted: boolean): void {
    this.volume = Math.max(0, Math.min(1, volumePercent / 100));
    this.muted = muted;

    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this.muted ? 0 : this.volume;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.04);
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public getPreset(): AmbientSoundPreset {
    return this.currentPreset;
  }

  public dispose(): void {
    this.stop();
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Ignore
      }
      this.masterGain = null;
    }
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // Ignore
      }
      this.ctx = null;
    }
  }

  private teardownPresetNodes(): void {
    if (this.cleanupActivePreset) {
      try {
        this.cleanupActivePreset();
      } catch {
        // Ignore cleanup errors
      }
      this.cleanupActivePreset = null;
    }
  }

  private createNoiseBuffer(ctx: AudioContext, seconds = 4, kind: 'pink' | 'brown' = 'pink'): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (kind === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.0;
      }
    } else {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    return buffer;
  }

  /**
   * 1. Calm Piano-style Ambient: Soft pentatonic notes with warm lowpass filter & slow decay
   */
  private startCalmPiano(ctx: AudioContext): CleanupFn {
    if (!this.masterGain) return () => {};

    const subMix = ctx.createGain();
    subMix.gain.value = 0.45;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    lp.Q.value = 0.7;

    subMix.connect(lp);
    lp.connect(this.masterGain);

    // C major 9 / F major 7 / A minor 7 gentle voicings in Hz
    const chords = [
      [261.63, 329.63, 392.0, 587.33],
      [220.0, 261.63, 329.63, 493.88],
      [174.61, 220.0, 261.63, 392.0],
      [196.0, 246.94, 293.66, 440.0],
    ];
    let step = 0;
    const activeOscs = new Set<OscillatorNode>();
    let disposed = false;

    const triggerNote = (freq: number, delaySec: number, gainPeak: number, durationSec: number) => {
      if (disposed) return;
      const startTime = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const harmOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(freq * 2, startTime);

      const harmGain = ctx.createGain();
      harmGain.gain.value = 0.22;

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      osc.connect(noteGain);
      harmOsc.connect(harmGain);
      harmGain.connect(noteGain);
      noteGain.connect(subMix);

      activeOscs.add(osc);
      activeOscs.add(harmOsc);

      osc.onended = () => {
        activeOscs.delete(osc);
        try {
          osc.disconnect();
          noteGain.disconnect();
        } catch {
          // Ignore
        }
      };
      harmOsc.onended = () => {
        activeOscs.delete(harmOsc);
        try {
          harmOsc.disconnect();
          harmGain.disconnect();
        } catch {
          // Ignore
        }
      };

      osc.start(startTime);
      harmOsc.start(startTime);
      osc.stop(startTime + durationSec + 0.05);
      harmOsc.stop(startTime + durationSec + 0.05);
    };

    const playChordCycle = () => {
      const chord = chords[step % chords.length];
      step += 1;
      chord.forEach((freq, i) => {
        triggerNote(freq, i * 0.42, i === 0 ? 0.24 : 0.16, 3.6);
      });
    };

    playChordCycle();
    const intervalId = window.setInterval(playChordCycle, 4200);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      activeOscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          // Ignore
        }
      });
      activeOscs.clear();
      try {
        subMix.disconnect();
        lp.disconnect();
      } catch {
        // Ignore
      }
    };
  }

  /**
   * 1b. Serene Instrumental: Soft felt-piano melody + warm strings/flute pad with slow peaceful progression
   */
  private startSereneInstrumental(ctx: AudioContext): CleanupFn {
    if (!this.masterGain) return () => {};

    const subMix = ctx.createGain();
    subMix.gain.value = 0.42;

    const warmFilter = ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.value = 1280;
    warmFilter.Q.value = 0.55;

    // Subtle slow filter breathing for natural acoustic warmth
    const filterLfo = ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.08;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 180;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(warmFilter.frequency);
    filterLfo.start();

    subMix.connect(warmFilter);
    warmFilter.connect(this.masterGain);

    // D major 9 -> Aadd9/C# -> B minor 7 -> G major 9 (frequencies in Hz)
    const progression = [
      {
        pad: [146.83, 220.0, 293.66, 369.99], // D3, A3, D4, F#4
        melody: [587.33, 659.25, 739.99, 587.33], // D5, E5, F#5, D5
        flute: 739.99, // F#5
      },
      {
        pad: [138.59, 220.0, 277.18, 329.63], // C#3, A3, C#4, E4
        melody: [659.25, 587.33, 493.88, 554.37], // E5, D5, B4, C#5
        flute: 659.25, // E5
      },
      {
        pad: [123.47, 196.0, 293.66, 369.99], // B2, G3, D4, F#4
        melody: [493.88, 587.33, 659.25, 587.33], // B4, D5, E5, D5
        flute: 587.33, // D5
      },
      {
        pad: [98.0, 196.0, 246.94, 329.63], // G2, G3, B3, E4
        melody: [440.0, 493.88, 587.33, 440.0], // A4, B4, D5, A4
        flute: 880.0, // A5
      },
    ];

    const activeOscs = new Set<OscillatorNode>();
    let disposed = false;
    let barIndex = 0;

    const triggerPadVoice = (freq: number, durationSec: number, peakGain: number) => {
      if (disposed) return;
      const startTime = ctx.currentTime;
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      const voiceFilter = ctx.createBiquadFilter();

      // Dual slightly-detuned soft voices for warm strings pad texture
      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(freq, startTime);
      oscA.detune.setValueAtTime(-4, startTime);

      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(freq, startTime);
      oscB.detune.setValueAtTime(4, startTime);

      const oscBGain = ctx.createGain();
      oscBGain.gain.value = 0.25;

      voiceFilter.type = 'lowpass';
      voiceFilter.frequency.value = 820;

      // Smooth fade-in and fade-out envelope (no clicks or abrupt jumps)
      voiceGain.gain.setValueAtTime(0.0001, startTime);
      voiceGain.gain.linearRampToValueAtTime(peakGain, startTime + 1.8);
      voiceGain.gain.setValueAtTime(peakGain, startTime + Math.max(2.0, durationSec - 2.2));
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      oscA.connect(voiceFilter);
      oscB.connect(oscBGain);
      oscBGain.connect(voiceFilter);
      voiceFilter.connect(voiceGain);
      voiceGain.connect(subMix);

      activeOscs.add(oscA);
      activeOscs.add(oscB);

      const cleanup = () => {
        activeOscs.delete(oscA);
        activeOscs.delete(oscB);
        try {
          oscA.disconnect();
          oscB.disconnect();
          oscBGain.disconnect();
          voiceFilter.disconnect();
          voiceGain.disconnect();
        } catch {
          // Ignore
        }
      };

      oscA.onended = cleanup;

      oscA.start(startTime);
      oscB.start(startTime);
      oscA.stop(startTime + durationSec + 0.05);
      oscB.stop(startTime + durationSec + 0.05);
    };

    const triggerSoftPianoNote = (freq: number, delaySec: number, peakGain: number, durationSec: number) => {
      if (disposed) return;
      const startTime = ctx.currentTime + delaySec;
      const bodyOsc = ctx.createOscillator();
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      const noteGain = ctx.createGain();

      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(freq, startTime);

      overtoneOsc.type = 'triangle';
      overtoneOsc.frequency.setValueAtTime(freq * 2, startTime);
      overtoneGain.gain.value = 0.14;

      // Felt-piano soft hammer attack & warm decay
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.35, startTime + 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      bodyOsc.connect(noteGain);
      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(subMix);

      activeOscs.add(bodyOsc);
      activeOscs.add(overtoneOsc);

      bodyOsc.onended = () => {
        activeOscs.delete(bodyOsc);
        activeOscs.delete(overtoneOsc);
        try {
          bodyOsc.disconnect();
          overtoneOsc.disconnect();
          overtoneGain.disconnect();
          noteGain.disconnect();
        } catch {
          // Ignore
        }
      };

      bodyOsc.start(startTime);
      overtoneOsc.start(startTime);
      bodyOsc.stop(startTime + durationSec + 0.05);
      overtoneOsc.stop(startTime + durationSec + 0.05);
    };

    const triggerFluteSwell = (freq: number, delaySec: number, durationSec: number) => {
      if (disposed) return;
      const startTime = ctx.currentTime + delaySec;
      const fluteOsc = ctx.createOscillator();
      const vibratoOsc = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const fluteGain = ctx.createGain();

      fluteOsc.type = 'sine';
      fluteOsc.frequency.setValueAtTime(freq, startTime);

      // Gentle expressive flute vibrato
      vibratoOsc.type = 'sine';
      vibratoOsc.frequency.setValueAtTime(4.3, startTime);
      vibratoGain.gain.setValueAtTime(0.001, startTime);
      vibratoGain.gain.linearRampToValueAtTime(2.6, startTime + 0.8);
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(fluteOsc.frequency);

      fluteGain.gain.setValueAtTime(0.0001, startTime);
      fluteGain.gain.linearRampToValueAtTime(0.065, startTime + 0.9);
      fluteGain.gain.setValueAtTime(0.06, startTime + Math.max(1.2, durationSec - 1.1));
      fluteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      fluteOsc.connect(fluteGain);
      fluteGain.connect(subMix);

      activeOscs.add(fluteOsc);
      activeOscs.add(vibratoOsc);

      fluteOsc.onended = () => {
        activeOscs.delete(fluteOsc);
        activeOscs.delete(vibratoOsc);
        try {
          fluteOsc.disconnect();
          vibratoOsc.disconnect();
          vibratoGain.disconnect();
          fluteGain.disconnect();
        } catch {
          // Ignore
        }
      };

      fluteOsc.start(startTime);
      vibratoOsc.start(startTime);
      fluteOsc.stop(startTime + durationSec + 0.05);
      vibratoOsc.stop(startTime + durationSec + 0.05);
    };

    const playBar = () => {
      const bar = progression[barIndex % progression.length];
      barIndex += 1;

      // Sustained warm strings pad with generous overlap
      bar.pad.forEach((freq, idx) => {
        triggerPadVoice(freq, 7.2, idx === 0 ? 0.14 : 0.095);
      });

      // Sparse gentle felt-piano melody across the 6.4s bar
      bar.melody.forEach((freq, idx) => {
        triggerSoftPianoNote(freq, 0.35 + idx * 1.45, idx === 0 ? 0.17 : 0.13, 3.2);
      });

      // Soft airy flute counter-tone entering gently mid-bar
      triggerFluteSwell(bar.flute, 2.2, 3.8);
    };

    playBar();
    const intervalId = window.setInterval(playBar, 6400);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      activeOscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          // Ignore
        }
      });
      activeOscs.clear();
      try {
        filterLfo.stop();
        filterLfo.disconnect();
        filterLfoGain.disconnect();
        subMix.disconnect();
        warmFilter.disconnect();
      } catch {
        // Ignore
      }
    };
  }

  /**
   * 2. Rain Sounds: Layered pink-noise rainfall + gentle LFO droplet modulation
   */
  private startRain(ctx: AudioContext): CleanupFn {
    if (!this.masterGain) return () => {};

    const noiseBuf = this.createNoiseBuffer(ctx, 5, 'pink');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuf;
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1150;
    bp.Q.value = 0.55;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.55;

    // Gentle LFO breathing on rain intensity
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(rainGain.gain);

    source.connect(bp);
    bp.connect(lp);
    lp.connect(rainGain);
    rainGain.connect(this.masterGain);

    source.start();
    lfo.start();

    return () => {
      try {
        source.stop();
        lfo.stop();
        source.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
        bp.disconnect();
        lp.disconnect();
        rainGain.disconnect();
      } catch {
        // Ignore
      }
    };
  }

  /**
   * 3. Nature Breeze: Soft wind through leaves + occasional gentle harmonic chirps/chimes
   */
  private startNature(ctx: AudioContext): CleanupFn {
    if (!this.masterGain) return () => {};

    const noiseBuf = this.createNoiseBuffer(ctx, 5, 'pink');
    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuf;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 480;
    windFilter.Q.value = 1.1;

    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.12;
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 180;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.value = 0.38;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);

    windSource.start();
    windLfo.start();

    let disposed = false;
    const activeOscs = new Set<OscillatorNode>();
    const chirpNotes = [1174.66, 1318.51, 1567.98, 1760.0];

    const triggerChirp = () => {
      if (disposed || !this.masterGain) return;
      const now = ctx.currentTime;
      const baseFreq = chirpNotes[Math.floor(Math.random() * chirpNotes.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.96, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);
      activeOscs.add(osc);
      osc.onended = () => {
        activeOscs.delete(osc);
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };

      osc.start(now);
      osc.stop(now + 0.26);
    };

    const intervalId = window.setInterval(triggerChirp, 3400);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      activeOscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          // Ignore
        }
      });
      activeOscs.clear();
      try {
        windSource.stop();
        windLfo.stop();
        windSource.disconnect();
        windLfo.disconnect();
        windLfoGain.disconnect();
        windFilter.disconnect();
        windGain.disconnect();
      } catch {
        // Ignore
      }
    };
  }

  /**
   * 4. Soft Ambient Noise: Warm brown noise bed with gentle lowpass shelf
   */
  private startSoftAmbientNoise(ctx: AudioContext): CleanupFn {
    if (!this.masterGain) return () => {};

    const noiseBuf = this.createNoiseBuffer(ctx, 5, 'brown');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuf;
    source.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.65;

    source.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);

    source.start();

    return () => {
      try {
        source.stop();
        source.disconnect();
        lp.disconnect();
        gain.disconnect();
      } catch {
        // Ignore
      }
    };
  }
}
