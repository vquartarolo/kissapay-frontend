/**
 * Master isolated color tokens.
 * Maps to CSS custom properties injected by MasterApp.
 * NEVER import from src/constants/colors.js here.
 */
const M = {
  // Surfaces
  bg:           "var(--m-bg)",
  sidebar:      "var(--m-sidebar)",
  card:         "var(--m-card)",
  cardSoft:     "var(--m-card-soft)",
  inputDeep:    "var(--m-input-deep)",

  // Borders
  border:       "var(--m-border)",
  borderStrong: "var(--m-border-strong)",

  // Text
  white:  "var(--m-text-primary)",
  light:  "var(--m-text-secondary)",
  muted:  "var(--m-text-muted)",
  dim:    "var(--m-text-dim)",

  // Brand — theme-invariant
  green:       "#2D8659",
  greenBright: "#34A065",
  gold:        "#D4AF37",
  error:       "#E5484D",
  warn:        "#F59E0B",
  success:     "#2D8659",
};

export default M;

// CSS variable declarations injected by MasterApp
export const MASTER_CSS_VARS = `
  :root {
    --m-bg:            #09090B;
    --m-sidebar:       #0B0B0E;
    --m-card:          #141417;
    --m-card-soft:     #1C1C21;
    --m-input-deep:    #07090D;
    --m-border:        rgba(255,255,255,0.07);
    --m-border-strong: rgba(255,255,255,0.14);
    --m-text-primary:   #FFFFFF;
    --m-text-secondary: #E8EEF5;
    --m-text-muted:     #5A6A7E;
    --m-text-dim:       #2D3A48;
  }
  :root[data-master-theme="light"] {
    --m-bg:            #F1F5F9;
    --m-sidebar:       #FFFFFF;
    --m-card:          #FFFFFF;
    --m-card-soft:     #F8FAFC;
    --m-input-deep:    #F1F5F9;
    --m-border:        rgba(0,0,0,0.08);
    --m-border-strong: rgba(0,0,0,0.16);
    --m-text-primary:   #0F172A;
    --m-text-secondary: #1E293B;
    --m-text-muted:     #64748B;
    --m-text-dim:       #94A3B8;
  }
`;
