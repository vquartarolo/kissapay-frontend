import { RefreshCw, ShieldCheck } from "lucide-react";
import C from "../../constants/colors";

export default function AdminPageHeader({
  title,
  subtitle,
  secure = true,
  onRefresh,
  refreshing = false,
  actions,
}) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "space-between",
        marginBottom:   28,
        flexWrap:       "wrap",
        gap:            12,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1
            style={{
              fontSize:      20,
              fontWeight:    800,
              color:         C.white,
              margin:        0,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
          {secure && (
            <span
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           5,
                padding:       "3px 9px",
                borderRadius:  999,
                background:    "rgba(45,134,89,0.08)",
                color:         "#2D8659",
                border:        "1px solid rgba(45,134,89,0.18)",
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "0.05em",
                flexShrink:    0,
              }}
            >
              <ShieldCheck size={10} />
              Ambiente seguro
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Atualizar"
            style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        6,
              padding:    "7px 14px",
              borderRadius: 8,
              border:     `1px solid ${C.border}`,
              background: "transparent",
              color:      C.muted,
              fontSize:   13,
              fontWeight: 500,
              cursor:     refreshing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity:    refreshing ? 0.5 : 1,
              transition: "color 0.1s, border-color 0.1s",
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: refreshing ? "spin 0.7s linear infinite" : "none",
              }}
            />
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
}
