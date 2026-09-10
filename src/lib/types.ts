export type PatternType = "grid" | "dots" | "stripes";

export type DotsLayout = "grid" | "diagonal";
export type StripeAngle = 0 | 45 | 90 | 135;

type BasePatternSettings = {
  width: number;
  height: number;
  spacing: number;
  color: string;
};

export type GridSettings = BasePatternSettings & {
  thickness: number;
};

export type DotsSettings = BasePatternSettings & {
  dotSize: number;
  dotsLayout: DotsLayout;
};

export type StripeSettings = BasePatternSettings & {
  thickness: number;
  angle: StripeAngle;
};

export type PatternSettings = GridSettings | DotsSettings | StripeSettings;
