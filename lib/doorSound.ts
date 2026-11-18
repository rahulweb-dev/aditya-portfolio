import type { SkillKey } from '@/lib/content';

// The doors' sounds, made live with the Web Audio API (no files to download):
//   hover  a soft glassy chime in the door's own note
//   enter  a rising whoosh into the tunnel, a low rumble under it, a shimmer as the light floods in
//   back   a short reverse whoosh, pulling back out of the doorway
// Browsers only allow sound after the visitor has clicked or pressed a key; until then it stays silent.
// Visitors can turn it off; the choice is remembered.

const KEY = 'door-sound';
// each door's note, left to right (a gentle major chord, rising)
const NOTE: Record<SkillKey, number> = { photo: 523.25, design: 659.25, video: 783.99, ai: 987.77 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
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
  if (on) audio(); // the toggle is a click: a fine moment to wake the audio
  listeners.forEach(l => l(on));
}

export function onSoundChange(l: (on: boolean) => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The audio engine, made on first use; null until the browser allows sound. */
function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    // a touch of soft room, so it doesn't sound dry
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    // two seconds of soft noise, reused for every whoosh
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) {
      b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); // brownish: warmer than white noise
      d[i] = b * 3;
    }
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

function tone(a: AudioContext, freq: number, at: number, dur: number, peak: number, type: OscillatorType = 'sine', glideTo?: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.05, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function whoosh(a: AudioContext, at: number, dur: number, fromHz: number, toHz: number, peak: number, swellAt = 0.7) {
  const src = a.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(fromHz, at);
  bp.frequency.exponentialRampToValueAtTime(toHz, at + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + dur * swellAt);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(bp).connect(g).connect(master!);
  src.start(at);
  src.stop(at + dur + 0.05);
}

/** Called from a click elsewhere (e.g. "Back to the doors"), so the return can be heard. */
export function wakeAudio() {
  if (soundOn()) audio();
}

/** Hovering a door: a soft chime in its note (not more than once every half second per door). */
export function playHover(key: SkillKey) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const now = performance.now();
  if (now - (lastHover[key] ?? 0) < 500) return;
  lastHover[key] = now;
  const t = a.currentTime + 0.01;
  const f = NOTE[key];
  tone(a, f, t, 1.4, 0.07);
  tone(a, f * 2, t + 0.02, 1.0, 0.025); // a glassy overtone
  tone(a, f * 3.01, t + 0.04, 0.6, 0.01);
  whoosh(a, t, 0.5, 2500, 4000, 0.015, 0.4); // a breath of air as the light blooms
}

/** Stepping through a door: into the tunnel and out into the light (about two seconds). */
export function playEnter(key: SkillKey) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.02;
  const f = NOTE[key];
  tone(a, f, t, 0.9, 0.06); // the door answers
  whoosh(a, t + 0.15, 2.0, 180, 3200, 0.22, 0.8); // rushing in, faster and higher
  tone(a, 110, t + 0.2, 1.9, 0.12, 'sine', 48); // a low rumble falling away beneath
  tone(a, f / 2, t + 0.3, 1.7, 0.03, 'triangle', f * 2); // a rising shimmer
  // the light floods in: a bright chord
  [1, 1.25, 1.5, 2].forEach((m, i) => tone(a, f * m, t + 1.75 + i * 0.03, 1.6, 0.035));
}

/** Back from a room: pulling out of the doorway. */
export function playBack(key: SkillKey) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.02;
  whoosh(a, t, 1.1, 2600, 220, 0.12, 0.25);
  tone(a, NOTE[key], t + 0.5, 1.3, 0.04);
}
