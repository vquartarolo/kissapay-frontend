import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import C from "../../constants/colors";
import { getRiskLevel } from "./RiskBadge";

const LEVEL_CONFIG = {
  low: {
    label: "Baixo",
    bg: "rgba(45,134,89,0.06)",
    border: "rgba(45,134,89,0.18)",
    color: "#34A065",
    Icon: ShieldCheck,
  },
  medium: {
    label: "Revisar",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
    color: "#F59E0B",
    Icon: ShieldAlert,
  },
  high: {
    label: "Alto",
    bg: "rgba(229,72,77,0.06)",
    border: "rgba(229,72,77,0.18)",
    color: "#E5484D",
    Icon: ShieldX,
  },
};

function humanizeReason(reason) {
  if (!reason) return null;
  const r = String(reason).toLowerCase();

  if (r.includes("excede o limite") || r.includes("high_single_amount"))
    return "Valor alto para saque único";
  if (r.includes("limite diário excedido") || r.includes("daily_limit_exceeded"))
    return "Limite diário excedido";
  if ((r.includes("limite de") && r.includes("saques por dia")) || r.includes("too_many_cashouts"))
    return "Muitas tentativas de saque no dia";
  if (r.includes("conta criada há menos") || r.includes("new_account"))
    return "Conta criada recentemente";
  if (r.includes("kyc não aprovado") || r.includes("kyc_not_approved"))
    return "KYC ainda não aprovado";
  if ((r.includes("depósito") || r.includes("deposito")) && r.includes("pix"))
    return "Saque solicitado logo após depósito PIX";
  if (r.includes("média histórica") || r.includes("unusual_amount"))
    return "Valor acima do padrão histórico";
  if (r.includes("tentativas de saque") || r.includes("too_many_attempts"))
    return "Muitas tentativas em curto período";
  if ((r.includes("chave pix") && r.includes("diferente")) || r.includes("new_pix_key"))
    return "Chave PIX nunca usada antes";

  return reason;
}

/**
 * Card de análise de risco para o painel de detalhe do saque.
 * Props:
 *   riskScore    – 0–100 (ou undefined/null)
 *   riskDecision – "allow" | "review" | "block" (ou undefined/null)
 *   riskReasons  – string[] (ou undefined/null)
 */
export default function RiskAnalysisCard({ riskScore, riskDecision, riskReasons }) {
  const level = getRiskLevel(riskDecision, riskScore);
  const score = riskScore == null ? null : Math.min(100, Math.max(0, Number(riskScore)));
  const reasons = Array.isArray(riskReasons) ? riskReasons : [];

  // Saques sem análise (dados antigos)
  if (!level && score == null) {
    return (
      <div
        style={{
          borderRadius: 12,
          padding: "12px 14px",
          background: "rgba(90,106,126,0.07)",
          border: "1px solid rgba(90,106,126,0.14)",
          display: "flex",
          gap: 9,
          alignItems: "center",
        }}
      >
        <Shield size={14} color={C.muted} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.muted }}>
          Sem análise de risco — saque registrado antes do motor de risco.
        </span>
      </div>
    );
  }

  const { label, bg, border, color, Icon } = LEVEL_CONFIG[level];

  return (
    <div
      style={{
        borderRadius: 12,
        padding: "14px",
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      {/* ── Cabeçalho ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon size={15} color={color} />
          <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>
            Análise de risco
          </span>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            background: `${color}22`,
            color,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>

      {/* ── Barra de score ── */}
      {score != null && (
        <div style={{ marginBottom: reasons.length > 0 ? 12 : 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: C.muted,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Score
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color }}>
              {score}
              <span style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>/100</span>
            </span>
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 999,
              background: "rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                borderRadius: 999,
                background: color,
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Motivos ── */}
      {reasons.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Motivos detectados
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reasons.map((r, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: color,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                  {humanizeReason(r)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
