import type { SkillKey } from '@/lib/content';

// The doors' sounds, made live with the Web Audio API (no files to download). Cinematic and soft:
//   hover  a warm swell in the door's own note, blooming into a room (like light opening up)
//   enter  an airy riser sweeping across the stereo field into the tunnel, a soft sub swell under it,
//          and a glowing chord as the light floods in
//   back   the riser reversed: pulling back out of the doorway, settling on the door's note
// Everything passes through a gentle high cut and a generated reverb, so nothing sounds dry or sharp.
// Browsers only allow sound after the visitor has clicked or pressed a key; until then it stays silent.
// Visitors can turn it off; the choice is remembered.

const KEY = 'door-sound';
// each door's note, left to right: low and warm (A minor pentatonic, rising)
const NOTE: Record<SkillKey, number> = { photo: 220.0, design: 261.63, video: 329.63, ai: 392.0 };

/** One context's sound chain: a dry path and a reverb path to the speakers, and the noise for sweeps. */
type Chain = { dry: GainNode; wet: GainNode; noise: AudioBuffer };
const chains = new WeakMap<BaseAudioContext, Chain>();
let ctx: AudioContext | null = null;
const listeners = new Set<(on: boolean) => void>();
const lastHover: Partial<Record<SkillKey, number>> = {};

export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  if (on) audio();
  listeners.forEach(l => l(on));
}

export function onSoundChange(l: (on: boolean) => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** A stereo reverb tail: decaying noise, darker as it fades (like a soft, large room). */
function impulse(a: BaseAudioContext, seconds = 2.6) {
  const len = Math.floor(a.sampleRate * seconds);
  const ir = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const k = 0.35 + 0.6 * t; // the tail gets darker
      lp = lp * k + (Math.random() * 2 - 1) * (1 - k);
      d[i] = lp * Math.pow(1 - t, 2.4) * 1.8;
    }
  }
  return ir;
}

/** Sets up the chain on a context: sounds → (dry + reverb) → high cut → gentle limiter → speakers. */
function build(a: BaseAudioContext): Chain {
  const out = a.createGain();
  out.gain.value = 3.2;
  const cut = a.createBiquadFilter();
  cut.type = 'lowpass';
  cut.frequency.value = 7000;
  cut.Q.value = 0.5;
  const limit = a.createDynamicsCompressor();
  limit.threshold.value = -6; // only catches peaks
  limit.ratio.value = 4;
  limit.attack.value = 0.01;
  limit.release.value = 0.3;
  out.connect(cut).connect(limit).connect(a.destination);

  const dry = a.createGain();
  dry.gain.value = 0.75;
  dry.connect(out);
  const verb = a.createConvolver();
  verb.buffer = impulse(a);
  const wet = a.createGain();
  wet.gain.value = 0.55;
  wet.connect(verb).connect(out);

  // soft pink-ish noise for the airy sweeps
  const noise = a.createBuffer(1, a.sampleRate * 3, a.sampleRate);
  const d = noise.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + w * 0.029;
    b1 = 0.985 * b1 + w * 0.032;
    b2 = 0.95 * b2 + w * 0.048;
    d[i] = (b0 + b1 + b2 + w * 0.02) * 1.6;
  }
  const chain = { dry, wet, noise };
  chains.set(a, chain);
  return chain;
}

/** The audio engine, made on first use; null until the browser allows sound. */
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    build(ctx);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx.state === 'running' ? ctx : null;
}

// wake the audio on the first click or key press anywhere
if (typeof window !== 'undefined') {
  const wake = () => {
    if (soundOn()) audio();
    removeEventListener('pointerdown', wake);
    removeEventListener('keydown', wake);
  };
  addEventListener('pointerdown', wake);
  addEventListener('keydown', wake);
}

/** Called from a click elsewhere (e.g. "Back to the doors"), so the return can be heard. */
export function wakeAudio() {
  if (soundOn()) audio();
}

// ---------- building blocks ----------

/** Sends a node to the room: some straight, some into the reverb. */
function send(a: BaseAudioContext, node: AudioNode, reverb = 0.5, pan = 0) {
  const p = a.createStereoPanner();
  p.pan.value = pan;
  node.connect(p);
  const d = a.createGain();
  d.gain.value = 1 - reverb * 0.5;
  const w = a.createGain();
  w.gain.value = reverb;
  const c = chains.get(a)!;
  p.connect(d).connect(c.dry);
  p.connect(w).connect(c.wet);
  return p;
}

/** A soft pad voice: two slightly detuned sines, swelling in and fading out (no click, no edge). */
function pad(a: BaseAudioContext, freq: number, at: number, attack: number, hold: number, release: number, peak: number, reverb = 0.6, pan = 0) {
  const g = a.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(peak, at + attack);
  g.gain.setValueAtTime(peak, at + attack + hold);
  g.gain.setTargetAtTime(0, at + attack + hold, release / 4);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = freq * 6;
  g.connect(lp);
  send(a, lp, reverb, pan);
  const end = at + attack + hold + release + 0.2;
  for (const detune of [-6, 6]) {
    const o = a.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(g);
    o.start(at);
    o.stop(end);
  }
}

/** A breath of air: filtered noise swelling and moving across the stereo field. */
function air(a: BaseAudioContext, at: number, dur: number, from: number, to: number, peak: number, panFrom: number, panTo: number, curve: 'in' | 'out' = 'in', reverb = 0.5) {
  const src = a.createBufferSource();
  src.buffer = chains.get(a)!.noise;
  src.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(from, at);
  bp.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0, at);
  if (curve === 'in') {
    // grows, then cuts off softly (a riser)
    g.gain.linearRampToValueAtTime(peak * 0.15, at + dur * 0.35);
    g.gain.linearRampToValueAtTime(peak, at + dur * 0.92);
    g.gain.linearRampToValueAtTime(0, at + dur);
  } else {
    // arrives at once, then falls away (a pull-back)
    g.gain.linearRampToValueAtTime(peak, at + dur * 0.12);
    g.gain.setTargetAtTime(0, at + dur * 0.15, dur / 4);
  }
  src.connect(bp).connect(g);
  const p = send(a, g, reverb, panFrom);
  p.pan.setValueAtTime(panFrom, at);
  p.pan.linearRampToValueAtTime(panTo, at + dur);
  src.start(at);
  src.stop(at + dur + 1.5);
}

/** A soft, deep swell you feel more than hear. */
function sub(a: BaseAudioContext, at: number, dur: number, from: number, to: number, peak: number) {
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(from, at);
  o.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(peak, at + dur * 0.6);
  g.gain.setTargetAtTime(0, at + dur * 0.65, dur / 5);
  o.connect(g);
  send(a, g, 0.15);
  o.start(at);
  o.stop(at + dur + 1);
}

// ---------- the sounds (each takes a context and a start time, so they can also be rendered) ----------

export function hoverSound(a: BaseAudioContext, t: number, key: SkillKey) {
  const f = NOTE[key];
  const lift = { photo: 1, design: 1.15, video: 1.2, ai: 1.35 }[key]; // higher doors sit lower in the mix otherwise
  const pan = { photo: -0.45, design: -0.15, video: 0.15, ai: 0.45 }[key]; // heard from where the door stands
  pad(a, f, t, 0.12, 0.15, 1.4, 0.05 * lift, 0.7, pan);
  pad(a, f * 1.5, t + 0.05, 0.18, 0.1, 1.2, 0.022 * lift, 0.8, pan); // a fifth above, fainter
  pad(a, f * 4, t + 0.08, 0.25, 0.0, 1.0, 0.006 * lift, 0.9, pan); // a glint of shimmer high up
  air(a, t, 0.7, 3000, 5200, 0.03, pan - 0.1, pan + 0.1, 'out', 0.8);
}

export function enterSound(a: BaseAudioContext, t: number, key: SkillKey) {
  const f = NOTE[key];
  pad(a, f, t, 0.05, 0.25, 0.9, 0.045, 0.6); // the door answers
  air(a, t + 0.1, 1.75, 250, 5500, 0.2, -0.6, 0.6, 'in', 0.45); // rushing in, sweeping past
  air(a, t + 0.25, 1.6, 500, 7000, 0.07, 0.5, -0.5, 'in', 0.6); // a second, brighter layer the other way
  sub(a, t + 0.15, 1.75, 70, 42, 0.16); // a deep swell underneath
  // the light floods in: a wide, glowing chord
  const at = t + 1.85;
  [
    [1, 0.04, -0.3],
    [1.5, 0.028, 0.3],
    [2, 0.022, -0.15],
    [2.5, 0.014, 0.2],
    [3, 0.01, 0],
  ].forEach(([m, peak, pan], i) => pad(a, f * m, at + i * 0.015, 0.06, 0.4, 2.2, peak, 0.85, pan));
}

export function backSound(a: BaseAudioContext, t: number, key: SkillKey) {
  air(a, t, 1.2, 5000, 300, 0.13, 0.5, -0.5, 'out', 0.55); // pulled back out
  sub(a, t, 0.9, 45, 70, 0.08);
  pad(a, NOTE[key], t + 0.45, 0.25, 0.2, 1.6, 0.045, 0.75);
  pad(a, NOTE[key] * 1.5, t + 0.55, 0.3, 0.1, 1.4, 0.02, 0.8);
}

// ---------- what the doors call ----------

/** Hovering a door (not more than once every 0.6 s per door). */
export function playHover(key: SkillKey) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const now = performance.now();
  if (now - (lastHover[key] ?? 0) < 600) return;
  lastHover[key] = now;
  hoverSound(a, a.currentTime + 0.01, key);
}

/** Stepping through a door (about two seconds, with the tunnel). */
export function playEnter(key: SkillKey) {
  if (!soundOn()) return;
  const a = audio();
  if (a) enterSound(a, a.currentTime + 0.02, key);
}

/** Back from a room: pulling out of the doorway. */
export function playBack(key: SkillKey) {
  if (!soundOn()) return;
  const a = audio();
  if (a) backSound(a, a.currentTime + 0.02, key);
}

/** For previews: renders the sounds offline into a buffer (used by a test script, not the site). */
export async function renderPreview(which: 'hover' | 'enter' | 'back', key: SkillKey, seconds = 4.5) {
  const a = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100);
  build(a);
  if (which === 'hover') hoverSound(a, 0.05, key);
  else if (which === 'enter') enterSound(a, 0.05, key);
  else backSound(a, 0.05, key);
  return a.startRendering();
}
