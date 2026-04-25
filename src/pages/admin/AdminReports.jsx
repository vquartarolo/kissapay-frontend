import { BarChart3, Download, FileText, BookOpen, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import C from "../../constants/colors";

const REPORT_CARDS = [
  {
    icon:  BookOpen,
    title: "Contabilidade",
    desc:  "Balancete, DRE, fluxo de caixa, integridade do ledger e exportação CSV/JSON.",
    href:  "/admin/accounting",
    color: "#3B82F6",
  },
  {
    icon:  Shield,
    title: "Compliance",
    desc:  "Relatórios por usuário, risco agregado, financeiro e trilha de auditoria em PDF.",
    href:  "/admin/compliance",
    color: "#F59E0B",
  },
  {
    icon:  FileText,
    title: "Auditoria",
    desc:  "Log completo de ações administrativas, alterações de status e operações críticas.",
    href:  "/admin/audit",
    color: "#8B5CF6",
  },
];

export default function AdminReports({ isMobile }) {
  const navigate = useNavigate();
  return (
    <div className="page">
      <AdminPageHeader
        title="Relatórios"
        subtitle="Central de exportação e geração de relatórios da plataforma"
      />

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap:                 16,
          marginBottom:        24,
        }}
      >
        {REPORT_CARDS.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.href)}
            style={{
              background:   C.card,
              border:       `1px solid ${C.border}`,
              borderRadius: 14,
              padding:      "22px 20px",
              cursor:       "pointer",
              transition:   "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform     = "translateY(-3px)";
              e.currentTarget.style.borderColor   = card.color + "44";
              e.currentTarget.style.boxShadow     = `0 12px 32px rgba(0,0,0,0.18)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform   = "";
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow   = "";
            }}
          >
            <div
              style={{
                width:          44,
                height:         44,
                borderRadius:   12,
                background:     card.color + "18",
                border:         `1px solid ${card.color}30`,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                marginBottom:   16,
                color:          card.color,
              }}
            >
              <card.icon size={20} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.white, marginBottom: 8 }}>
              {card.title}
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              {card.desc}
            </div>
            <div
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        6,
                marginTop:  16,
                fontSize:   12,
                fontWeight: 600,
                color:      card.color,
              }}
            >
              <Download size={12} />
              Acessar módulo
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding:      "14px 18px",
          borderRadius: 12,
          background:   "rgba(45,134,89,0.04)",
          border:       `1px solid rgba(45,134,89,0.12)`,
          fontSize:     12,
          color:        C.muted,
          lineHeight:   1.6,
        }}
      >
        <strong style={{ color: C.white }}>Relatórios customizados e agendados</strong> estarão disponíveis em breve. Os módulos acima já oferecem exportações em CSV, JSON e PDF.
      </div>
    </div>
  );
}
