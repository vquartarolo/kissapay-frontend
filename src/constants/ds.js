// ─── ORIONPAY DESIGN SYSTEM ───────────────────────────────────────
// Single source of truth for spacing, typography, radius, shadows.

export const SPACE = {
  2:  2,
  4:  4,
  6:  6,
  8:  8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
};

export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  xxl:  24,
  full: 9999,
};

export const FONT_SIZE = {
  xs:   11,
  sm:   12,
  base: 13,
  md:   14,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const FONT_WEIGHT = {
  normal:    400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
};

// Elevation shadows — progressively deeper
export const SHADOW = {
  none:    "none",
  sm:      "0 1px 2px rgba(0,0,0,0.3)",
  md:      "0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
  lg:      "0 4px 20px rgba(0,0,0,0.5), 0 1px 6px rgba(0,0,0,0.3)",
  xl:      "0 8px 40px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.4)",
  modal:   "0 24px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)",
  green:   "0 4px 20px rgba(45,134,89,0.20)",
};

// Typography presets — use these for text nodes
export const T = {
  pageTitle:   { fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em" },
  sectionTitle:{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
  cardLabel:   { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
  value:       { fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" },
  valueSmall:  { fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" },
  body:        { fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
  caption:     { fontSize: 12, fontWeight: 500 },
  mono:        { fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', monospace", fontSize: 12 },
};
