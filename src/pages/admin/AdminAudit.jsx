import { Shield, ScrollText, Lock, AlertTriangle } from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function AdminAuditPage({ isMobile }) {
  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 12px",
          borderRadius: 999,
          marginBottom: 14,
          border: "1px solid rgba(45,134,89,0.20)",
          background: "rgba(45,134,89,0.07)",
          color: C.green,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <Shield size={12} />
        Área Administrativa
      </div>

      <PageHeader
        title="Auditoria"
        subtitle="Visual reservado para perfis de maior privilégio."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 14,
        }}
      >
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <ScrollText size={18} color={C.green} />
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>Pronto para expansão</div>
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            Essa categoria foi separada para manter a rastreabilidade de tudo que um administrador fizer
            dentro da plataforma: aprovações de KYC, saques, banimentos, alterações sensíveis e mudanças operacionais.
          </div>
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.18)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <AlertTriangle size={15} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
              Seu backend já possui modelo de auditoria. No próximo passo eu ligo essa tela nos endpoints corretos
              e deixo filtros por ação, IP, data, admin e alvo da alteração.
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.cardSoft,
            }}
          >
            <Lock size={15} color={C.gold} />
            <div style={{ fontSize: 13, color: C.muted }}>
              Recomendado manter acesso apenas para <strong style={{ color: C.white }}>admin</strong> e <strong style={{ color: C.white }}>master</strong>.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
