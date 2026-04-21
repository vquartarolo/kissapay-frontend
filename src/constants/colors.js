// ─── ORIONPAY DESIGN TOKENS ──────────────────────────────────────
// All color values reference CSS custom properties.
// Dark-mode vars defined in App.jsx (:root).
// Light-mode vars defined in App.jsx (:root[data-theme="light"]).
// Brand accent colors (green, gold, error, warn) are theme-invariant.

const C = {
  // ── Backgrounds / Surfaces ────────────────────────────────────
  bg:           "var(--c-bg)",
  sidebar:      "var(--c-sidebar)",
  card:         "var(--c-card)",
  cardSoft:     "var(--c-card-soft)",
  inputDeep:    "var(--c-input-deep)",   // deep bg for currency inputs

  // ── Borders ───────────────────────────────────────────────────
  border:       "var(--c-border)",
  borderStrong: "var(--c-border-strong)",

  // ── Text ─────────────────────────────────────────────────────
  white:  "var(--c-text-primary)",    // active / values
  light:  "var(--c-text-secondary)",  // readable secondary
  muted:  "var(--c-text-muted)",      // labels, inactive
  dim:    "var(--c-text-dim)",        // placeholder, disabled

  // ── Brand accents — same in both themes ───────────────────────
  green:        "#2D8659",
  greenBright:  "#34A065",
  gold:         "#81B61C",

  // ── Feedback ─────────────────────────────────────────────────
  error:   "#E5484D",
  warn:    "#F59E0B",
  success: "#2D8659",
};

export default C;
