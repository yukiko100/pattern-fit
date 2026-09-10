import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { createRasterPattern, getRasterGenerationStats } from "./raster";

const createContext = () => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fill: vi.fn(),
  imageSmoothingEnabled: false,
  imageSmoothingQuality: "low" as ImageSmoothingQuality,
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  stroke: vi.fn(),
});

describe("raster pattern generation", () => {
  const originalCreateElement = document.createElement;
  const context = createContext();
  const internalContext = createContext();
  const canvas = {
    getContext: vi.fn(() => context),
    height: 0,
    toDataURL: vi.fn(() => "data:image/png;base64,pattern"),
    width: 0,
  };
  const internalCanvas = {
    getContext: vi.fn(() => internalContext),
    height: 0,
    toDataURL: vi.fn(),
    width: 0,
  };
  let canvasCount = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasCount = 0;
    vi.spyOn(document, "createElement").mockImplementation((tagName) =>
      tagName !== "canvas"
        ? originalCreateElement.call(document, tagName)
        : ((canvasCount++ === 0
            ? canvas
            : internalCanvas) as unknown as HTMLElement),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([8, 12, 16, 24, 32])("renders dense Grid spacing %i", (spacing) => {
    const pattern = createRasterPattern("grid", {
      width: 1600,
      height: 900,
      spacing,
      thickness: 1,
      color: "#4C82EE",
    });

    expect(pattern).toMatchObject({
      width: 1600,
      height: 900,
      pixelCount: 1_440_000,
    });
    expect(context.moveTo.mock.calls[0]).toEqual([0.5, 0]);
  });

  it("draws diagonal Dots as untransformed circles beyond the edge", () => {
    const pattern = createRasterPattern("dots", {
      width: 1600,
      height: 900,
      spacing: 8,
      dotSize: 4,
      dotsLayout: "diagonal",
      color: "#4C82EE",
    });

    expect(context.arc).toHaveBeenCalledTimes(pattern.primitiveCount);
    expect(context.arc.mock.calls[0]?.[0]).toBeLessThan(0);
  });

  it.each([0, 45, 90, 135] as const)(
    "renders Stripes at %i degrees",
    (angle) => {
      const pattern = createRasterPattern("stripes", {
        width: 1600,
        height: 900,
        spacing: 8,
        thickness: 1,
        angle,
        color: "#4C82EE",
      });

      const drawingContext =
        angle === 45 || angle === 135 ? internalContext : context;
      expect(drawingContext.moveTo).toHaveBeenCalledTimes(
        pattern.primitiveCount,
      );
    },
  );

  it("uses 2x supersampling for 45 degree Stripes", () => {
    const pattern = createRasterPattern("stripes", {
      width: 1600,
      height: 900,
      spacing: 8,
      thickness: 1,
      angle: 45,
      color: "#4C82EE",
    });

    expect(pattern).toMatchObject({ width: 1600, height: 900 });
    expect(internalCanvas).toMatchObject({ width: 3200, height: 1800 });
    expect(context.imageSmoothingQuality).toBe("high");
  });

  it("enforces normal, diagonal, and primitive limits", () => {
    expect(() =>
      getRasterGenerationStats("grid", {
        width: 5000,
        height: 5000,
        spacing: 8,
        thickness: 1,
        color: "#4C82EE",
      }),
    ).toThrow("pixel");
    expect(() =>
      getRasterGenerationStats("stripes", {
        width: 3000,
        height: 2000,
        spacing: 8,
        thickness: 1,
        angle: 45,
        color: "#4C82EE",
      }),
    ).toThrow("supersampling");
    expect(() =>
      getRasterGenerationStats("dots", {
        width: 1000,
        height: 1000,
        spacing: 1,
        dotSize: 1,
        dotsLayout: "grid",
        color: "#4C82EE",
      }),
    ).toThrow("drawing operations");
  });
});
