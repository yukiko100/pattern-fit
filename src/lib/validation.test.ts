import { describe, expect, it } from "vitest";
import { validateRasterSettings } from "./validation";

const grid = (overrides = {}) => ({
  width: 1080,
  height: 1350,
  spacing: 32,
  thickness: 1,
  color: "#4C82EE",
  ...overrides,
});

const dots = (overrides = {}) => ({
  width: 1080,
  height: 1350,
  spacing: 32,
  dotSize: 6,
  dotsLayout: "grid" as const,
  color: "#4C82EE",
  ...overrides,
});

describe("raster settings validation", () => {
  it.each([0, 8001, 1.5])("rejects invalid dimensions: %p", (value) => {
    expect(
      validateRasterSettings("grid", grid({ width: value })).errors.width,
    ).toBe("size");
    expect(
      validateRasterSettings("grid", grid({ height: value })).errors.height,
    ).toBe("size");
  });

  it.each([1, 8000])("accepts valid dimensions: %p", (value) => {
    expect(
      validateRasterSettings("grid", grid({ width: value, height: value }))
        .isValid,
    ).toBe(true);
  });

  it.each([3, 129, 4.5])("rejects invalid spacing: %p", (spacing) => {
    expect(
      validateRasterSettings("grid", grid({ spacing })).errors.spacing,
    ).toBe("spacing");
  });

  it.each([0, 1, 1.5])(
    "requires a dot size of at least 2 px: %p",
    (dotSize) => {
      expect(
        validateRasterSettings("dots", dots({ dotSize })).errors.dotSize,
      ).toBe("minimum");
    },
  );

  it("requires thickness and dot size to be smaller than spacing", () => {
    expect(
      validateRasterSettings("grid", grid({ spacing: 4, thickness: 4 })).errors
        .thickness,
    ).toBe("smaller");
    expect(
      validateRasterSettings("dots", dots({ spacing: 4, dotSize: 4 })).errors
        .dotSize,
    ).toBe("smaller");
  });

  it("flags values that become invalid after a spacing change", () => {
    expect(
      validateRasterSettings("grid", grid({ spacing: 8, thickness: 4 }))
        .isValid,
    ).toBe(true);
    expect(
      validateRasterSettings("grid", grid({ spacing: 4, thickness: 4 }))
        .isValid,
    ).toBe(false);
    expect(
      validateRasterSettings("dots", dots({ spacing: 8, dotSize: 6 })).isValid,
    ).toBe(true);
    expect(
      validateRasterSettings("dots", dots({ spacing: 4, dotSize: 6 })).isValid,
    ).toBe(false);
  });
});
