import type {
  DotsSettings,
  GridSettings,
  PatternSettings,
  PatternType,
  StripeSettings,
} from "./types";

export const RASTER_LIMITS = {
  maxPixels: 16_000_000,
  maxPrimitives: 250_000,
  maxSupersamplePixels: 16_000_000,
} as const;

const DIAGONAL_SUPERSAMPLE_SCALE = 2;

export type RasterGenerationStats = {
  pixelCount: number;
  primitiveCount: number;
};

export type RasterPattern = RasterGenerationStats & {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
};

const getPositionCount = (length: number, spacing: number, offset: number) =>
  Math.max(0, Math.ceil((length - offset) / spacing));

const getGridLineCount = (length: number, spacing: number) =>
  Math.floor(length / spacing) + 1;

const getPositiveValue = (value: number, name: string) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }

  return value;
};

const getIntegerDimension = (value: number, name: string) => {
  const dimension = Math.round(value);
  if (!Number.isFinite(dimension) || dimension < 1) {
    throw new Error(`${name} must be at least 1 pixel.`);
  }

  return dimension;
};

const usesDiagonalSupersampling = (
  type: PatternType,
  settings: PatternSettings,
) =>
  type === "stripes" &&
  ((settings as StripeSettings).angle === 45 ||
    (settings as StripeSettings).angle === 135);

const getStripeLineCount = (settings: StripeSettings) => {
  const spacing = getPositiveValue(settings.spacing, "Spacing");
  const thickness = getPositiveValue(settings.thickness, "Line thickness");
  const dimension =
    settings.angle === 0
      ? settings.height
      : settings.angle === 90
        ? settings.width
        : settings.width + settings.height + thickness * 2;
  const step =
    settings.angle === 0 || settings.angle === 90
      ? spacing
      : spacing * Math.sqrt(2);

  return Math.floor(dimension / step) + 1;
};

const getDiagonalDotCount = (settings: DotsSettings) => {
  const spacing = getPositiveValue(settings.spacing, "Spacing");
  const radius = getPositiveValue(settings.dotSize, "Dot size") / 2;
  const rowSpacing = spacing / Math.sqrt(2);
  const columnSpacing = rowSpacing * 2;
  const firstRow = -radius - rowSpacing;
  let count = 0;

  for (
    let y = firstRow, row = 0;
    y <= settings.height + radius;
    y += rowSpacing, row += 1
  ) {
    const offset = row % 2 === 0 ? 0 : rowSpacing;
    for (
      let x = -radius - columnSpacing + offset;
      x <= settings.width + radius;
      x += columnSpacing
    ) {
      count += 1;
    }
  }

  return count;
};

export const getRasterGenerationStats = (
  type: PatternType,
  settings: PatternSettings,
): RasterGenerationStats => {
  const width = getIntegerDimension(settings.width, "Width");
  const height = getIntegerDimension(settings.height, "Height");
  const spacing = getPositiveValue(settings.spacing, "Spacing");
  const pixelCount = width * height;
  const normalizedSettings = { ...settings, width, height };
  const primitiveCount =
    type === "grid"
      ? getGridLineCount(width, spacing) + getGridLineCount(height, spacing)
      : type === "stripes"
        ? getStripeLineCount(normalizedSettings as StripeSettings)
        : (normalizedSettings as DotsSettings).dotsLayout === "diagonal"
          ? getDiagonalDotCount(normalizedSettings as DotsSettings)
          : getPositionCount(width, spacing, spacing / 2) *
            getPositionCount(height, spacing, spacing / 2);

  if (pixelCount > RASTER_LIMITS.maxPixels) {
    throw new Error("pixel limit");
  }

  if (
    usesDiagonalSupersampling(type, normalizedSettings) &&
    pixelCount * DIAGONAL_SUPERSAMPLE_SCALE ** 2 >
      RASTER_LIMITS.maxSupersamplePixels
  ) {
    throw new Error("supersampling limit");
  }

  if (primitiveCount > RASTER_LIMITS.maxPrimitives) {
    throw new Error("drawing operations limit");
  }

  return { pixelCount, primitiveCount };
};

const alignGridCoordinate = (position: number, thickness: number) => {
  if (Number.isInteger(thickness) && Math.round(thickness) % 2 === 1) {
    return Math.round(position) + 0.5;
  }

  return Math.round(position);
};

const drawGrid = (
  context: CanvasRenderingContext2D,
  settings: GridSettings,
) => {
  const thickness = getPositiveValue(settings.thickness, "Line thickness");
  const spacing = getPositiveValue(settings.spacing, "Spacing");

  context.beginPath();
  context.strokeStyle = settings.color;
  context.lineWidth = thickness;
  context.lineCap = "butt";

  for (let x = 0; x <= settings.width; x += spacing) {
    const coordinate = alignGridCoordinate(x, thickness);
    context.moveTo(coordinate, 0);
    context.lineTo(coordinate, settings.height);
  }

  for (let y = 0; y <= settings.height; y += spacing) {
    const coordinate = alignGridCoordinate(y, thickness);
    context.moveTo(0, coordinate);
    context.lineTo(settings.width, coordinate);
  }

  context.stroke();
};

const drawDots = (
  context: CanvasRenderingContext2D,
  settings: DotsSettings,
) => {
  const spacing = getPositiveValue(settings.spacing, "Spacing");
  const radius = getPositiveValue(settings.dotSize, "Dot size") / 2;

  context.beginPath();
  context.fillStyle = settings.color;

  if (settings.dotsLayout === "diagonal") {
    const rowSpacing = spacing / Math.sqrt(2);
    const columnSpacing = rowSpacing * 2;
    const firstRow = -radius - rowSpacing;

    for (
      let y = firstRow, row = 0;
      y <= settings.height + radius;
      y += rowSpacing, row += 1
    ) {
      const offset = row % 2 === 0 ? 0 : rowSpacing;
      for (
        let x = -radius - columnSpacing + offset;
        x <= settings.width + radius;
        x += columnSpacing
      ) {
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
  } else {
    for (let y = spacing / 2; y < settings.height; y += spacing) {
      for (let x = spacing / 2; x < settings.width; x += spacing) {
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
  }

  context.fill();
};

const getStripeOffsets = (settings: StripeSettings) => {
  const spacing = getPositiveValue(settings.spacing, "Spacing");
  const thickness = getPositiveValue(settings.thickness, "Line thickness");
  const padding = thickness;

  if (settings.angle === 0) {
    return { start: 0, end: settings.height, step: spacing };
  }

  if (settings.angle === 90) {
    return { start: 0, end: settings.width, step: spacing };
  }

  return settings.angle === 45
    ? {
        start: -padding,
        end: settings.width + settings.height + padding,
        step: spacing * Math.sqrt(2),
      }
    : {
        start: -settings.height - padding,
        end: settings.width + padding,
        step: spacing * Math.sqrt(2),
      };
};

const drawStripes = (
  context: CanvasRenderingContext2D,
  settings: StripeSettings,
) => {
  const thickness = getPositiveValue(settings.thickness, "Line thickness");
  const offsets = getStripeOffsets(settings);
  const margin = Math.hypot(settings.width, settings.height) + thickness * 2;

  context.beginPath();
  context.strokeStyle = settings.color;
  context.lineWidth = thickness;
  context.lineCap = "butt";

  for (
    let offset = offsets.start;
    offset <= offsets.end + Number.EPSILON;
    offset += offsets.step
  ) {
    if (settings.angle === 0) {
      const y = alignGridCoordinate(offset, thickness);
      context.moveTo(0, y);
      context.lineTo(settings.width, y);
    } else if (settings.angle === 90) {
      const x = alignGridCoordinate(offset, thickness);
      context.moveTo(x, 0);
      context.lineTo(x, settings.height);
    } else if (settings.angle === 45) {
      context.moveTo(-margin, offset + margin);
      context.lineTo(settings.width + margin, offset - settings.width - margin);
    } else {
      context.moveTo(-margin, -margin - offset);
      context.lineTo(settings.width + margin, settings.width + margin - offset);
    }
  }

  context.stroke();
};

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const getContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D rendering is not supported.");
  }

  return context;
};

export const createRasterPattern = (
  type: PatternType,
  settings: PatternSettings,
): RasterPattern => {
  const width = getIntegerDimension(settings.width, "Width");
  const height = getIntegerDimension(settings.height, "Height");
  const stats = getRasterGenerationStats(type, { ...settings, width, height });
  const canvas = createCanvas(width, height);
  const context = getContext(canvas);

  context.clearRect(0, 0, width, height);

  if (type === "grid") {
    context.imageSmoothingEnabled = false;
    drawGrid(context, { ...(settings as GridSettings), width, height });
  } else if (type === "stripes") {
    const stripeSettings = { ...(settings as StripeSettings), width, height };

    if (usesDiagonalSupersampling(type, stripeSettings)) {
      const internalCanvas = createCanvas(
        width * DIAGONAL_SUPERSAMPLE_SCALE,
        height * DIAGONAL_SUPERSAMPLE_SCALE,
      );
      const internalContext = getContext(internalCanvas);
      internalContext.clearRect(
        0,
        0,
        internalCanvas.width,
        internalCanvas.height,
      );
      drawStripes(internalContext, {
        ...stripeSettings,
        width: internalCanvas.width,
        height: internalCanvas.height,
        spacing: stripeSettings.spacing * DIAGONAL_SUPERSAMPLE_SCALE,
        thickness: stripeSettings.thickness * DIAGONAL_SUPERSAMPLE_SCALE,
      });

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(internalCanvas, 0, 0, width, height);
    } else {
      context.imageSmoothingEnabled = false;
      drawStripes(context, stripeSettings);
    }
  } else {
    context.imageSmoothingEnabled = false;
    drawDots(context, { ...(settings as DotsSettings), width, height });
  }

  return {
    canvas,
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
    ...stats,
  };
};
