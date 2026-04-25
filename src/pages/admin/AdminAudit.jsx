import {
  ScrollText,
  Filter,
  Download,
  RefreshCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Settings,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  Database,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import C from "../../constants/colors";
import { getAuditTrailReport } from "../../services/admin.service";

/* ── Action categories ──────────────────────────────────────────────── */
const ACTION_META = {
  kyc_submitted:                  { label: "KYC Submetido",         cat: "kyc",       color: "#3B82F6", icon: FileText   },
  kyc_under_review:               { label: "KYC Em Revisão",        cat: "kyc",       color: "#3B82F6", icon: FileText   },
  kyc_approved:                   { label: "KYC Aprovado",          cat: "kyc",       color: "#2D8659", icon: CheckCircle },
  kyc_rejected:                   { label: "KYC Rejeitado",         cat: "kyc",       color: "#EF4444", icon: XCircle    },
  kyc_manual_review:              { label: "KYC Revisão Manual",    cat: "kyc",       color: "#F59E0B", icon: FileText   },
  kyc_compliance_updated:         { label: "KYC Compliance",        cat: "kyc",       color: "#8B5CF6", icon: FileText   },
  kyc_required_cashout_blocked:   { label: "Saque Bloqueado (KYC)", cat: "risk",      color: "#EF4444", icon: Lock       },
  admin_status_update:            { label: "Status Atualizado",     cat: "admin",     color: "#F59E0B", icon: Settings   },
  admin_split_update:             { label: "Split Atualizado",      cat: "admin",     color: "#F59E0B", icon: Settings   },
  admin_routing_update:           { label: "Roteamento Atualizado", cat: "admin",     color: "#F59E0B", icon: Settings   },
  admin_config_update:            { label: "Config Atualizada",     cat: "admin",     color: "#F59E0B", icon: Settings   },
  risk_kyc_block:                 { label: "Bloqueio KYC Risk",     cat: "risk",      color: "#EF4444", icon: AlertTriangle },
  risk_sanctions_block:           { label: "Bloqueio Sanções",      cat: "risk",      color: "#EF4444", icon: AlertTriangle },
  risk_pep_review:                { label: "Revisão PEP",           cat: "risk",      color: "#F59E0B", icon: AlertTriangle },
  approval_requested:             { label: "Aprovação Solicitada",  cat: "approval",  color: "#3B82F6", icon: FileText   },
  approval_approved:              { label: "Aprovação Concedida",   cat: "approval",  color: "#2D8659", icon: CheckCircle },
  approval_rejected:              { label: "Aprovação Rejeitada",   cat: "approval",  color: "#EF4444", icon: XCircle    },
  user_frozen:                    { label: "Conta Congelada",       cat: "security",  color: "#EF4444", icon: Lock       },
  user_unfrozen:                  { label: "Conta Descongelada",    cat: "security",  color: "#2D8659", icon: Unlock     },
  user_auto_frozen:               { label: "Auto-Freeze",           cat: "security",  color: "#EF4444", icon: Lock       },
  cashout_approved:               { label: "Saque Aprovado",        cat: "financial", color: "#2D8659", icon: DollarSign },
  cashout_rejected:               { label: "Saque Rejeitado",       cat: "financial", color: "#EF4444", icon: DollarSign },
  accounting_report_generated:    { label: "Relatório Contábil",    cat: "report",    color: "#8B5CF6", icon: Database   },
  accounting_export:              { label: "Export Contábil",       cat: "report",    color: "#8B5CF6", icon: Database   },
  compliance_report_generated:    { label: "Relatório Compliance",  cat: "report",    color: "#8B5CF6", icon: Shield     },
  compliance_pdf_generated:       { label: "PDF Compliance",        cat: "report",    color: "#8B5CF6", icon: Shield     },
  backup_created:                 { label: "Backup Criado",         cat: "security",  color: "#F59E0B", icon: Database   },
};

const CATEGORIES = [
  { id: "",         label: "Todas"      },
  { id: "kyc",      label: "KYC"        },
  { id: "admin",    label: "Admin"      },
  { id: "security", label: "Segurança"  },
  { id: "financial",label: "Financeiro" },
  { id: "approval", label: "Aprovações" },
  { id: "risk",     label: "Risco"      },
  { id: "report",   label: "Relatórios" },
];

const ROLES = [
  { id: "", label: "Todos" },
  { id: "master",          label: "Master"          },
  { id: "admin",           label: "Admin"           },
  { id: "super_moderator", label: "Super Moderador" },
  { id: "moderator",       label: "Moderador"       },
  { id: "system",          label: "Sistema"         },
];

const PAGE_SIZE = 25;

/* ── Helpers ────────────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function shortId(id) {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/* ── ActionBadge ────────────────────────────────────────────────────── */
function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, color: C.muted, icon: FileText };
  const Icon = meta.icon;
  return (
    <span
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            5,
        padding:        "3px 9px 3px 6px",
        borderRadius:   99,
        fontSize:       11,
        fontWeight:     700,
        background:     meta.color + "18",
        color:          meta.color,
        border:         `1px solid ${meta.color}28`,
        whiteSpace:     "nowrap",
        maxWidth:       200,
      }}
    >
      <Icon size={11} style={{ flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}

/* ── RoleBadge ──────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const MAP = {
    master:          { color: "#E8B340", label: "Master"     },
    admin:           { color: "#EF4444", label: "Admin"      },
    super_moderator: { color: "#8B5CF6", label: "Super Mod"  },
    moderator:       { color: "#3B82F6", label: "Moderador"  },
    system:          { color: "#5A6A7E", label: "Sistema"    },
  };
  const m = MAP[role] || { color: C.muted, label: role };
  return (
    <span
      style={{
        display:      "inline-block",
        padding:      "2px 8px",
        borderRadius: 99,
        fontSize:     10,
        fontWeight:   700,
        background:   m.color + "18",
        color:        m.color,
        border:       `1px solid ${m.color}28`,
        textTransform: "capitalize",
        whiteSpace:   "nowrap",
      }}
    >
      {m.label}
    </span>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────── */
const SKEL_STYLES = `
@keyframes a-skel { 0%,100%{opacity:.4} 50%{opacity:.9} }
.a-skel { animation: a-skel 1.4s ease infinite; background: rgba(255,255,255,0.05); border-radius: 6px; }
`;

function SkeletonRow() {
  return (
    <tr>
      {[60, 180, 80, 90, 90, 100].map((w, i) => (
        <td key={i} style={{ padding: "12px 14px" }}>
          <div className="a-skel" style={{ height: 14, width: w, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Main ───────────────────────────────────────────────────────────── */
export default function AdminAuditPage({ isMobile }) {
  const [events,      setEvents]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);

  const [from,     setFrom]     = useState(daysAgo(7));
  const [to,       setTo]       = useState(today());
  const [catFilter,  setCatFilter]   = useState("");
  const [roleFilter, setRoleFilter]  = useState("");
  const [entitySearch, setEntitySearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditTrailReport({
        from,
        to,
        entityId: entitySearch || undefined,
      });
      setEvents(res.events ?? []);
      setTotal(res.totalEvents ?? 0);
      setPage(1);
    } catch {
      setError("Erro ao carregar trilha de auditoria.");
    } finally {
      setLoading(false);
    }
  }, [from, to, entitySearch]);

  useEffect(() => { load(); }, []);

  /* client-side filtering by category + role */
  const filtered = events.filter((e) => {
    if (catFilter) {
      const cat = (ACTION_META[e.action] || {}).cat || "";
      if (cat !== catFilter) return false;
    }
    if (roleFilter && e.actorRole !== roleFilter) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage  = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function downloadPdf() {
    try {
      const res = await getAuditTrailReport({ from, to, entityId: entitySearch || undefined, format: "pdf" });
      const url = URL.createObjectURL(new Blob([res], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `audit-trail-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }

  const INPUT_STYLE = {
    background:   "rgba(255,255,255,0.04)",
    border:       `1px solid ${C.border}`,
    borderRadius: 8,
    color:        C.white,
    fontSize:     12,
    padding:      "7px 10px",
    fontFamily:   "inherit",
    outline:      "none",
  };

  const SELECT_STYLE = { ...INPUT_STYLE, cursor: "pointer" };

  return (
    <div className="page">
      <style>{SKEL_STYLES}</style>

      <AdminPageHeader
        title="Auditoria"
        subtitle="Trilha completa de ações administrativas e operações críticas"
        onRefresh={load}
        refreshing={loading}
        actions={
          <button
            onClick={downloadPdf}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          6,
              padding:      "7px 16px",
              borderRadius: 8,
              border:       `1px solid rgba(139,92,246,0.3)`,
              background:   "rgba(139,92,246,0.08)",
              color:        "#8B5CF6",
              fontSize:     12,
              fontWeight:   700,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            <Download size={13} />
            PDF
          </button>
        }
      />

      {/* ── Filters ────────────────────────────────────────────── */}
      <div
        style={{
          background:   C.card,
          border:       `1px solid ${C.border}`,
          borderRadius: 14,
          padding:      "16px 18px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr auto",
            gap:                 10,
            alignItems:          "end",
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>De</div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...INPUT_STYLE, width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Até</div>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...INPUT_STYLE, width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Categoria</div>
            <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} style={{ ...SELECT_STYLE, width: "100%" }}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Perfil do Ator</div>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={{ ...SELECT_STYLE, width: "100%" }}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <button
            onClick={load}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          6,
              padding:      "7px 16px",
              borderRadius: 8,
              border:       `1px solid rgba(45,134,89,0.3)`,
              background:   "rgba(45,134,89,0.08)",
              color:        C.green,
              fontSize:     12,
              fontWeight:   700,
              cursor:       "pointer",
              fontFamily:   "inherit",
              whiteSpace:   "nowrap",
            }}
          >
            <Filter size={13} />
            Filtrar
          </button>
        </div>

        {/* Entity search */}
        <div style={{ marginTop: 10, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.dim, pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Buscar por ID de entidade ou usuário…"
            value={entitySearch}
            onChange={(e) => setEntitySearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ ...INPUT_STYLE, width: "100%", paddingLeft: 30 }}
          />
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            12,
          marginBottom:   14,
          padding:        "10px 16px",
          background:     C.card,
          border:         `1px solid ${C.border}`,
          borderRadius:   10,
          fontSize:       12,
        }}
      >
        <ScrollText size={14} style={{ color: C.green, flexShrink: 0 }} />
        <span style={{ color: C.muted }}>
          {loading ? "Carregando…" : (
            <>
              <strong style={{ color: C.white }}>{filtered.length.toLocaleString("pt-BR")}</strong>
              {filtered.length !== total && <span> de <strong style={{ color: C.muted }}>{total.toLocaleString("pt-BR")}</strong> total</span>}
              <span> eventos</span>
            </>
          )}
        </span>
        {(catFilter || roleFilter || entitySearch) && (
          <button
            onClick={() => { setCatFilter(""); setRoleFilter(""); setEntitySearch(""); }}
            style={{
              marginLeft:   "auto",
              padding:      "3px 10px",
              borderRadius: 6,
              border:       `1px solid ${C.border}`,
              background:   "transparent",
              color:        C.muted,
              fontSize:     11,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      {error ? (
        <div
          style={{
            padding:      "20px 18px",
            borderRadius: 12,
            background:   "rgba(239,68,68,0.07)",
            border:       `1px solid rgba(239,68,68,0.18)`,
            color:        "#EF4444",
            fontSize:     13,
            display:      "flex",
            alignItems:   "center",
            gap:          10,
          }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      ) : (
        <div
          style={{
            background:   C.card,
            border:       `1px solid ${C.border}`,
            borderRadius: 14,
            overflow:     "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Horário", "Ação", "Perfil", "Alvo", "ID Alvo", "Metadados"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding:       "11px 14px",
                        textAlign:     "left",
                        fontSize:      10,
                        fontWeight:    700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color:         C.dim,
                        whiteSpace:    "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 14px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                      Nenhum evento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((ev, i) => (
                    <tr
                      key={ev.id}
                      style={{
                        borderBottom:    i < pageItems.length - 1 ? `1px solid ${C.border}` : "none",
                        transition:      "background 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "11px 14px", fontSize: 11, color: C.muted, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {fmtDate(ev.timestamp)}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <ActionBadge action={ev.action} />
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <RoleBadge role={ev.actorRole} />
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: C.muted, textTransform: "capitalize" }}>
                        {ev.targetType || "—"}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: C.dim, fontFamily: "monospace" }}>
                        {shortId(ev.targetId || ev.actorId)}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: C.dim, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.metadata && Object.keys(ev.metadata).length > 0
                          ? Object.entries(ev.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ")
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pageCount > 1 && (
            <div
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                padding:        "12px 16px",
                borderTop:      `1px solid ${C.border}`,
                fontSize:       12,
              }}
            >
              <span style={{ color: C.muted }}>
                Página <strong style={{ color: C.white }}>{safePage}</strong> de <strong style={{ color: C.white }}>{pageCount}</strong>
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  style={{
                    display:      "inline-flex",
                    alignItems:   "center",
                    gap:          4,
                    padding:      "5px 12px",
                    borderRadius: 7,
                    border:       `1px solid ${C.border}`,
                    background:   "transparent",
                    color:        safePage <= 1 ? C.dim : C.muted,
                    fontSize:     12,
                    cursor:       safePage <= 1 ? "not-allowed" : "pointer",
                    fontFamily:   "inherit",
                  }}
                >
                  <ChevronLeft size={12} /> Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={safePage >= pageCount}
                  style={{
                    display:      "inline-flex",
                    alignItems:   "center",
                    gap:          4,
                    padding:      "5px 12px",
                    borderRadius: 7,
                    border:       `1px solid ${C.border}`,
                    background:   "transparent",
                    color:        safePage >= pageCount ? C.dim : C.muted,
                    fontSize:     12,
                    cursor:       safePage >= pageCount ? "not-allowed" : "pointer",
                    fontFamily:   "inherit",
                  }}
                >
                  Próxima <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
