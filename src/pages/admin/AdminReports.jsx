import {
  BookOpen,
  Shield,
  FileText,
  BarChart3,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { A, ADMIN_CSS, ABtn, APanel } from "../../components/admin/AdminDS";

const STYLES = `${ADMIN_CSS}
  @keyframes rpt-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }

  .rpt-card {
    background: rgba(13,15,17,0.93);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 22px 22px 20px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: 0;
    cursor: default;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }
  .rpt-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  }
  .rpt-card::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    border-radius: inherit;
  }
  .rpt-card:hover::before { opacity: 1; }

  .rpt-fmt {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 7px;
    border-radius: 5px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .rpt-gen-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.14s, border-color 0.14s;
    white-space: nowrap;
    border: none;
  }
`;

const MODULES = [
  {
    icon:     BookOpen,
    title:    "Financeiro",
    desc:     "Balancete, DRE, fluxo de caixa e integridade do ledger. Exportação detalhada por período com conciliação automática.",
    href:     "/admin/accounting",
    color:    A.blue,
    formats:  ["CSV", "JSON", "PDF"],
    lastGen:  "Hoje, 09:41",
    status:   "ok",
    stats:    { label: "Último período", value: "Abril 2026" },
  },
  {
    icon:     Shield,
    title:    "Compliance",
    desc:     "Relatórios por usuário, risco agregado, financeiro e trilha de auditoria. Inclui scoring de risco e alertas regulatórios.",
    href:     "/admin/compliance",
    color:    A.amber,
    formats:  ["PDF", "CSV"],
    lastGen:  "Ontem, 18:22",
    status:   "ok",
    stats:    { label: "Usuários auditados", value: "1.240" },
  },
  {
    icon:     FileText,
    title:    "Auditoria",
    desc:     "Log completo de ações administrativas, alterações de status e operações críticas. Imutável e assinado digitalmente.",
    href:     "/admin/audit",
    color:    A.purple,
    formats:  ["PDF", "JSON"],
    lastGen:  "Hoje, 07:00",
    status:   "ok",
    stats:    { label: "Eventos registrados", value: "38.491" },
  },
  {
    icon:     BarChart3,
    title:    "Operacional",
    desc:     "Volume de transações, aprovações e rejeições por gateway, tempo médio de processamento e taxa de sucesso por canal.",
    href:     null,
    color:    A.green,
    formats:  ["CSV", "JSON"],
    lastGen:  null,
    status:   "soon",
    stats:    { label: "Em breve", value: "—" },
  },
];

const FMT_COLORS = {
  CSV:  { bg: "rgba(57,217,138,0.10)",  c: A.green,  bd: "rgba(57,217,138,0.22)"  },
  JSON: { bg: "rgba(59,130,246,0.10)",  c: A.blue,   bd: "rgba(59,130,246,0.22)"  },
  PDF:  { bg: "rgba(245,158,11,0.10)",  c: A.amber,  bd: "rgba(245,158,11,0.22)"  },
};

function FormatBadge({ fmt }) {
  const cfg = FMT_COLORS[fmt] || {};
  return (
    <span
      className="rpt-fmt"
      style={{ background: cfg.bg, color: cfg.c, border: `1px solid ${cfg.bd}` }}
    >
      {fmt}
    </span>
  );
}

function ModuleCard({ mod, isMobile }) {
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (mod.status === "soon" || generating) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);
  };

  const accent = mod.color;

  return (
    <div
      className="rpt-card"
      style={{
        "--card-accent": accent,
        borderColor: `rgba(255,255,255,0.07)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent + "33";
        e.currentTarget.style.boxShadow   = `0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px ${accent}18 inset`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow   = "";
      }}
    >
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.55, borderRadius: "16px 16px 0 0" }} />

      {/* Icon + title */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: accent + "18",
              border: `1px solid ${accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, color: accent,
            }}
          >
            <mod.icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: A.white, lineHeight: 1.2 }}>{mod.title}</div>
            {mod.status === "soon" && (
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: A.muted, textTransform: "uppercase" }}>
                Em breve
              </span>
            )}
          </div>
        </div>
        {/* Stats chip */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: A.white, letterSpacing: "-0.02em" }}>{mod.stats.value}</div>
          <div style={{ fontSize: 9, color: A.muted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{mod.stats.label}</div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: A.light, lineHeight: 1.7, marginBottom: 18, flexGrow: 1 }}>
        {mod.desc}
      </div>

      {/* Formats + last generated */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {mod.formats.map((f) => <FormatBadge key={f} fmt={f} />)}
        </div>
        {mod.lastGen ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: A.muted }}>
            <Clock size={10} />
            {mod.lastGen}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: A.dim }}>Nunca gerado</div>
        )}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "0 0 16px" }} />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="rpt-gen-btn"
          onClick={handleGenerate}
          disabled={mod.status === "soon" || generating}
          style={{
            flex: 1,
            background: mod.status === "soon" ? "rgba(255,255,255,0.03)" : accent + "18",
            border: `1px solid ${mod.status === "soon" ? "rgba(255,255,255,0.06)" : accent + "32"}`,
            color: mod.status === "soon" ? A.dim : accent,
            opacity: mod.status === "soon" ? 0.5 : 1,
          }}
        >
          {generating ? (
            <>
              <div style={{ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${accent}40`, borderTopColor: accent, animation: "a-spin 0.7s linear infinite" }} />
              Gerando...
            </>
          ) : (
            <>
              <Download size={11} />
              {mod.status === "soon" ? "Indisponível" : "Gerar relatório"}
            </>
          )}
        </button>

        {mod.href && (
          <button
            className="rpt-gen-btn a-btn"
            onClick={() => navigate(mod.href)}
            style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: A.light }}
          >
            <ExternalLink size={11} />
            Módulo
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminReports({ isMobile }) {
  return (
    <div className="page a-up" style={{ maxWidth: 1280 }}>
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: A.white, margin: 0, letterSpacing: "-0.02em" }}>
              Relatórios
            </h1>
            <p style={{ fontSize: 12, color: A.muted, margin: "4px 0 0", lineHeight: 1.5 }}>
              Central de geração e exportação · 4 módulos disponíveis
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ABtn className="blue">
              <Clock size={11} />
              Agendar geração
            </ABtn>
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap:                 16,
          marginBottom:        24,
        }}
      >
        {MODULES.map((mod) => (
          <ModuleCard key={mod.title} mod={mod} isMobile={isMobile} />
        ))}
      </div>

      {/* Info bar */}
      <APanel style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(57,217,138,0.08)", border: "1px solid rgba(57,217,138,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle size={14} style={{ color: A.green }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: A.white, marginBottom: 2 }}>
            Relatórios customizados e agendados
          </div>
          <div style={{ fontSize: 11, color: A.muted, lineHeight: 1.5 }}>
            Agendamento automático e envio por e-mail estarão disponíveis em breve. Os módulos acima já oferecem exportações em CSV, JSON e PDF sob demanda.
          </div>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: A.green, fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: A.green, animation: "a-pulse 2s ease-in-out infinite" }} />
            3 módulos ativos
          </div>
        </div>
      </APanel>

      {/* Recent activity */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: A.dim, marginBottom: 12 }}>
          Atividade recente
        </div>
        <APanel style={{ padding: 0, overflow: "hidden" }}>
          {[
            { icon: BookOpen, color: A.blue,   label: "Relatório Financeiro gerado",    sub: "Exportado como CSV · Abril 2026",         time: "Hoje, 09:41",    fmt: "CSV"  },
            { icon: FileText, color: A.purple,  label: "Log de Auditoria exportado",     sub: "Exportado como PDF · 38.491 eventos",     time: "Hoje, 07:00",    fmt: "PDF"  },
            { icon: Shield,   color: A.amber,   label: "Relatório de Compliance gerado", sub: "Exportado como PDF · 1.240 usuários",     time: "Ontem, 18:22",   fmt: "PDF"  },
            { icon: BookOpen, color: A.blue,    label: "Relatório Financeiro gerado",    sub: "Exportado como JSON · Março 2026",        time: "01/04, 10:15",   fmt: "JSON" },
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 18px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: item.color + "14", border: `1px solid ${item.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: item.color }}>
                <item.icon size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: A.white }}>{item.label}</div>
                <div style={{ fontSize: 11, color: A.muted, marginTop: 1 }}>{item.sub}</div>
              </div>
              <span
                style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 5,
                  background: FMT_COLORS[item.fmt]?.bg,
                  color: FMT_COLORS[item.fmt]?.c,
                  border: `1px solid ${FMT_COLORS[item.fmt]?.bd}`,
                  flexShrink: 0,
                }}
              >
                {item.fmt}
              </span>
              <div style={{ fontSize: 10, color: A.dim, whiteSpace: "nowrap", flexShrink: 0 }}>{item.time}</div>
            </div>
          ))}
        </APanel>
      </div>
    </div>
  );
}
