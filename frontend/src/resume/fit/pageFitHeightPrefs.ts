/** localStorage key for one-page resume height adjustment (pixels added to nominal Letter content height). */
export const PAGE_FIT_EXTRA_HEIGHT_STORAGE_KEY = "auto_resume:page_fit_extra_height_px";

/** Nominal printable content height for US Letter with @page margin 0.5in (see `resumeCssPrint.ts`). */
export const PAGE_FIT_NOMINAL_CONTENT_HEIGHT_IN = 10;

export const PAGE_FIT_EXTRA_HEIGHT_MIN = -48;
export const PAGE_FIT_EXTRA_HEIGHT_MAX = 120;
export const PAGE_FIT_EXTRA_HEIGHT_DEFAULT = 36;
export const PAGE_FIT_EXTRA_HEIGHT_STEP = 4;

export function clampPageFitExtraHeightPx(n: number): number {
  const t = Math.round(n / PAGE_FIT_EXTRA_HEIGHT_STEP) * PAGE_FIT_EXTRA_HEIGHT_STEP;
  return Math.max(PAGE_FIT_EXTRA_HEIGHT_MIN, Math.min(PAGE_FIT_EXTRA_HEIGHT_MAX, t));
}
