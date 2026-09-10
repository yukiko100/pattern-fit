import type { RasterPattern } from "./raster";
import type { PatternType } from "./types";

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG Blob generation failed."));
      }
    }, "image/png");
  });

export const getDownloadFilename = (
  patternType: PatternType,
  width: number,
  height: number,
) => `pattern-fit-${patternType}-${width}x${height}.png`;

export const downloadPng = async (
  pattern: RasterPattern,
  patternType: PatternType,
) => {
  const blob = await canvasToBlob(pattern.canvas);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = getDownloadFilename(
    patternType,
    pattern.width,
    pattern.height,
  );
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};
