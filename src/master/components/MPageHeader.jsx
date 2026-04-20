import { ChevronLeft } from "lucide-react";
import M from "../theme/colors";

export default function MPageHeader({ title, subtitle, back, onBack, right }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {back && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: M.muted, fontSize: 12, fontWeight: 600,
            marginBottom: 12, padding: 0, fontFamily: "inherit",
          }}
          onMouseEnter={e => e.currentTarget.style.color = M.white}
          onMouseLeave={e => e.currentTarget.style.color = M.muted}
        >
          <ChevronLeft size={14} />
          Voltar
        </button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, color: M.white,
            letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: M.muted, marginTop: 5, lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>

      <div style={{
        height: 1, background: M.border, marginTop: 16,
      }} />
    </div>
  );
}
