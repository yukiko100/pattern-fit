import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  CANVAS_PRESETS,
  INITIAL_PRESET_ID,
  type CanvasPresetId,
} from "./data/presets";
import { downloadPng } from "./lib/download";
import { createRasterPattern, type RasterPattern } from "./lib/raster";
import type {
  DotsLayout,
  PatternSettings,
  PatternType,
  StripeAngle,
} from "./lib/types";
import { validateRasterSettings, type ValidationField } from "./lib/validation";

const INITIAL_COLOR = "#4C82EE";
const INITIAL_SPACING = "32";
const INITIAL_GRID_THICKNESS = "1";
const INITIAL_STRIPE_THICKNESS = "2";
const INITIAL_DOT_SIZE = "6";
const INITIAL_WIDTH = "1080";
const INITIAL_HEIGHT = "1350";

const numberValue = (value: string) => Number(value);

const getRendererErrorMessage = (error: unknown) => {
  const detail = error instanceof Error ? error.message : "";

  if (detail.includes("supersampling")) {
    return "This size is too large for diagonal stripes. Try a smaller width or height.";
  }
  if (detail.includes("drawing operations")) {
    return "This pattern is too dense for this size. Increase the spacing or reduce the output size.";
  }
  if (detail.includes("pixel")) {
    return "This size is too large. Try a smaller width or height.";
  }
  return "We couldn't generate this pattern. Check the settings and try again.";
};

const getValidationMessage = (field: ValidationField, reason?: string) => {
  if (field === "width" || field === "height") {
    return "Enter a whole number between 1 and 8000 px.";
  }
  if (field === "spacing") {
    return "Pattern spacing must be between 4 and 128 px.";
  }
  if (field === "thickness") {
    return reason === "smaller"
      ? "Line thickness must be smaller than pattern spacing."
      : "Enter a whole number greater than 0 px.";
  }
  return reason === "smaller"
    ? "Dot size must be smaller than pattern spacing."
    : "Enter a whole number of 2 px or greater.";
};

const ChoiceSwatch = ({ type }: { type: PatternType }) => (
  <span
    aria-hidden="true"
    className={`pattern-swatch pattern-swatch--${type}`}
  />
);

export const App = () => {
  const [patternType, setPatternType] = useState<PatternType>("grid");
  const [presetId, setPresetId] = useState<CanvasPresetId>(INITIAL_PRESET_ID);
  const [widthInput, setWidthInput] = useState(INITIAL_WIDTH);
  const [heightInput, setHeightInput] = useState(INITIAL_HEIGHT);
  const [spacingInput, setSpacingInput] = useState(INITIAL_SPACING);
  const [gridThicknessInput, setGridThicknessInput] = useState(
    INITIAL_GRID_THICKNESS,
  );
  const [stripeThicknessInput, setStripeThicknessInput] = useState(
    INITIAL_STRIPE_THICKNESS,
  );
  const [dotSizeInput, setDotSizeInput] = useState(INITIAL_DOT_SIZE);
  const [dotsLayout, setDotsLayout] = useState<DotsLayout>("grid");
  const [stripeAngle, setStripeAngle] = useState<StripeAngle>(45);
  const [color, setColor] = useState(INITIAL_COLOR);
  const [touched, setTouched] = useState<Set<ValidationField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [previewPattern, setPreviewPattern] = useState<RasterPattern>();
  const [generationError, setGenerationError] = useState<string>();
  const [isDownloading, setIsDownloading] = useState(false);

  const settings = useMemo<PatternSettings>(() => {
    const shared = {
      width: numberValue(widthInput),
      height: numberValue(heightInput),
      spacing: numberValue(spacingInput),
      color,
    };

    if (patternType === "dots") {
      return { ...shared, dotSize: numberValue(dotSizeInput), dotsLayout };
    }
    if (patternType === "stripes") {
      return {
        ...shared,
        thickness: numberValue(stripeThicknessInput),
        angle: stripeAngle,
      };
    }
    return { ...shared, thickness: numberValue(gridThicknessInput) };
  }, [
    color,
    dotSizeInput,
    dotsLayout,
    gridThicknessInput,
    heightInput,
    patternType,
    spacingInput,
    stripeAngle,
    stripeThicknessInput,
    widthInput,
  ]);

  const validation = useMemo(
    () => validateRasterSettings(patternType, settings),
    [patternType, settings],
  );

  useEffect(() => {
    if (!validation.isValid) {
      setGenerationError(undefined);
      return;
    }

    try {
      setPreviewPattern(createRasterPattern(patternType, settings));
      setGenerationError(undefined);
    } catch (error) {
      setGenerationError(getRendererErrorMessage(error));
    }
  }, [patternType, settings, validation.isValid]);

  const markTouched = (field: ValidationField) => {
    setTouched((current) => new Set(current).add(field));
  };

  const handleEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    field: ValidationField,
  ) => {
    if (event.key === "Enter") {
      markTouched(field);
    }
  };

  const shouldShowError = (field: ValidationField) =>
    Boolean(validation.errors[field]) && (submitted || touched.has(field));

  const selectPreset = (nextPresetId: CanvasPresetId) => {
    setPresetId(nextPresetId);
    if (nextPresetId === "custom") {
      return;
    }
    const preset = CANVAS_PRESETS.find(({ id }) => id === nextPresetId);
    if (preset) {
      setWidthInput(String(preset.width));
      setHeightInput(String(preset.height));
    }
  };

  const updateDimension = (field: "width" | "height", value: string) => {
    setPresetId("custom");
    if (field === "width") {
      setWidthInput(value);
    } else {
      setHeightInput(value);
    }
  };

  const handleDownload = async () => {
    setSubmitted(true);
    if (!validation.isValid) {
      return;
    }

    try {
      const pattern = createRasterPattern(patternType, settings);
      setPreviewPattern(pattern);
      setGenerationError(undefined);
      setIsDownloading(true);
      await downloadPng(pattern, patternType);
    } catch (error) {
      setGenerationError(getRendererErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  const spacing = numberValue(spacingInput);
  const rangeValue =
    Number.isInteger(spacing) && spacing >= 4 && spacing <= 128 ? spacing : 4;
  const downloadDisabled =
    !validation.isValid ||
    !previewPattern ||
    Boolean(generationError) ||
    isDownloading;

  const ErrorMessage = ({ field }: { field: ValidationField }) => {
    if (!shouldShowError(field)) {
      return null;
    }
    return (
      <p className="field-error" id={`${field}-error`} role="alert">
        {getValidationMessage(field, validation.errors[field])}
      </p>
    );
  };

  return (
    <>
      <main className="app-shell">
        <header className="app-header">
          <p className="eyebrow">Transparent pattern generator</p>
          <h1>Pattern Fit</h1>
          <p>
            Create precise Grid, Dots, and Stripes patterns for any design tool.
          </p>
        </header>

        <div className="app-layout">
          <aside className="settings-panel" aria-label="Pattern settings">
            <section
              className="settings-section"
              aria-labelledby="pattern-heading"
            >
              <h2 id="pattern-heading">Pattern</h2>
              <div
                className="pattern-choices"
                role="radiogroup"
                aria-label="Pattern"
              >
                {(["grid", "dots", "stripes"] as PatternType[]).map((type) => (
                  <label
                    className={`pattern-choice ${patternType === type ? "is-selected" : ""}`}
                    key={type}
                  >
                    <input
                      checked={patternType === type}
                      name="pattern"
                      onChange={() => setPatternType(type)}
                      type="radio"
                      value={type}
                    />
                    <ChoiceSwatch type={type} />
                    <span>{type[0].toUpperCase() + type.slice(1)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="settings-heading"
            >
              <h2 id="settings-heading">Pattern settings</h2>
              <div className="field-group">
                <label htmlFor="spacing">Pattern spacing</label>
                <div className="range-row">
                  <input
                    aria-label="Pattern spacing slider"
                    id="spacing-range"
                    max="128"
                    min="4"
                    onChange={(event) => setSpacingInput(event.target.value)}
                    step="1"
                    type="range"
                    value={rangeValue}
                  />
                  <div className="number-with-unit">
                    <input
                      aria-describedby={
                        shouldShowError("spacing") ? "spacing-error" : undefined
                      }
                      aria-invalid={shouldShowError("spacing")}
                      id="spacing"
                      inputMode="numeric"
                      onBlur={() => markTouched("spacing")}
                      onChange={(event) => setSpacingInput(event.target.value)}
                      onKeyDown={(event) => handleEnter(event, "spacing")}
                      type="number"
                      value={spacingInput}
                    />
                    <span>px</span>
                  </div>
                </div>
                <div className="density-hint" aria-hidden="true">
                  <span>Higher density</span>
                  <span>Lower density</span>
                </div>
                <ErrorMessage field="spacing" />
              </div>

              {patternType === "dots" ? (
                <>
                  <div className="field-group compact-field">
                    <label htmlFor="dot-size">Dot size</label>
                    <div className="number-with-unit">
                      <input
                        aria-describedby={
                          shouldShowError("dotSize")
                            ? "dotSize-error"
                            : undefined
                        }
                        aria-invalid={shouldShowError("dotSize")}
                        id="dot-size"
                        inputMode="numeric"
                        min={2}
                        onBlur={() => markTouched("dotSize")}
                        onChange={(event) =>
                          setDotSizeInput(event.target.value)
                        }
                        onKeyDown={(event) => handleEnter(event, "dotSize")}
                        type="number"
                        value={dotSizeInput}
                      />
                      <span>px</span>
                    </div>
                    <ErrorMessage field="dotSize" />
                  </div>
                  <fieldset className="field-group">
                    <legend>Dots layout</legend>
                    <div className="segmented-control">
                      {(["grid", "diagonal"] as DotsLayout[]).map((layout) => (
                        <label
                          className={dotsLayout === layout ? "is-selected" : ""}
                          key={layout}
                        >
                          <input
                            checked={dotsLayout === layout}
                            name="dots-layout"
                            onChange={() => setDotsLayout(layout)}
                            type="radio"
                          />
                          <span>
                            {layout === "grid" ? "Grid" : "Diagonal 45°"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : (
                <div className="field-group compact-field">
                  <label htmlFor="thickness">Line thickness</label>
                  <div className="number-with-unit">
                    <input
                      aria-describedby={
                        shouldShowError("thickness")
                          ? "thickness-error"
                          : undefined
                      }
                      aria-invalid={shouldShowError("thickness")}
                      id="thickness"
                      inputMode="numeric"
                      onBlur={() => markTouched("thickness")}
                      onChange={(event) =>
                        patternType === "stripes"
                          ? setStripeThicknessInput(event.target.value)
                          : setGridThicknessInput(event.target.value)
                      }
                      onKeyDown={(event) => handleEnter(event, "thickness")}
                      type="number"
                      value={
                        patternType === "stripes"
                          ? stripeThicknessInput
                          : gridThicknessInput
                      }
                    />
                    <span>px</span>
                  </div>
                  <ErrorMessage field="thickness" />
                </div>
              )}

              {patternType === "stripes" && (
                <fieldset className="field-group">
                  <legend>Stripes angle</legend>
                  <div className="angle-choices">
                    {([0, 45, 90, 135] as StripeAngle[]).map((angle) => (
                      <label
                        className={stripeAngle === angle ? "is-selected" : ""}
                        key={angle}
                      >
                        <input
                          checked={stripeAngle === angle}
                          name="stripe-angle"
                          onChange={() => setStripeAngle(angle)}
                          type="radio"
                        />
                        <span
                          aria-hidden="true"
                          className={`angle-icon angle-${angle}`}
                        />
                        <span>{angle}°</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="field-group color-field">
                <label htmlFor="color">Color</label>
                <div className="color-control">
                  <input
                    id="color"
                    onChange={(event) => setColor(event.target.value)}
                    type="color"
                    value={color}
                  />
                  <output htmlFor="color">{color.toUpperCase()}</output>
                </div>
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="canvas-heading"
            >
              <h2 id="canvas-heading">Canvas size</h2>
              <div
                className="preset-choices"
                role="radiogroup"
                aria-label="Canvas size preset"
              >
                {CANVAS_PRESETS.map((preset) => (
                  <label
                    className={presetId === preset.id ? "is-selected" : ""}
                    key={preset.id}
                  >
                    <input
                      checked={presetId === preset.id}
                      name="canvas-preset"
                      onChange={() => selectPreset(preset.id)}
                      type="radio"
                    />
                    <span>{preset.label}</span>
                    <small>
                      {preset.width} x {preset.height}
                    </small>
                  </label>
                ))}
                <label className={presetId === "custom" ? "is-selected" : ""}>
                  <input
                    checked={presetId === "custom"}
                    name="canvas-preset"
                    onChange={() => selectPreset("custom")}
                    type="radio"
                  />
                  <span>Custom</span>
                </label>
              </div>
              <div className="dimension-grid">
                {(["width", "height"] as const).map((field) => (
                  <div className="field-group" key={field}>
                    <label htmlFor={field}>
                      {field[0].toUpperCase() + field.slice(1)}
                    </label>
                    <div className="number-with-unit">
                      <input
                        aria-describedby={
                          shouldShowError(field) ? `${field}-error` : undefined
                        }
                        aria-invalid={shouldShowError(field)}
                        id={field}
                        inputMode="numeric"
                        onBlur={() => markTouched(field)}
                        onChange={(event) =>
                          updateDimension(field, event.target.value)
                        }
                        onKeyDown={(event) => handleEnter(event, field)}
                        type="number"
                        value={field === "width" ? widthInput : heightInput}
                      />
                      <span>px</span>
                    </div>
                    <ErrorMessage field={field} />
                  </div>
                ))}
              </div>
            </section>

            <button
              className="download-button"
              disabled={downloadDisabled}
              onClick={() => void handleDownload()}
              type="button"
            >
              {isDownloading ? "Preparing PNG..." : "Download PNG"}
            </button>
          </aside>

          <section className="preview-area" aria-labelledby="preview-heading">
            <div className="preview-copy">
              <p className="eyebrow">Live output</p>
              <h2 id="preview-heading">Preview</h2>
              <p>The checkerboard shows transparent areas only.</p>
            </div>
            <div className="preview-workspace">
              {previewPattern ? (
                <div
                  className="preview-frame"
                  style={{
                    aspectRatio: `${previewPattern.width} / ${previewPattern.height}`,
                  }}
                >
                  <img
                    alt={`Generated ${patternType} pattern preview`}
                    src={previewPattern.dataUrl}
                  />
                </div>
              ) : (
                <p className="preview-empty">
                  Enter valid settings to generate a preview.
                </p>
              )}
            </div>
            {generationError && (
              <p className="generation-error" role="alert">
                {generationError}
              </p>
            )}
          </section>
        </div>
      </main>
      <footer className="site-footer">
        <div>
          <p>Pattern Fit &mdash; Simple patterns, precisely fitted.</p>
          <p>Free to use. No sign-up required.</p>
          <p>&copy; 2026 Yukiko Yamazaki</p>
        </div>
        <nav aria-label="Footer">
          <a href="./about.html">About</a>
          <a href="./privacy.html">Privacy</a>
        </nav>
      </footer>
    </>
  );
};
