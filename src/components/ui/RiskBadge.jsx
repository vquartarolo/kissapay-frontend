import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import C from "../../constants/colors";

/** Mapeia decision + score para nível semântico de risco */
export function getRiskLevel(decision, score) {
  const d = String(decision || "").toLowerCase();
  const s = score == null ? -1 : Number(score);

  if (d === "block" || s >= 70) return "high";
  if (d === "review" || (s >= 40 && s < 70)) return "medium";
  if (d === "allow" || (s >= 0 && s < 40)) return "low";
  return null;
}

const RISK_CONFIG = {
  low:    { label: "Risco baixo", bg: "rgba(45,134,89,0.12)",  color: "#34A065", Icon: ShieldCheck },
  medium: { label: "Revisar",     bg: "rgba(245,158,11,0.12)", color: "#F59E0B", Icon: ShieldAlert },
  high:   { label: "Risco alto",  bg: "rgba(229,72,77,0.12)",  color: "#E5484D", Icon: ShieldX    },
};

/**
 * Pill de risco compacto.
 * Props:
 *   riskDecision – "allow" | "review" | "block" (ou undefined para saques antigos)
 *   riskScore    – 0–100 (ou undefined)
 *   size         – "sm" (padrão) | "md"
 */
export default function RiskBadge({ riskDecision, riskScore, size = "sm" }) {
  const level = getRiskLevel(riskDecision, riskScore);
  const isSm = size === "sm";

  if (!level) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: isSm ? "4px 8px" : "5px 10px",
          borderRadius: 999,
          background: "rgba(90,106,126,0.10)",
          color: C.muted,
          fontSize: isSm ? 11 : 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Sem análise
      </span>
    );
  }

  const { label, bg, color, Icon } = RISK_CONFIG[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: isSm ? "4px 8px" : "5px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: isSm ? 11 : 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={isSm ? 11 : 13} />
      {label}
    </span>
  );
}
