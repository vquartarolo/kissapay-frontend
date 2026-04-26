// OrionPay Admin Design System
// Shared tokens + CSS injected once per page via <style>{ADMIN_CSS}</style>

export const A = {
  green:     "#39D98A",
  greenDark: "#2D8659",
  greenDeep: "#0B2E1A",
  gold:      "#D6A84F",
  goldBright:"#E8C168",
  blue:      "#3B82F6",
  purple:    "#8B5CF6",
  amber:     "#F59E0B",
  red:       "#EF4444",
  redDark:   "#DC2626",
  // surfaces
  bg:        "#07080A",
  surface:   "rgba(13,15,17,0.93)",
  surfaceUp: "rgba(20,23,26,0.96)",
  glass:     "rgba(18,21,24,0.70)",
  // borders
  bd:        "rgba(255,255,255,0.07)",
  bdSoft:    "rgba(255,255,255,0.05)",
  bdBright:  "rgba(255,255,255,0.12)",
  bdGreen:   "rgba(57,217,138,0.28)",
  bdRed:     "rgba(239,68,68,0.26)",
  bdAmber:   "rgba(245,158,11,0.26)",
  // text
  white:     "#EEF2F6",
  light:     "#9EADBF",
  muted:     "#5C6E82",
  dim:       "#2D3C4A",
};

export const ADMIN_CSS = `
  @keyframes a-up   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes a-spin { to { transform:rotate(360deg); } }
  @keyframes a-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes a-skel  { 0%{background-position:-400% 0} 100%{background-position:400% 0} }

  .a-up   { animation: a-up   0.32s cubic-bezier(.16,1,.3,1) both; }
  .a-spin { animation: a-spin 0.70s linear infinite; }
  .a-live { animation: a-pulse 2s ease-in-out infinite; }

  /* ── Surfaces ───────────────────────────────── */
  .a-panel {
    background: rgba(13,15,17,0.93);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 20px 22px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
  }
  .a-panel-sm {
    background: rgba(13,15,17,0.93);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 14px 16px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  /* ── Metric rail (no individual cards) ─────── */
  .a-rail {
    display: flex;
    background: rgba(11,13,15,0.92);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .a-rail-cell {
    flex: 1;
    padding: 16px 22px;
    border-right: 1px solid rgba(255,255,255,0.06);
    min-width: 0;
  }
  .a-rail-cell:last-child { border-right: none; }

  /* ── Table rows ────────────────────────────── */
  .a-thead {
    display: grid;
    align-items: center;
    padding: 9px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .a-trow {
    display: grid;
    align-items: center;
    padding: 13px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.12s;
    cursor: pointer;
  }
  .a-trow:last-child { border-bottom: none; }
  .a-trow:hover { background: rgba(255,255,255,0.028); }
  .a-trow.sel   { background: rgba(57,217,138,0.04); border-color: rgba(57,217,138,0.10); }

  /* ── Feed rows ─────────────────────────────── */
  .a-feed {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 12px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.12s;
  }
  .a-feed:last-child { border-bottom: none; }
  .a-feed:hover { background: rgba(255,255,255,0.02); }

  /* ── Tab bar ───────────────────────────────── */
  .a-tab-bar {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
    width: fit-content;
  }
  .a-tab {
    padding: 6px 16px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: #5C6E82;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.14s, color 0.14s;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .a-tab.on { background: rgba(255,255,255,0.09); color: #EEF2F6; }

  /* ── Buttons ───────────────────────────────── */
  .a-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    color: #9EADBF;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.14s, border-color 0.14s, color 0.14s;
    white-space: nowrap;
  }
  .a-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); color: #EEF2F6; }
  .a-btn.green { background: rgba(57,217,138,0.10); border-color: rgba(57,217,138,0.32); color: #39D98A; }
  .a-btn.green:hover { background: rgba(57,217,138,0.18); border-color: rgba(57,217,138,0.50); }
  .a-btn.red  { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.28);  color: #EF4444; }
  .a-btn.red:hover  { background: rgba(239,68,68,0.16);  border-color: rgba(239,68,68,0.44);  }
  .a-btn.amber { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.28); color: #F59E0B; }
  .a-btn.blue { background: rgba(59,130,246,0.08);  border-color: rgba(59,130,246,0.28); color: #3B82F6; }
  .a-btn:disabled { opacity: 0.38; cursor: not-allowed; }

  /* ── Inputs ────────────────────────────────── */
  .a-input, .a-select {
    width: 100%;
    background: rgba(8,10,12,0.88);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 10px 13px;
    color: #EEF2F6;
    font-family: inherit;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .a-input:focus, .a-select:focus {
    border-color: rgba(57,217,138,0.38);
    box-shadow: 0 0 0 3px rgba(57,217,138,0.07);
  }
  .a-input::placeholder { color: #2D3C4A; }
  .a-select { cursor: pointer; }

  /* ── Status pill ───────────────────────────── */
  .a-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  /* ── Filter pills ──────────────────────────── */
  .a-fp {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 11px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.07);
    background: transparent;
    color: #5C6E82;
    font-size: 11px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.14s;
    white-space: nowrap;
  }
  .a-fp.on {
    border-color: var(--fp-bd, rgba(57,217,138,0.36));
    background: var(--fp-bg, rgba(57,217,138,0.08));
    color: var(--fp-c, #39D98A);
  }

  /* ── Severity left-border indicator ────────── */
  .a-sev { width: 3px; border-radius: 2px; flex-shrink: 0; align-self: stretch; min-height: 20px; }

  /* ── Skeleton ──────────────────────────────── */
  .a-skel {
    background: linear-gradient(90deg, #111316 25%, #191D21 50%, #111316 75%);
    background-size: 400% 100%;
    animation: a-skel 1.8s ease infinite;
    border-radius: 10px;
  }

  /* ── Scroll hide ───────────────────────────── */
  .a-scroll::-webkit-scrollbar { display:none; }
  .a-scroll { scrollbar-width: none; }

  /* ── Hero section ──────────────────────────── */
  .a-hero {
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    margin-bottom: 20px;
    background: linear-gradient(155deg, #050A07 0%, #07090D 45%, #060608 100%);
    border: 1px solid rgba(57,217,138,0.14);
    box-shadow: 0 0 0 1px rgba(57,217,138,0.04) inset, 0 24px 80px rgba(0,0,0,0.65);
  }

  /* ── Section label ─────────────────────────── */
  .a-sl { font-size: 9px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; color: #2D3C4A; margin-bottom: 14px; }

  /* ── Horizontal divider ────────────────────── */
  .a-hr { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 0; }
`;

// ── Reusable primitive components ──────────────────────────────────────────

export function APill({ children, color, bg, bd }) {
  return (
    <span
      className="a-pill"
      style={{ color, background: bg || `${color}18`, borderColor: bd || `${color}30` }}
    >
      {children}
    </span>
  );
}

export function ARail({ children, style }) {
  return (
    <div className="a-rail" style={{ marginBottom: 20, ...style }}>
      {children}
    </div>
  );
}

export function ARailCell({ label, value, sub, accent, delta, style }) {
  const up = delta > 0;
  return (
    <div className="a-rail-cell" style={style}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.11em", textTransform: "uppercase", color: A.dim, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: A.white, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
        {typeof delta === "number" && (
          <span style={{ fontSize: 10, fontWeight: 800, color: up ? A.green : A.red }}>
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 10, color: A.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function APanel({ children, style, className = "" }) {
  return (
    <div className={`a-panel ${className}`} style={style}>
      {children}
    </div>
  );
}

export function ASectionLabel({ children }) {
  return <div className="a-sl">{children}</div>;
}

export function ABtn({ children, className = "", onClick, disabled, style, type = "button" }) {
  return (
    <button type={type} className={`a-btn ${className}`} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}
