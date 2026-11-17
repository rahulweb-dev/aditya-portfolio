// The Red Sun dunes, shared by the hero desert and the doors scene.
// Each ridge is a sum of sines whose periods divide W, so sliding a path by W loops seamlessly.

export const W = 1920; // one repeat of every dune; each path is drawn twice as wide and slides by W
export const H = 1080;

export type DuneLayer = { base: number; waves: [amp: number, k: number, phase: number][]; secs: number };

// far → near: ridge height, waves, seconds per loop
export const DUNE_LAYERS: DuneLayer[] = [
  { base: 640, waves: [[34, 1, 0.4], [16, 3, 1.7]], secs: 160 },
  { base: 705, waves: [[42, 1, 2.2], [14, 2, 0.3], [8, 5, 1]], secs: 120 },
  { base: 780, waves: [[48, 1, 4.1], [18, 3, 2.6]], secs: 90 },
  { base: 865, waves: [[44, 2, 1.2], [20, 1, 5]], secs: 70 },
  { base: 960, waves: [[52, 1, 3.3], [16, 4, 0.8]], secs: 54 },
];

// The night colours of the five layers, far → near
export const NIGHT_DUNES = ['#3a2826', '#2c1e1d', '#211616', '#170f0f', '#0e0909'];

/** The height of a layer's ridge at x (in the path's own coordinates). */
export function ridgeY(layer: DuneLayer, x: number) {
  return layer.waves.reduce((acc, [a, k, p]) => acc + a * Math.sin((2 * Math.PI * k * x) / W + p), layer.base);
}

/** The filled shape of a layer, two repeats wide. */
export function dunePath(layer: DuneLayer) {
  let d = `M0 ${H}`;
  for (let x = 0; x <= W * 2; x += 24) d += ` L${x} ${ridgeY(layer, x).toFixed(1)}`;
  return `${d} L${W * 2} ${H} Z`;
}

/** How far a layer has slid left after t seconds (0 … W). */
export function duneOffset(layer: DuneLayer, t: number) {
  return ((t / layer.secs) * W) % W;
}

// Stars for the night sky (fixed, so the server and the browser draw the same ones)
export const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * W, y: r(2) * 560, s: 0.6 + r(3) * 1.3, d: (r(4) * 6).toFixed(2) };
});
