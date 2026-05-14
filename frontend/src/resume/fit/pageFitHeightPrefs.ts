/** localStorage key for one-page resume height adjustment (pixels added to nominal Letter content height). */
export const PAGE_FIT_EXTRA_HEIGHT_STORAGE_KEY = "auto_resume:page_fit_extra_height_px.v2";

/** Nominal printable content height for US Letter with @page margin 0.5in (see `resumeCssPrint.ts`). */
export const PAGE_FIT_NOMINAL_CONTENT_HEIGHT_IN = 10;

export const PAGE_FIT_EXTRA_HEIGHT_MIN = -48;
/** Upper bound leaves room above the default (+112) so the slider is usable, not pegged at max. */
export const PAGE_FIT_EXTRA_HEIGHT_MAX = 168;
export const PAGE_FIT_EXTRA_HEIGHT_DEFAULT = 112;
export const PAGE_FIT_EXTRA_HEIGHT_STEP = 4;

export function clampPageFitExtraHeightPx(n: number): number {
  const t = Math.round(n / PAGE_FIT_EXTRA_HEIGHT_STEP) * PAGE_FIT_EXTRA_HEIGHT_STEP;
  return Math.max(PAGE_FIT_EXTRA_HEIGHT_MIN, Math.min(PAGE_FIT_EXTRA_HEIGHT_MAX, t));
}
