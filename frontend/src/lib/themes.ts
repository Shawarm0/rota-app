export type Theme = "classic" | "compact" | "modern";

export const THEME_LABELS: Record<Theme, string> = {
  classic: "Classic",
  compact: "Compact",
  modern: "Modern",
};

export const THEME_DESCRIPTIONS: Record<Theme, string> = {
  classic: "Clean sidebar layout with rounded cards",
  compact: "Dense, data-focused layout with dark sidebar",
  modern: "Spacious, minimal layout with soft shadows",
};
