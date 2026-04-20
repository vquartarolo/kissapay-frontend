import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, ShieldCheck, User, ChevronRight,
  CheckCircle2, Clock3, Lock, AlertCircle,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import C from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";

function getVerificationMeta(user) {
  const emailVerified = Boolean(user?.emailVerified);
  const twofaEnabled  = Boolean(user?.twofaEnabled ?? user?.twofa);
  const accountStatus = String(user?.accountStatus || "").toLowerCase();

  if (!emailVerified)
    return { label: "Email pendente", color: "#F5C542", icon: Clock3 };
  if (["seller_active"].includes(accountStatus))
    return { label: "Conta ativa",    color: C.green,   icon: CheckCircle2 };
  if (["kyc_under_review", "pending", "under_review"].includes(accountStatus))
    return { label: "Em análise",     color: "#F5C542", icon: Clock3 };
  if (["kyc_rejected", "rejected"].includes(accountStatus))
    return { label: "Rejeitado",      color: C.error,   icon: AlertCircle };
  if (["kyc_approved", "approved"].includes(accountStatus) && !twofaEnabled)
    return { label: "Aguardando 2FA", color: "#F5C542", icon: ShieldCheck };
  return { label: "Conta básica",    color: C.muted,   icon: Lock };
}

function SettingsCard({ title, desc, icon, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", cursor: "pointer",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "20px",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        textAlign: "left", fontFamily: "inherit",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.borderStrong;
        e.currentTarget.style.transform   = "translateY(-2px)";
        e.currentTarget.style.boxShadow   = "0 8px 28px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.transform   = "translateY(0)";
        e.currentTarget.style.boxShadow   = "0 1px 3px rgba(0,0,0,0.25)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: C.cardSoft,
          border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.white, flexShrink: 0,
        }}>
          {icon}
        </div>
        {badge && (
          <div style={{
            padding: "4px 10px", borderRadius: 999,
            background: `${badge.color}14`,
            border: `1px solid ${badge.color}22`,
            color: badge.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            {badge.label}
          </div>
        )}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 6, letterSpacing: "-0.01em" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
        {desc}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.green, fontSize: 12, fontWeight: 700 }}>
        Acessar <ChevronRight size={13} />
      </div>
    </button>
  );
}

export default function ConfiguracoesHome({ isMobile }) {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const verificationBadge = useMemo(() => getVerificationMeta(user), [user]);

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie sua conta, segurança e verificação"
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: 16,
      }}>
        <SettingsCard
          title="Dados pessoais"
          desc="Informações da conta, empresa e dados de recebimento."
          icon={<User size={18} />}
          onClick={() => navigate("/configuracoes/dados")}
        />
        <SettingsCard
          title="Segurança"
          desc="Ative o 2FA, gerencie sessões ativas e altere sua senha."
          icon={<ShieldCheck size={18} />}
          onClick={() => navigate("/configuracoes/seguranca")}
        />
        <SettingsCard
          title="Verificação de conta"
          desc="Envie documentos, acompanhe o KYC e ative sua conta completa."
          icon={<CreditCard size={18} />}
          badge={{ label: verificationBadge.label, color: verificationBadge.color }}
          onClick={() => navigate("/configuracoes/verificacao")}
        />
      </div>
    </div>
  );
}
