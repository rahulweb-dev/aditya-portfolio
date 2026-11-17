// ImageKit address helpers, safe for the browser and the server.

/** Add transformations (w-640, q-75 …) to an ImageKit address, merging with any it already has. */
export function withTr(src: string, tr: string) {
  if (/[?&]tr=/.test(src)) return src.replace(/([?&]tr=)([^&]*)/, (_, k, v) => `${k}${v},${tr}`);
  return `${src}${src.includes('?') ? '&' : '?'}tr=${tr}`;
}

/**
 * A still from a video, made by ImageKit. Built from the clean file address (ImageKit adds
 * "?updatedAt=…" to addresses; the thumbnail path must come before any query). Taken at `at` seconds,
 * or 40% of the way in, since many clips open on black.
 */
export function videoPoster(url: string, secs = 0, at?: number) {
  const clean = url.split('?')[0];
  const t = at ?? Math.round(secs * 0.4);
  return t >= 1 ? `${clean}/ik-thumbnail.jpg?tr=so-${Math.min(t, Math.max(1, Math.floor(secs) - 1))}` : `${clean}/ik-thumbnail.jpg`;
}
