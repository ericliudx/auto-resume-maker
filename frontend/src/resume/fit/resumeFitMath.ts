export function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/** Resolve CSS `in` to pixels using the current display (fallback 96dpi). */
export function inchToPx(inches: number): number {
  const el = document.createElement("div");
  el.style.width = "1in";
  el.style.height = "1in";
  el.style.position = "absolute";
  el.style.left = "-10000px";
  el.style.top = "-10000px";
  document.body.appendChild(el);
  const pxPerInch = el.getBoundingClientRect().height || 96;
  document.body.removeChild(el);
  return inches * pxPerInch;
}

export function maxBulletsForItem(
  item: { bullets?: string[] },
  cap: number,
): number {
  const n = Array.isArray(item.bullets) ? item.bullets.length : 0;
  return clampInt(n || 1, 1, cap);
}
