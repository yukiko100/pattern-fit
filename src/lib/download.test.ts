import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadPng, getDownloadFilename } from "./download";

describe("PNG download", () => {
  const createObjectURL = vi.fn(() => "blob:pattern-fit");
  const revokeObjectURL = vi.fn();
  const click = vi.fn();
  const remove = vi.fn();
  const append = vi.fn();
  const originalCreateElement = document.createElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.spyOn(document.body, "append").mockImplementation(append);
    vi.spyOn(window, "setTimeout").mockImplementation((callback) => {
      if (typeof callback === "function") {
        callback();
      }
      return 0 as unknown as number;
    });
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName !== "a") {
        return originalCreateElement.call(document, tagName);
      }

      return {
        click,
        download: "",
        href: "",
        remove,
        style: {},
      } as unknown as HTMLElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses the required filename format", () => {
    expect(getDownloadFilename("dots", 1080, 1350)).toBe(
      "pattern-fit-dots-1080x1350.png",
    );
  });

  it("downloads a PNG Blob and releases the temporary URL", async () => {
    const toBlob = vi.fn((callback: BlobCallback) =>
      callback(new Blob(["pattern"], { type: "image/png" })),
    );

    await downloadPng(
      {
        canvas: { toBlob } as unknown as HTMLCanvasElement,
        dataUrl: "data:image/png;base64,pattern",
        height: 1350,
        pixelCount: 1_458_000,
        primitiveCount: 0,
        width: 1080,
      },
      "grid",
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:pattern-fit");
  });
});
