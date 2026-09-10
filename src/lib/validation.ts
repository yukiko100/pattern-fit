import type { PatternSettings, PatternType } from "./types";

export type ValidationField =
  "width" | "height" | "spacing" | "thickness" | "dotSize";

export type SettingsValidation = {
  errors: Partial<
    Record<
      ValidationField,
      "size" | "spacing" | "positive" | "minimum" | "smaller"
    >
  >;
  isValid: boolean;
};

const isWholeNumber = (value: number) => Number.isInteger(value);

export const validateRasterSettings = (
  type: PatternType,
  settings: PatternSettings,
): SettingsValidation => {
  const errors: SettingsValidation["errors"] = {};

  if (
    !isWholeNumber(settings.width) ||
    settings.width < 1 ||
    settings.width > 8000
  ) {
    errors.width = "size";
  }
  if (
    !isWholeNumber(settings.height) ||
    settings.height < 1 ||
    settings.height > 8000
  ) {
    errors.height = "size";
  }
  if (
    !isWholeNumber(settings.spacing) ||
    settings.spacing < 4 ||
    settings.spacing > 128
  ) {
    errors.spacing = "spacing";
  }

  if (type === "dots") {
    const dotSize = (settings as { dotSize: number }).dotSize;
    if (!isWholeNumber(dotSize) || dotSize < 2) {
      errors.dotSize = "minimum";
    } else if (dotSize >= settings.spacing) {
      errors.dotSize = "smaller";
    }
  } else {
    const thickness = (settings as { thickness: number }).thickness;
    if (!isWholeNumber(thickness) || thickness < 1) {
      errors.thickness = "positive";
    } else if (thickness >= settings.spacing) {
      errors.thickness = "smaller";
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};
