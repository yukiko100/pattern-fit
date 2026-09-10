export type CanvasPresetId =
  "square" | "instagram-portrait" | "presentation" | "custom";

export type CanvasPreset = {
  id: Exclude<CanvasPresetId, "custom">;
  label: string;
  width: number;
  height: number;
};

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "square", label: "Square", width: 1080, height: 1080 },
  {
    id: "instagram-portrait",
    label: "Instagram Portrait",
    width: 1080,
    height: 1350,
  },
  { id: "presentation", label: "Presentation 16:9", width: 1920, height: 1080 },
];

export const INITIAL_PRESET_ID: CanvasPresetId = "instagram-portrait";
