import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  FileCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ChevronRight,
  Eye,
  ScrollText,
  AlertTriangle,
  Users,
  Filter,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

/* ─── Scoped styles — ONLY CSS variables, no hardcoded colors ───── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');

  .adm { font-family: 'DM Sans', system-ui, sans-serif; }

  /* ── Hero header ── */
  .adm-hero {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    margin-bottom: 20px;
    padding: 24px 26px 0;
    background: var(--c-card);
    border: 1px solid var(--c-border-strong);
  }

  /* Subtle radial accent */
  .adm-hero::before {
    content: '';
    position: absolute;
    top: -80px; left: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45,134,89,0.09) 0%, transparent 65%);
    pointer-events: none;
  }

  /* Dot-grid texture */
  .adm-hero-dots {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.35;
    background-image: radial-gradient(circle, var(--c-border-strong) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  /* ── Tabs ── */
  .adm-tabs {
    display: flex;
    margin-top: 22px;
    border-top: 1px solid var(--c-border);
    position: relative;
    z-index: 1;
  }
  .adm-tab {
    padding: 11px 20px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', system-ui, sans-serif;
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    color: var(--c-text-muted);
    transition: color 0.2s;
    letter-spacing: 0.01em;
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .adm-tab.on { color: var(--c-text-primary); }
  .adm-tab.on::after {
    content: '';
    position: absolute;
    bottom: 0; left: 20px; right: 20px;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: #2D8659;
  }

  /* ── Stat card ── */
  .adm-stat {
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 16px;
    padding: 18px 18px 14px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }
  .adm-stat:hover {
    transform: translateY(-3px);
    border-color: var(--c-border-strong);
    box-shadow: 0 10px 28px rgba(0,0,0,0.12);
  }

  /* ── Progress bar ── */
  @keyframes adm-fill {
    from { width: 0%; }
    to   { width: var(--tw); }
  }
  .adm-bar-fill { animation: adm-fill 0.85s cubic-bezier(0.22,1,0.36,1) forwards; }

  /* ── Pulse dot ── */
  @keyframes adm-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.78); }
  }
  .adm-dot { animation: adm-pulse 2.2s ease-in-out infinite; }

  /* ── KYC row ── */
  .adm-kyc-row {
    width: 100%;
    text-align: left;
    border-radius: 12px;
    padding: 13px 15px;
    cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--c-card-soft);
    border: 1px solid var(--c-border);
    transition: border-color 0.15s, transform 0.15s;
  }
  .adm-kyc-row:hover  { transform: translateX(3px); border-color: var(--c-border-strong); }
  .adm-kyc-row.sel    { background: rgba(45,134,89,0.07); border-color: rgba(45,134,89,0.28); }

  /* ── Fade up ── */
  @keyframes adm-up {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .adm-up { animation: adm-up 0.28s ease both; }

  /* ── Spinner ── */
  @keyframes adm-spin { to { transform: rotate(360deg); } }
  .adm-spin { animation: adm-spin 0.75s linear infinite; }

  /* ── Review action button ── */
  .adm-action-btn {
    border-radius: 11px;
    padding: 11px 14px;
    font-size: 12px;
    font-weight: 800;
    font-family: 'DM Sans', system-ui, sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: filter 0.15s, transform 0.15s;
  }
  .adm-action-btn:hover:not(:disabled) { filter: brightness(1.12); transform: scale(1.02); }
  .adm-action-btn:active:not(:disabled) { transform: scale(0.98); }
  .adm-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Audit row ── */
  .adm-audit-row {
    background: var(--c-card-soft);
    border: 1px solid var(--c-border);
    border-radius: 13px;
    padding: 13px 15px;
    transition: border-color 0.15s;
  }
  .adm-audit-row:hover { border-color: var(--c-border-strong); }

  /* ── Mono ── */
  .mono { font-family: 'DM Mono', monospace; }
`;

/* ─── Helpers ─────────────────────────────────────────────────────*/
function fmtDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getKycBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "approved")     return { label: "Aprovado",   bg: "rgba(45,134,89,0.15)",  color: "#2D8659", dot: "#2D8659" };
  if (s === "rejected")     return { label: "Rejeitado",  bg: "rgba(229,72,77,0.12)",  color: "#E5484D", dot: "#E5484D" };
  if (s === "under_review") return { label: "Em análise", bg: "rgba(212,175,55,0.14)", color: "#D4AF37", dot: "#D4AF37" };
  return { label: "Pendente", bg: "rgba(100,116,139,0.12)", color: C.muted, dot: C.muted };
}

function getAuditLabel(action) {
  const s = String(action || "").toLowerCase();
  if (s === "kyc_submitted")    return "KYC enviado";
  if (s === "kyc_under_review") return "KYC em análise";
  if (s === "kyc_approved")     return "KYC aprovado";
  if (s === "kyc_rejected")     return "KYC rejeitado";
  return s || "—";
}

/* ─── Sub-components ──────────────────────────────────────────────*/
function LiveDot({ color = "#2D8659" }) {
  return (
    <span className="adm-dot" style={{
      width: 6, height: 6, borderRadius: "50%",
      background: color, display: "inline-block", flexShrink: 0,
    }} />
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{
        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.12em", color: C.dim, whiteSpace: "nowrap",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function StatusPill({ label, bg, color, dot }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 999,
      background: bg, color, fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <LiveDot color={dot} />
      {label}
    </span>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 9, padding: "7px 11px",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: C.dim, marginBottom: 4,
      }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: C.light }}>
        {value || "—"}
      </div>
    </div>
  );
}

function StatCard({ title, value, helper, icon, accent = "#2D8659", total, index = 0 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="adm-stat adm-up" style={{ animationDelay: `${index * 55}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent,
        }}>
          {icon}
        </div>
        {total > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: accent,
            background: `${accent}14`, padding: "3px 7px", borderRadius: 6,
          }}>
            {pct}%
          </span>
        )}
      </div>

      <div style={{
        fontSize: 34, fontWeight: 900, color: C.white,
        letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 3,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>

      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.09em", color: C.dim, marginBottom: 10,
      }}>
        {title}
      </div>

      <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div className="adm-bar-fill" style={{
          height: "100%",
          background: `linear-gradient(90deg, ${accent}55, ${accent})`,
          borderRadius: 2,
          "--tw": `${pct}%`,
        }} />
      </div>

      <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>{helper}</div>
    </div>
  );
}

function EmptyState({ text, loading }) {
  return (
    <div style={{ padding: "36px 0", textAlign: "center" }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="adm-spin" style={{
            width: 26, height: 26, borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: "#2D8659",
          }} />
          <span style={{ fontSize: 12, color: C.dim }}>{text}</span>
        </div>
      ) : (
        <>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: C.cardSoft, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", color: C.dim,
          }}>
            <Filter size={17} />
          </div>
          <div style={{ fontSize: 13, color: C.dim }}>{text}</div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard({ isMobile }) {
  const { user } = useAuth();

  const [activeTab,       setActiveTab]       = useState("kyc");
  const [loadingKyc,      setLoadingKyc]      = useState(true);
  const [loadingLogs,     setLoadingLogs]      = useState(true);
  const [submitting,      setSubmitting]       = useState(false);
  const [kycStatusFilter, setKycStatusFilter]  = useState("pending");
  const [kycRows,         setKycRows]          = useState([]);
  const [selectedKyc,     setSelectedKyc]      = useState(null);
  const [reviewReason,    setReviewReason]     = useState("");
  const [feedback,        setFeedback]         = useState("");
  const [auditAction,     setAuditAction]      = useState("all");
  const [auditSearch,     setAuditSearch]      = useState("");
  const [auditRows,       setAuditRows]        = useState([]);
  const [auditPagination, setAuditPagination]  = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  useEffect(() => { document.title = "Backoffice • OrionPay"; }, []);

  async function loadKyc(showLoading = true) {
    try {
      if (showLoading) setLoadingKyc(true);
      const query = kycStatusFilter && kycStatusFilter !== "all"
        ? `?status=${encodeURIComponent(kycStatusFilter)}` : "";
      const { data } = await api.get(`/kyc/admin/list${query}`);
      const rows = Array.isArray(data?.kyc) ? data.kyc : [];
      setKycRows(rows);
      if (selectedKyc?._id) {
        const fresh = rows.find(i => i._id === selectedKyc._id);
        setSelectedKyc(fresh || null);
      }
    } catch { setKycRows([]); }
    finally { if (showLoading) setLoadingKyc(false); }
  }

  async function loadAuditLogs(page = 1, showLoading = true) {
    try {
      if (showLoading) setLoadingLogs(true);
      const p = new URLSearchParams();
      p.set("page", String(page)); p.set("limit", "20");
      if (auditAction !== "all") p.set("action", auditAction);
      if (auditSearch.trim()) p.set("search", auditSearch.trim());
      const { data } = await api.get(`/kyc/admin/audit-logs?${p.toString()}`);
      setAuditRows(Array.isArray(data?.items) ? data.items : []);
      setAuditPagination(data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { setAuditRows([]); }
    finally { if (showLoading) setLoadingLogs(false); }
  }

  useEffect(() => { loadKyc(true); }, [kycStatusFilter]);
  useEffect(() => { loadAuditLogs(1, true); }, [auditAction]);
  useEffect(() => {
    const t = setTimeout(() => loadAuditLogs(1, true), 350);
    return () => clearTimeout(t);
  }, [auditSearch]);

  const kycSummary = useMemo(() => ({
    pending:     kycRows.filter(i => i.status === "pending").length,
    underReview: kycRows.filter(i => i.status === "under_review").length,
    approved:    kycRows.filter(i => i.status === "approved").length,
    rejected:    kycRows.filter(i => i.status === "rejected").length,
    total:       kycRows.length,
  }), [kycRows]);

  async function openKycDetails(id) {
    try {
      const { data } = await api.get(`/kyc/admin/${id}`);
      setSelectedKyc(data?.kyc || null);
      setReviewReason(""); setFeedback("");
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao carregar detalhes do KYC.");
    }
  }

  async function handleReview(decision) {
    if (!selectedKyc?._id) return;
    if (decision === "rejected" && !reviewReason.trim()) {
      setFeedback("Informe o motivo da rejeição antes de continuar.");
      return;
    }
    try {
      setSubmitting(true); setFeedback("");
      const { data } = await api.patch(`/kyc/admin/${selectedKyc._id}/review`, {
        decision, reason: decision === "rejected" ? reviewReason.trim() : "",
      });
      setFeedback(data?.msg || "Status atualizado com sucesso.");
      await Promise.all([loadKyc(false), loadAuditLogs(1, false)]);
      await openKycDetails(selectedKyc._id);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao atualizar o status do KYC.");
    } finally { setSubmitting(false); }
  }

  const isErr = (msg) => String(msg || "").toLowerCase().includes("erro");

  /* ── Shared inline styles — ALL CSS vars ─────────────────────── */
  const panelStyle = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: 22,
  };

  const inputStyle = {
    background: C.inputDeep,
    border: `1px solid ${C.border}`,
    color: C.white,
    borderRadius: 10,
    padding: "9px 12px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  };

  const refreshBtnStyle = {
    ...inputStyle,
    display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700,
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="adm">
      <style>{STYLES}</style>

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div className="adm-hero">
        <div className="adm-hero-dots" />
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: "rgba(45,134,89,0.15)",
                border: "1px solid rgba(45,134,89,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={13} color="#2D8659" />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#2D8659",
              }}>
                Backoffice OrionPay
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LiveDot />
              <span style={{ fontSize: 11, color: "#2D8659", fontWeight: 600 }}>Sistema ativo</span>
            </div>
          </div>

          {/* Title + user chip */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? 22 : 28, fontWeight: 900, color: C.white,
                letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 6,
              }}>
                Painel Administrativo
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Gerencie KYC, revise documentos e acompanhe o log de auditoria
              </p>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.cardSoft, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "9px 14px",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(45,134,89,0.15)",
                border: "1px solid rgba(45,134,89,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Users size={14} color="#2D8659" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>
                  {user?.name || "Administrador"}
                </div>
                <div style={{ fontSize: 10, color: "#2D8659", fontWeight: 600 }}>
                  {user?.role || "admin"}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="adm-tabs">
            {[
              { key: "kyc",   label: "Revisão de KYC",   icon: <FileCheck size={13} /> },
              { key: "audit", label: "Log de Auditoria", icon: <ScrollText size={13} /> },
            ].map(t => (
              <button
                key={t.key}
                className={`adm-tab${activeTab === t.key ? " on" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KYC TAB ─────────────────────────────────────────────── */}
      {activeTab === "kyc" ? (
        <>
          {/* Stats grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12, marginBottom: 18,
          }}>
            <StatCard index={0} title="Pendentes"  value={kycSummary.pending}     helper="Aguardando revisão"  icon={<Clock3 size={15} />}       accent="#2D8659" total={kycSummary.total} />
            <StatCard index={1} title="Em análise" value={kycSummary.underReview} helper="Revisão manual"       icon={<Eye size={15} />}          accent="#D4AF37" total={kycSummary.total} />
            <StatCard index={2} title="Aprovados"  value={kycSummary.approved}    helper="Contas liberadas"     icon={<CheckCircle2 size={15} />} accent="#2D8659" total={kycSummary.total} />
            <StatCard index={3} title="Rejeitados" value={kycSummary.rejected}    helper="Documentos recusados" icon={<XCircle size={15} />}      accent="#E5484D" total={kycSummary.total} />
          </div>

          {/* List + Detail */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.35fr 0.65fr",
            gap: 16,
          }}>

            {/* KYC LIST */}
            <div style={panelStyle}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12,
              }}>
                <div>
                  <SectionLabel>Fila de KYC</SectionLabel>
                  <p style={{ fontSize: 12, color: C.dim }}>
                    {kycRows.length} {kycRows.length === 1 ? "solicitação" : "solicitações"} encontradas
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select value={kycStatusFilter} onChange={e => setKycStatusFilter(e.target.value)} style={inputStyle}>
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="under_review">Em análise</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                  <button onClick={() => loadKyc(true)} style={refreshBtnStyle}>
                    <RefreshCw size={12} /> Atualizar
                  </button>
                </div>
              </div>

              {loadingKyc ? (
                <EmptyState text="Carregando KYC..." loading />
              ) : kycRows.length === 0 ? (
                <EmptyState text="Nenhum KYC encontrado neste filtro." />
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {kycRows.map((item, idx) => {
                    const badge = getKycBadge(item.status);
                    const u = item.userId || {};
                    const isSel = selectedKyc?._id === item._id;
                    return (
                      <button
                        key={item._id}
                        className={`adm-kyc-row adm-up${isSel ? " sel" : ""}`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        onClick={() => openKycDetails(item._id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                              {item.fullName || u.name || "Sem nome"}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: C.dim }}>
                              {u.email || "Sem email"}
                            </div>
                          </div>
                          <StatusPill {...badge} />
                        </div>

                        <div style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                          gap: 6, marginBottom: 10,
                        }}>
                          <MiniInfo label="Role"    value={u.role || "user"} />
                          <MiniInfo label="Conta"   value={u.accountStatus} />
                          <MiniInfo label="Enviado" value={fmtDate(item.submittedAt || item.createdAt)} />
                        </div>

                        <div style={{ color: "#2D8659", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          Revisar <ChevronRight size={12} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KYC DETAIL */}
            <div style={{ ...panelStyle, height: "fit-content", position: "sticky", top: 20 }}>
              <SectionLabel>Revisão</SectionLabel>
              <p style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>
                {selectedKyc ? "Analise os dados e tome uma decisão" : "Selecione um KYC na lista"}
              </p>

              {!selectedKyc ? (
                <EmptyState text="Selecione um KYC na lista." />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    ["Nome",      selectedKyc?.fullName],
                    ["Email",     selectedKyc?.userId?.email],
                    ["Documento", selectedKyc?.documentNumber],
                    ["Tipo",      String(selectedKyc?.documentType || "").toUpperCase()],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      padding: "8px 0", borderBottom: `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{k}</span>
                      <span className="mono" style={{
                        fontSize: 11, fontWeight: 500, color: C.light,
                        textAlign: "right", maxWidth: "60%", wordBreak: "break-all",
                      }}>
                        {v || "—"}
                      </span>
                    </div>
                  ))}

                  <div style={{ paddingTop: 4 }}>
                    <SectionLabel>Arquivos</SectionLabel>
                    {[
                      ["Selfie",             selectedKyc?.selfieFile],
                      ["Documento",          selectedKyc?.documentFile],
                      ["Selfie + documento", selectedKyc?.livenessFile],
                      ["Comprovante",        selectedKyc?.addressProofFile],
                    ].map(([label, href]) => (
                      <div key={label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "7px 0", borderBottom: `1px solid ${C.border}`,
                      }}>
                        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
                        <a
                          href={href || "#"} target="_blank" rel="noreferrer"
                          style={{
                            color: href ? "#2D8659" : C.dim,
                            fontSize: 11, fontWeight: 700, textDecoration: "none",
                            pointerEvents: href ? "auto" : "none",
                          }}
                        >
                          {href ? "Ver arquivo →" : "Indisponível"}
                        </a>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{
                      fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                      letterSpacing: "0.1em", color: C.dim, display: "block", marginBottom: 8,
                    }}>
                      Motivo da rejeição
                    </label>
                    <textarea
                      value={reviewReason}
                      onChange={e => setReviewReason(e.target.value)}
                      placeholder="Preencha apenas se for rejeitar..."
                      style={{
                        width: "100%", minHeight: 80, resize: "vertical",
                        background: C.inputDeep, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: "10px 12px",
                        color: C.white, fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: 13, outline: "none", lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {feedback && (
                    <div style={{
                      borderRadius: 10, padding: "10px 14px", fontSize: 12, lineHeight: 1.6,
                      background: isErr(feedback) ? "rgba(229,72,77,0.07)" : "rgba(45,134,89,0.07)",
                      border: `1px solid ${isErr(feedback) ? "rgba(229,72,77,0.20)" : "rgba(45,134,89,0.20)"}`,
                      color: isErr(feedback) ? "#E5484D" : "#2D8659",
                    }}>
                      {feedback}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 7 }}>
                    {[
                      { label: "Marcar em análise", decision: "under_review", icon: <Eye size={13} />,         color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.28)" },
                      { label: "Aprovar KYC",        decision: "approved",     icon: <CheckCircle2 size={13} />, color: "#2D8659", bg: "rgba(45,134,89,0.13)",  border: "rgba(45,134,89,0.30)"  },
                      { label: "Rejeitar KYC",       decision: "rejected",     icon: <XCircle size={13} />,     color: "#E5484D", bg: "rgba(229,72,77,0.10)",  border: "rgba(229,72,77,0.25)"  },
                    ].map(({ label, decision, icon, color, bg, border }) => (
                      <button
                        key={decision}
                        className="adm-action-btn"
                        onClick={() => handleReview(decision)}
                        disabled={submitting}
                        style={{ background: bg, color, border: `1px solid ${border}` }}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>

                  <div style={{
                    background: C.cardSoft, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: "10px 13px",
                    fontSize: 11, color: C.muted, lineHeight: 1.7,
                  }}>
                    Ao aprovar, o usuário é promovido para{" "}
                    <strong style={{ color: C.white }}>seller</strong> e recebe{" "}
                    <strong style={{ color: C.white }}>seller_active</strong> quando o 2FA estiver ativo.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── AUDIT TAB ────────────────────────────────────────────*/
        <div style={panelStyle}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <SectionLabel>Log de Auditoria</SectionLabel>
              <p style={{ fontSize: 12, color: C.dim }}>
                Rastreabilidade completa das ações administrativas de KYC
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: C.inputDeep, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "9px 12px",
              }}>
                <Search size={12} color={C.dim} />
                <input
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Email, IP, motivo..."
                  style={{
                    background: "none", border: "none", outline: "none",
                    color: C.white, fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 12, minWidth: 150,
                  }}
                />
              </div>
              <select value={auditAction} onChange={e => setAuditAction(e.target.value)} style={inputStyle}>
                <option value="all">Todas ações</option>
                <option value="kyc_submitted">KYC enviado</option>
                <option value="kyc_under_review">KYC em análise</option>
                <option value="kyc_approved">KYC aprovado</option>
                <option value="kyc_rejected">KYC rejeitado</option>
              </select>
            </div>
          </div>

          {loadingLogs ? (
            <EmptyState text="Carregando logs..." loading />
          ) : auditRows.length === 0 ? (
            <EmptyState text="Nenhum log encontrado." />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {auditRows.map((item, idx) => (
                <div key={item._id} className="adm-audit-row adm-up" style={{ animationDelay: `${idx * 30}ms` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 3 }}>
                        {getAuditLabel(item.action)}
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: C.dim }}>
                        {fmtDate(item.createdAt)} · {item.actorUserId?.name || "Sistema"} · {item.actorRole || "system"}
                      </div>
                    </div>
                    <span style={{
                      padding: "4px 10px", borderRadius: 999,
                      background: "rgba(45,134,89,0.10)", color: "#2D8659",
                      fontSize: 10, fontWeight: 700,
                      border: "1px solid rgba(45,134,89,0.20)", whiteSpace: "nowrap",
                    }}>
                      {item.metadata?.userEmail || "Sem email"}
                    </span>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: 6,
                  }}>
                    <MiniInfo label="IP"          value={item.ipAddress} />
                    <MiniInfo label="Novo status" value={item.metadata?.newAccountStatus || item.metadata?.accountStatus} />
                    <MiniInfo label="Role"        value={item.metadata?.newRole} />
                  </div>
                  {item.metadata?.reason && (
                    <div style={{
                      marginTop: 10,
                      background: "rgba(229,72,77,0.05)",
                      border: "1px solid rgba(229,72,77,0.14)",
                      borderRadius: 9, padding: "8px 12px",
                      fontSize: 11, color: C.light, lineHeight: 1.6,
                    }}>
                      <strong style={{ color: "#E5484D" }}>Motivo:</strong>{" "}
                      {item.metadata.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div style={{
            marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 11, color: C.dim }}>
              Página <strong style={{ color: C.muted }}>{auditPagination.page || 1}</strong>{" "}
              de <strong style={{ color: C.muted }}>{auditPagination.totalPages || 1}</strong>
              {" · "}
              <strong style={{ color: C.muted }}>{auditPagination.total || 0}</strong> total
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Anterior", "Próxima"].map((label, i) => {
                const page  = auditPagination.page || 1;
                const total = auditPagination.totalPages || 1;
                const off   = i === 0 ? page <= 1 : page >= total;
                const next  = i === 0 ? Math.max(page - 1, 1) : Math.min(page + 1, total);
                return (
                  <button
                    key={label}
                    onClick={() => loadAuditLogs(next, true)}
                    disabled={off}
                    style={{ ...refreshBtnStyle, opacity: off ? 0.35 : 1, cursor: off ? "not-allowed" : "pointer" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Warning note ──────────────────────────────────────────── */}
      <div style={{
        marginTop: 16, borderRadius: 13, padding: "12px 16px",
        background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.16)",
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <AlertTriangle size={13} color="#D4AF37" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          Se os logs retornarem 400, verifique a ordem das rotas:{" "}
          <strong style={{ color: C.white }}>/admin/audit-logs</strong>{" "}
          deve vir antes de{" "}
          <strong style={{ color: C.white }}>/admin/:id</strong>.
        </div>
      </div>
    </div>
  );
}
