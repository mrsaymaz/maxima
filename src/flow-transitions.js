export const GATE_ENTER_SECONDS = 0.82;
export const PLAY_RETURN_SECONDS = 0.48;
export const smooth = x => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
export function gateEntry(age, { reduced = false } = {}) {
  const p = smooth(age / (reduced ? 0.18 : GATE_ENTER_SECONDS));
  return {
    progress: p,
    ready: p >= 0.98,
    fold: reduced ? 0 : (1 - p) * Math.PI * 0.47,
    pullback: reduced ? 1 : 1.12 - 0.12 * p,
  };
}
