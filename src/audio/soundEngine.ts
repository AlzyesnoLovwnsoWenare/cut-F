import { FruitDef } from '../game/types.ts';

export interface TrackMeta {
  id: number;
  title: string;
  genre: string;
  bpm: number;
  energy: string;
}

export const DEMO_TRACKS: TrackMeta[] = [
  {
    id: 0,
    title: 'Neon Overdrive',
    genre: 'Synthwave Arcade',
    bpm: 128,
    energy: 'High Energy',
  },
  {
    id: 1,
    title: 'Cyber Slice Chill',
    genre: 'Lo-Fi Futurefunk',
    bpm: 105,
    energy: 'Medium Groove',
  },
  {
    id: 2,
    title: 'Hyper Grid Rush',
    genre: 'Arcade Drum & Synth',
    bpm: 144,
    energy: 'Maximum Adrenaline',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  private isMusicPlaying = false;
  private currentTrackIndex = 0;
  private musicInterval: number | null = null;
  private currentStep = 0;

  private musicVolume = 0.6;
  private sfxVolume = 0.8;
  private isMuted = false;

  private bombSizzleOsc: OscillatorNode | null = null;
  private bombSizzleGain: GainNode | null = null;
  private activeBombsCount = 0;

  // Listeners for UI state updates
  private stateChangeCallbacks: Array<(state: { isPlaying: boolean; trackIndex: number }) => void> = [];

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;

      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: (state: { isPlaying: boolean; trackIndex: number }) => void) {
    this.stateChangeCallbacks.push(cb);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    this.stateChangeCallbacks.forEach((cb) =>
      cb({
        isPlaying: this.isMusicPlaying,
        trackIndex: this.currentTrackIndex,
      })
    );
  }

  // --- SOUND EFFECTS ---

  public playSwish() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio safety
    }
  }

  public playSlice(fruitDef?: FruitDef) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Blade Impact (high frequency transient)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const baseFreq = fruitDef?.isSpecial ? 880 : 520 + Math.random() * 200;

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq * 2.2, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.1);

      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);

      osc1.start(now);
      osc1.stop(now + 0.13);

      // 2. Juicy Squelch (modulated lower tone)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(280 + Math.random() * 80, now);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.15);

      gain2.gain.setValueAtTime(0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(now);
      osc2.stop(now + 0.16);

      // 3. Neon Sparkle for special or high point fruits
      if (fruitDef?.isSpecial || fruitDef?.points && fruitDef.points >= 25) {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1046.5, now); // C6
        chime.frequency.setValueAtTime(1318.51, now + 0.05); // E6
        chimeGain.gain.setValueAtTime(0.2, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        chime.connect(chimeGain);
        chimeGain.connect(this.sfxGain);
        chime.start(now);
        chime.stop(now + 0.26);
      }
    } catch {
      // Audio safety
    }
  }

  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C E G C E

      for (let i = 0; i < Math.min(comboCount, 5); i++) {
        const noteTime = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[i] || 1046.5, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      }
    } catch {
      // Audio safety
    }
  }

  public startBombSizzle() {
    this.activeBombsCount++;
    if (this.bombSizzleOsc || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      this.bombSizzleOsc = this.ctx.createOscillator();
      this.bombSizzleGain = this.ctx.createGain();

      this.bombSizzleOsc.type = 'sawtooth';
      this.bombSizzleOsc.frequency.setValueAtTime(180, now);

      this.bombSizzleGain.gain.setValueAtTime(0.05, now);

      this.bombSizzleOsc.connect(this.bombSizzleGain);
      this.bombSizzleGain.connect(this.sfxGain);

      this.bombSizzleOsc.start();
    } catch {
      // Audio safety
    }
  }

  public stopBombSizzle() {
    this.activeBombsCount = Math.max(0, this.activeBombsCount - 1);
    if (this.activeBombsCount === 0 && this.bombSizzleOsc) {
      try {
        this.bombSizzleGain?.gain.linearRampToValueAtTime(0.001, (this.ctx?.currentTime || 0) + 0.05);
        setTimeout(() => {
          this.bombSizzleOsc?.stop();
          this.bombSizzleOsc?.disconnect();
          this.bombSizzleGain?.disconnect();
          this.bombSizzleOsc = null;
          this.bombSizzleGain = null;
        }, 60);
      } catch {
        this.bombSizzleOsc = null;
        this.bombSizzleGain = null;
      }
    }
  }

  public playExplosion() {
    this.stopBombSizzle();
    this.activeBombsCount = 0;
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Sub Bass Drop
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + 0.8);

      subGain.gain.setValueAtTime(0.8, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.82);

      // 2. White Noise Blast
      const bufferSize = this.ctx.sampleRate * 0.6;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.linearRampToValueAtTime(100, now + 0.6);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.62);
    } catch {
      // Audio safety
    }
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio safety
    }
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349, 293]; // A4 G4 F4 D4
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const t = now + idx * 0.16;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch {
      // Audio safety
    }
  }

  public playTimerTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio safety
    }
  }

  // --- BACKGROUND MUSIC ENGINE (3 DEMO TRACKS) ---

  public toggleMusic() {
    if (this.isMusicPlaying) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  public playMusic(trackIndex?: number) {
    this.initContext();
    if (trackIndex !== undefined) {
      this.currentTrackIndex = (trackIndex + DEMO_TRACKS.length) % DEMO_TRACKS.length;
    }

    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }

    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.notify();

    const bpm = DEMO_TRACKS[this.currentTrackIndex].bpm;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th notes

    this.musicInterval = window.setInterval(() => {
      this.tickMusicStep();
    }, stepDurationMs);
  }

  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.notify();
  }

  public nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % DEMO_TRACKS.length;
    this.playMusic(nextIdx);
  }

  public prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length;
    this.playMusic(prevIdx);
  }

  public getTrackMeta(index = this.currentTrackIndex): TrackMeta {
    return DEMO_TRACKS[index] || DEMO_TRACKS[0];
  }

  public getPlaybackState() {
    return {
      isPlaying: this.isMusicPlaying,
      trackIndex: this.currentTrackIndex,
      track: this.getTrackMeta(),
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
    };
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  // Multi-voice synthesizer sequence step
  private tickMusicStep() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;

    try {
      const now = this.ctx.currentTime;
      const step16 = this.currentStep % 16;
      const bar = Math.floor(this.currentStep / 16) % 4;

      if (this.currentTrackIndex === 0) {
        // Track 1: "Neon Overdrive" (128 BPM Synthwave in D Minor)
        // Drums: Four on the floor kick + snare on 4, 12
        if (step16 % 4 === 0) {
          this.synthKick(now, 0.45);
        }
        if (step16 === 4 || step16 === 12) {
          this.synthSnare(now, 0.3);
        }
        if (step16 % 2 === 0) {
          this.synthHiHat(now, step16 % 4 === 2 ? 0.18 : 0.1);
        }

        // Bassline: Rolling 16th notes D minor roots (D1, D2, F, G, A)
        const bassNotes = [73.42, 73.42, 146.83, 73.42, 87.31, 87.31, 98.0, 110.0];
        const bassFreq = bassNotes[(step16 + bar * 2) % bassNotes.length];
        this.synthBass(now, bassFreq, 0.14, 'sawtooth');

        // Arpeggiated Neon Lead on odd steps
        if (step16 % 2 === 1) {
          const arpNotes = [293.66, 349.23, 440.0, 523.25, 587.33, 698.46, 880.0];
          const leadFreq = arpNotes[(step16 + bar * 3) % arpNotes.length];
          this.synthLead(now, leadFreq, 0.09);
        }
      } else if (this.currentTrackIndex === 1) {
        // Track 2: "Cyber Slice Chill" (105 BPM Lo-Fi Cyberfunk in F Minor)
        // Syncopated kick on 0, 6, 10
        if (step16 === 0 || step16 === 6 || step16 === 10) {
          this.synthKick(now, 0.38);
        }
        // Snare / rimshot on 4, 12
        if (step16 === 4 || step16 === 12) {
          this.synthSnare(now, 0.22);
        }
        // Swung hi-hats
        if (step16 % 2 === 1) {
          this.synthHiHat(now, 0.08);
        }

        // Warm sub bass groove
        const fMinorBass = [87.31, 87.31, 103.83, 116.54, 77.78, 87.31];
        if (step16 % 4 === 0 || step16 === 6) {
          this.synthBass(now, fMinorBass[bar % fMinorBass.length], 0.18, 'sine');
        }

        // Mellow cyber pluck
        if (step16 === 2 || step16 === 8 || step16 === 14) {
          const chillPlucks = [349.23, 415.3, 523.25, 622.25];
          this.synthLead(now, chillPlucks[(bar + step16) % chillPlucks.length], 0.08, 'triangle');
        }
      } else {
        // Track 3: "Hyper Grid Rush" (144 BPM Fast Drum'n'Synth in A Minor)
        // Fast breakbeat style kick & snare
        if (step16 === 0 || step16 === 7 || step16 === 10) {
          this.synthKick(now, 0.48);
        }
        if (step16 === 4 || step16 === 12) {
          this.synthSnare(now, 0.35);
        }
        this.synthHiHat(now, step16 % 4 === 2 ? 0.16 : 0.09);

        // Acid pulsating 16th bass
        const aMinorBass = [110.0, 110.0, 220.0, 130.81, 146.83, 164.81];
        this.synthBass(now, aMinorBass[step16 % aMinorBass.length], 0.15, 'sawtooth');

        // Ascending hyper synth runs on bar changes
        if (step16 >= 12) {
          const rushNotes = [440.0, 523.25, 659.25, 880.0];
          this.synthLead(now, rushNotes[step16 - 12], 0.12, 'sawtooth');
        }
      }

      this.currentStep = (this.currentStep + 1) % 64;
    } catch {
      // Audio safety
    }
  }

  // --- SYNTH INSTRUMENTS ---

  private synthKick(now: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.12);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private synthSnare(now: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    // Tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    oscGain.gain.setValueAtTime(vol * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.11);

    // Noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(now);
    noise.stop(now + 0.11);
  }

  private synthHiHat(now: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
    noise.stop(now + 0.05);
  }

  private synthBass(now: number, freq: number, vol: number, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private synthLead(now: number, freq: number, vol: number, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    return array;
  }
}

export const soundEngine = new SoundEngine();
