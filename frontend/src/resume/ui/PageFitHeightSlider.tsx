import {
  PAGE_FIT_EXTRA_HEIGHT_MAX,
  PAGE_FIT_EXTRA_HEIGHT_MIN,
  PAGE_FIT_EXTRA_HEIGHT_STEP,
} from "../fit/pageFitHeightPrefs";

export type PageFitHeightSliderProps = {
  id: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
};

function formatAriaValue(px: number): string {
  if (px <= 0) return `${px} pixels, trim sooner, more bottom space`;
  return `plus ${px} pixels, allow taller resume before trimming`;
}

export function PageFitHeightSlider({
  id,
  value,
  onChange,
  disabled,
}: PageFitHeightSliderProps) {
  return (
    <div className="resumePane__fitHeight">
      <div className="resumePane__fitHeightHeader">
        <label className="resumePane__fitHeightLabel" htmlFor={id}>
          One-page height
        </label>
        <span className="resumePane__fitHeightValue" aria-live="polite">
          {value > 0 ? `+${value}` : value}
          <span className="resumePane__fitHeightUnit"> px</span>
        </span>
      </div>
      <input
        id={id}
        className="resumePane__fitHeightRange"
        type="range"
        min={PAGE_FIT_EXTRA_HEIGHT_MIN}
        max={PAGE_FIT_EXTRA_HEIGHT_MAX}
        step={PAGE_FIT_EXTRA_HEIGHT_STEP}
        value={value}
        disabled={disabled}
        aria-valuemin={PAGE_FIT_EXTRA_HEIGHT_MIN}
        aria-valuemax={PAGE_FIT_EXTRA_HEIGHT_MAX}
        aria-valuenow={value}
        aria-valuetext={formatAriaValue(value)}
        aria-label="Adjust how much vertical room the one-page fitter allows before trimming the resume"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="resumePane__fitHeightEnds" aria-hidden="true">
        <span>Leave space</span>
        <span>Fill page</span>
      </div>
      <p className="resumePane__fitHeightHint">
        Shifts the height budget added to the nominal 10in print column. Right: keep more lines;
        left: trim sooner (more empty area when content is long).
      </p>
    </div>
  );
}
