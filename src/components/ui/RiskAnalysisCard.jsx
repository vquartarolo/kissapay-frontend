import { Shield, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from "lucide-react";
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

  // Comportamento transacional
  if (r.includes("excede o limite") || r.includes("high_single_amount"))
    return "Valor alto para saque único";
  if (r.includes("limite diário excedido") || r.includes("daily_limit_exceeded"))
    return "Limite diário excedido";
  if ((r.includes("limite de") && r.includes("saques por dia")) || r.includes("too_many_cashouts"))
    return "Muitas tentativas de saque no dia";
  if (r.includes("conta criada há menos") || r.includes("new_account"))
    return "Conta criada recentemente";
  if ((r.includes("depósito") || r.includes("deposito")) && r.includes("pix"))
    return "Saque solicitado logo após depósito PIX";
  if (r.includes("média histórica") || r.includes("unusual_amount"))
    return "Valor acima do padrão histórico";
  if (r.includes("tentativas de saque") || r.includes("too_many_attempts"))
    return "Muitas tentativas em curto período";
  if ((r.includes("chave pix") && r.includes("diferente")) || r.includes("new_pix_key"))
    return "Chave PIX nunca usada antes";

  // Compliance KYC
  if (r.includes("lista de sanções"))
    return "Usuário em lista de sanções internacionais";
  if (r.includes("nível de risco aml") || r.includes("aml classificado"))
    return "Risco AML alto classificado pelo backoffice";
  if (r.includes("pessoa politicamente exposta") && r.includes("confirmado"))
    return "PEP confirmado — pessoa politicamente exposta";
  if (r.includes("possível correspondência de pep") || r.includes("possible_match"))
    return "Possível PEP — requer verificação";
  if (r.includes("sem sócios") || r.includes("ubo"))
    return "Empresa sem sócios/beneficiários (UBO) cadastrados";
  if (r.includes("sócio") && r.includes("politicamente"))
    return "Sócio da empresa identificado como PEP";
  if (r.includes("kyc em situação irregular") || r.includes("kyc irregular"))
    return "KYC em situação irregular";
  if (r.includes("nenhum documento kyc"))
    return "Sem documento KYC registrado";
  if (r.includes("kyc não aprovado") || r.includes("kyc_not_approved"))
    return "KYC ainda não aprovado";

  return reason;
}

// ── Banners de alerta de compliance ──────────────────────────────────────────

function ComplianceAlert({ type }) {
  const configs = {
    sanctions: {
      bg:    "rgba(229,72,77,0.10)",
      border:"rgba(229,72,77,0.28)",
      color: "#E5484D",
      icon:  <ShieldX size={13} />,
      text:  "Usuário em lista de sanções — operação bloqueada por compliance",
    },
    aml_high: {
      bg:    "rgba(229,72,77,0.07)",
      border:"rgba(229,72,77,0.20)",
      color: "#E5484D",
      icon:  <AlertTriangle size={13} />,
      text:  "Risco AML alto — requer revisão detalhada do backoffice",
    },
    pep: {
      bg:    "rgba(245,158,11,0.07)",
      border:"rgba(245,158,11,0.22)",
      color: "#F59E0B",
      icon:  <AlertTriangle size={13} />,
      text:  "Pessoa politicamente exposta (PEP) — aprovação requer análise manual",
    },
  };

  const c = configs[type];
  if (!c) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "9px 11px",
        borderRadius: 9,
        background: c.bg,
        border: `1px solid ${c.border}`,
        marginBottom: 8,
      }}
    >
      <span style={{ color: c.color, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <span style={{ fontSize: 12, color: c.color, lineHeight: 1.5, fontWeight: 700 }}>
        {c.text}
      </span>
    </div>
  );
}

function KycInfoRow({ label, value, color }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "5px 0",
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
      }}
    >
      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: color || C.white,
          textTransform: "capitalize",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * Props:
 *   riskScore        – 0–100
 *   riskDecision     – "allow" | "review" | "block"
 *   riskReasons      – string[]
 *   kycRiskLevel     – "low" | "medium" | "high" | null
 *   kycPepStatus     – "unknown" | "clear" | "possible_match" | "confirmed" | null
 *   kycSanctionsStatus – "unknown" | "clear" | "possible_match" | "confirmed" | null
 *   kycType          – "individual" | "business" | null
 */
export default function RiskAnalysisCard({
  riskScore,
  riskDecision,
  riskReasons,
  kycRiskLevel,
  kycPepStatus,
  kycSanctionsStatus,
  kycType,
}) {
  const level = getRiskLevel(riskDecision, riskScore);
  const score = riskScore == null ? null : Math.min(100, Math.max(0, Number(riskScore)));
  const reasons = Array.isArray(riskReasons) ? riskReasons : [];

  const hasSanctions = kycSanctionsStatus === "confirmed";
  const hasAmlHigh   = kycRiskLevel === "high";
  const hasPep       = kycPepStatus === "confirmed";

  const hasKycInfo = kycRiskLevel || kycPepStatus || kycSanctionsStatus || kycType;

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

      {/* ── Banners de alerta de compliance ── */}
      {hasSanctions && <ComplianceAlert type="sanctions" />}
      {!hasSanctions && hasAmlHigh && <ComplianceAlert type="aml_high" />}
      {!hasSanctions && hasPep && <ComplianceAlert type="pep" />}

      {/* ── Barra de score ── */}
      {score != null && (
        <div style={{ marginBottom: reasons.length > 0 || hasKycInfo ? 12 : 0 }}>
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

      {/* ── Info KYC snapshot ── */}
      {hasKycInfo && (
        <div style={{ marginBottom: reasons.length > 0 ? 12 : 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 6,
            }}
          >
            Dados KYC
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            <KycInfoRow
              label="Tipo de KYC"
              value={kycType === "business" ? "Empresa (KYB)" : kycType === "individual" ? "Individual" : null}
              color={C.white}
            />
            <KycInfoRow
              label="Risco AML"
              value={
                kycRiskLevel === "high"   ? "Alto"  :
                kycRiskLevel === "medium" ? "Médio" :
                kycRiskLevel === "low"    ? "Baixo" : null
              }
              color={
                kycRiskLevel === "high"   ? "#E5484D" :
                kycRiskLevel === "medium" ? "#F59E0B" :
                kycRiskLevel === "low"    ? "#34A065" : null
              }
            />
            <KycInfoRow
              label="Status PEP"
              value={
                kycPepStatus === "confirmed"      ? "Confirmado"       :
                kycPepStatus === "possible_match" ? "Possível match"   :
                kycPepStatus === "clear"          ? "Limpo"            : null
              }
              color={
                kycPepStatus === "confirmed"      ? "#E5484D" :
                kycPepStatus === "possible_match" ? "#F59E0B" :
                kycPepStatus === "clear"          ? "#34A065" : null
              }
            />
            <KycInfoRow
              label="Sanções"
              value={
                kycSanctionsStatus === "confirmed"      ? "Confirmado"     :
                kycSanctionsStatus === "possible_match" ? "Possível match" :
                kycSanctionsStatus === "clear"          ? "Limpo"          : null
              }
              color={
                kycSanctionsStatus === "confirmed"      ? "#E5484D" :
                kycSanctionsStatus === "possible_match" ? "#F59E0B" :
                kycSanctionsStatus === "clear"          ? "#34A065" : null
              }
            />
          </div>
        </div>
      )}

      {/* ── Motivos detectados ── */}
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
