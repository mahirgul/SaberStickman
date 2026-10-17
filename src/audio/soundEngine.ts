/**
 * Web Audio API procedural synthesizer for high-energy Cyberpunk Synthwave music and SFX.
 * Features full multitrack synth: punchy kick, noise snare, 16th-note rolling bass,
 * warm analog chord pads, dynamic lead arpeggio, accelerating tempo engine, and lightsaber sound effects.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private saberHumOsc: OscillatorNode | null = null;
  private saberHumGain: GainNode | null = null;

  private isMuted: boolean = false;
  private volume: number = 0.75;
  private isMusicRunning: boolean = false;
  private musicTimeoutId: number | null = null;

  private currentBpm: number = 124;
  private targetBpm: number = 124;
  private step: number = 0;

  // Chord progression: Dm -> Bb -> F -> C
  private chordRootNotes = [146.83, 116.54, 174.61, 130.81]; // D3, Bb2, F3, C3
  private melodyScale = [293.66, 329.63, 349.23, 392.0, 440.0, 523.25, 587.33, 659.25]; // D minor pentatonic/diatonic

  constructor() {
    // Audio context will unlock on first user click/touch/keypress
    const unlockAudio = () => {
      this.initCtx();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  public initCtx() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public getVolume() {
    return this.volume;
  }

  // Smoothly increases tempo from 124 BPM up to 160 BPM
  public setTempo(intensity: number) {
    const clamped = Math.max(0, Math.min(1, intensity));
    this.targetBpm = Math.floor(124 + clamped * 36);
  }

  public startMusic() {
    this.initCtx();
    if (this.isMusicRunning) return;
    this.isMusicRunning = true;
    this.step = 0;
    this.scheduleNextStep();
  }

  public stopMusic() {
    this.isMusicRunning = false;
    if (this.musicTimeoutId !== null) {
      window.clearTimeout(this.musicTimeoutId);
      this.musicTimeoutId = null;
    }
    this.stopSaberHum();
  }

  private scheduleNextStep() {
    if (!this.isMusicRunning || !this.ctx) return;

    // Smooth tempo ramp
    this.currentBpm += (this.targetBpm - this.currentBpm) * 0.08;
    const beatSeconds = 60 / this.currentBpm;
    const sixteenthSeconds = beatSeconds / 4;

    this.playStep(this.step, this.ctx.currentTime);
    this.step = (this.step + 1) % 64;

    this.musicTimeoutId = window.setTimeout(() => {
      this.scheduleNextStep();
    }, sixteenthSeconds * 1000);
  }

  private playStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    const bar = Math.floor(step / 16) % 4; // 4-bar progression
    const beat16 = step % 16;
    const rootFreq = this.chordRootNotes[bar];

    // 1. PUNCHY KICK DRUM (Every quarter note: step 0, 4, 8, 12 in the bar)
    if (beat16 % 4 === 0) {
      this.playKick(time);
    }

    // 2. RETRO SNARE / CLAP (Beats 2 & 4: step 4, 12 in the bar)
    if (beat16 === 4 || beat16 === 12) {
      this.playSnare(time);
    }

    // 3. HI-HATS (Driving 16th-note groove with velocity accents)
    const isAccent = beat16 % 4 === 2; // Offbeat hat
    this.playHiHat(time, isAccent);

    // 4. ROLLING 16th-NOTE SYNTH BASS (The heart of Cyberpunk Synthwave)
    // Plays root octave bounce: root / root*2
    const bassOctave = beat16 % 2 === 0 ? 0.5 : 1.0;
    this.playRollingBass(rootFreq * bassOctave, time);

    // 5. WARM ANALOG PAD / CHORD (Plays sustained at bar starts)
    if (beat16 === 0) {
      this.playPadChord(rootFreq, time);
    }

    // 6. DYNAMIC NEON ARPEGGIO / LEAD MELODY (Plays catchy synth hook)
    if (beat16 % 2 === 0) {
      const melodyIndex = (step * 3 + bar * 2) % this.melodyScale.length;
      const noteFreq = this.melodyScale[melodyIndex];
      this.playArpLead(noteFreq, time);
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.07);
    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.09);

    // Noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.11);
  }

  private playHiHat(time: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(9500, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const vol = isAccent ? 0.09 : 0.04;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.05 : 0.03));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  private playRollingBass(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.1);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  private playPadChord(rootFreq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Minor triad intervals: Root, Minor 3rd (* 1.189), 5th (* 1.498)
    const chordNotes = [rootFreq * 2, rootFreq * 2 * 1.189, rootFreq * 2 * 1.498];

    chordNotes.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, time);
      filter.frequency.linearRampToValueAtTime(350, time + 1.2);

      gain.gain.setValueAtTime(0.04, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + 1.5);
    });
  }

  private playArpLead(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // --- SOUND EFFECTS ---

  public startSaberHum() {
    this.initCtx();
    if (this.saberHumOsc || !this.ctx || !this.sfxGain) return;

    this.saberHumOsc = this.ctx.createOscillator();
    this.saberHumGain = this.ctx.createGain();

    this.saberHumOsc.type = 'sawtooth';
    this.saberHumOsc.frequency.setValueAtTime(68, this.ctx.currentTime);

    // LFO frequency modulation for authentic hum
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(7.5, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(6, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.saberHumOsc.frequency);
    lfo.start();

    this.saberHumGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

    this.saberHumOsc.connect(this.saberHumGain);
    this.saberHumGain.connect(this.sfxGain);

    this.saberHumOsc.start();
  }

  public stopSaberHum() {
    if (this.saberHumOsc) {
      try {
        this.saberHumOsc.stop();
        this.saberHumOsc.disconnect();
      } catch {
        // ignore
      }
      this.saberHumOsc = null;
    }
  }

  public playSlash(type: 'UP' | 'MID' | 'DOWN' | 'COMBO' | 'ULTIMATE') {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';

    if (type === 'UP') {
      osc.frequency.setValueAtTime(280, time);
      osc.frequency.exponentialRampToValueAtTime(1050, time + 0.16);
      gain.gain.setValueAtTime(0.38, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    } else if (type === 'MID') {
      osc.frequency.setValueAtTime(500, time);
      osc.frequency.exponentialRampToValueAtTime(180, time + 0.14);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    } else if (type === 'DOWN') {
      osc.frequency.setValueAtTime(340, time);
      osc.frequency.exponentialRampToValueAtTime(75, time + 0.2);
      gain.gain.setValueAtTime(0.44, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    } else if (type === 'COMBO') {
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(1250, time + 0.25);
      gain.gain.setValueAtTime(0.48, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    } else {
      this.playUltimateExplosion();
      return;
    }

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, time);
    filter.Q.setValueAtTime(2.2, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  public playHit(isCrit: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 920 : 460, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.12);

    gain.gain.setValueAtTime(isCrit ? 0.55 : 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  public playEnemySlice() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, time);
    osc.frequency.exponentialRampToValueAtTime(85, time + 0.18);

    gain.gain.setValueAtTime(0.38, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.21);
  }

  public playPickup() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time + idx * 0.05);

      gain.gain.setValueAtTime(0.32, time + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time + idx * 0.05);
      osc.stop(time + idx * 0.05 + 0.18);
    });
  }

  public playJump() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(420, time + 0.09);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  public playSaberExpire() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.35);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.4);
    this.stopSaberHum();
  }

  public playUltimateExplosion() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;

    // Sub bass drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(180, time);
    subOsc.frequency.exponentialRampToValueAtTime(28, time + 0.65);

    subGain.gain.setValueAtTime(0.75, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(time);
    subOsc.stop(time + 0.75);

    // Laser shatter
    const shatterOsc = this.ctx.createOscillator();
    const shatterGain = this.ctx.createGain();
    shatterOsc.type = 'sawtooth';
    shatterOsc.frequency.setValueAtTime(1500, time);
    shatterOsc.frequency.exponentialRampToValueAtTime(220, time + 0.42);

    shatterGain.gain.setValueAtTime(0.45, time);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.46);

    shatterOsc.connect(shatterGain);
    shatterGain.connect(this.sfxGain);
    shatterOsc.start(time);
    shatterOsc.stop(time + 0.5);
  }

  public playBossAlert() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.linearRampToValueAtTime(165, time + 0.15);
    osc.frequency.linearRampToValueAtTime(80, time + 0.4);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.52);
  }

  public playStunSound() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(700, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.2);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.23);
  }
}

export const sound = new SoundEngine();
