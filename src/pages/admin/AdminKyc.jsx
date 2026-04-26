import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  RefreshCw,
  Search,
  UserCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  AlertTriangle,
  Flag,
  ShieldAlert,
  Users,
  ExternalLink,
  Eye,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { A, ADMIN_CSS, ARail, ARailCell } from "../../components/admin/AdminDS";
import {
  getAdminKycList,
  reviewAdminKyc,
  updateAdminKycCompliance,
} from "../../services/admin.service";

const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

// ── Badge maps ────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  pending:      { label: "Pendente",   bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  under_review: { label: "Em análise", bg: "rgba(129,140,248,0.12)", color: "#818CF8" },
  approved:     { label: "Aprovado",   bg: "rgba(45,134,89,0.12)",   color: "#34A065" },
  rejected:     { label: "Rejeitado",  bg: "rgba(229,72,77,0.12)",   color: "#E5484D" },
};

const COMPLIANCE_MAP = {
  unknown:        { label: "Desconhecido",   bg: "rgba(255,255,255,0.06)", color: "var(--c-text-muted)" },
  clear:          { label: "Limpo",          bg: "rgba(45,134,89,0.12)",  color: "#34A065" },
  possible_match: { label: "Possível match", bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  confirmed:      { label: "Confirmado",     bg: "rgba(229,72,77,0.12)",  color: "#E5484D" },
};

const AML_MAP = {
  low:    { label: "Baixo", bg: "rgba(45,134,89,0.12)",  color: "#34A065" },
  medium: { label: "Médio", bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  high:   { label: "Alto",  bg: "rgba(229,72,77,0.12)",  color: "#E5484D" },
};

// ── Badge components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function KycTypeBadge({ kycType }) {
  if (!kycType) return null;
  const isB = kycType === "business";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 999,
        background: isB ? "rgba(129,182,28,0.10)" : "rgba(129,140,248,0.10)",
        color: isB ? C.gold : "#818CF8",
        fontSize: 10,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {isB ? <Building2 size={9} /> : <UserCircle size={9} />}
      {isB ? "Empresa" : "Individual"}
    </span>
  );
}

function AmlBadge({ level }) {
  if (!level) return null;
  const m = AML_MAP[level];
  if (!m) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 999,
        background: m.bg,
        color: m.color,
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      AML {m.label}
    </span>
  );
}

function CompliancePill({ value, prefix }) {
  if (!value || value === "unknown") return null;
  const m = COMPLIANCE_MAP[value];
  if (!m) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 7px",
        borderRadius: 999,
        background: m.bg,
        color: m.color,
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {prefix}: {m.label}
    </span>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, title, value, helper, accent = C.green }) {
  return (
    <Card style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `${accent}16`,
            border: `1px solid ${accent}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 900,
          color: C.white,
          letterSpacing: "-0.03em",
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.dim }}>{helper}</div>
    </Card>
  );
}

function EmptyState({ text, loading }) {
  return (
    <div style={{ padding: "36px 18px", textAlign: "center" }}>
      {loading && (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            margin: "0 auto 12px",
            border: `2px solid ${C.border}`,
            borderTopColor: C.green,
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      <div style={{ fontSize: 13, color: C.muted }}>{text}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function FieldRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        padding: "8px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: C.white,
          fontWeight: 700,
          textAlign: "right",
          maxWidth: "64%",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        marginTop: 14,
        marginBottom: 4,
        paddingBottom: 4,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {children}
    </div>
  );
}

function DocCard({ label, filePath, icon }) {
  if (!filePath) {
    return (
      <div
        style={{
          padding: "14px",
          borderRadius: 12,
          border: `1px dashed ${C.border}`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Não enviado</div>
      </div>
    );
  }

  const url = `${API_HOST}${filePath}`;
  const isPdf = filePath.toLowerCase().endsWith(".pdf");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "14px",
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,0.02)",
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(45,134,89,0.10)",
              border: "1px solid rgba(45,134,89,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.green,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{label}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
              {isPdf ? "PDF" : "Imagem"} · Abrir em nova aba
            </div>
          </div>
        </div>
        <ExternalLink size={13} color={C.muted} />
      </div>
    </a>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label
        style={{
          fontSize: 12,
          color: C.muted,
          fontWeight: 600,
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: C.inputDeep,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "10px 12px",
          color: C.white,
          fontFamily: "inherit",
          fontSize: 13,
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#1a1a1a" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Status filter bar ─────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "all",          label: "Todos",      color: null },
  { key: "pending",      label: "Pendente",   color: "#F59E0B" },
  { key: "under_review", label: "Em análise", color: "#818CF8" },
  { key: "approved",     label: "Aprovado",   color: "#34A065" },
  { key: "rejected",     label: "Rejeitado",  color: "#E5484D" },
];

function StatusFilterBar({ active, counts, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {STATUS_FILTERS.map(({ key, label, color }) => {
        const isActive = active === key;
        const count = key === "all" ? counts.all : (counts[key] ?? 0);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 999,
              border: isActive
                ? `1px solid ${color || C.green}44`
                : `1px solid ${C.border}`,
              background: isActive
                ? color
                  ? `${color}18`
                  : "rgba(45,134,89,0.12)"
                : "transparent",
              color: isActive ? (color || C.green) : C.muted,
              fontSize: 12,
              fontWeight: isActive ? 800 : 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {label}
            <span
              style={{
                background: isActive
                  ? color
                    ? `${color}28`
                    : "rgba(45,134,89,0.20)"
                  : "rgba(255,255,255,0.08)",
                color: isActive ? (color || C.green) : C.dim,
                borderRadius: 999,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminKycPage({ isMobile }) {
  const { user } = useAuth();

  const [loading,         setLoading]         = useState(true);
  const [rows,            setRows]             = useState([]);
  const [selected,        setSelected]         = useState(null);
  const [search,          setSearch]           = useState("");
  const [statusFilter,    setStatusFilter]     = useState("all");
  const [activeTab,       setActiveTab]        = useState("dados");
  const [actingId,        setActingId]         = useState("");
  const [feedback,        setFeedback]         = useState("");
  const [rejectionReason, setRejectionReason]  = useState("");
  const [compForm,        setCompForm]         = useState({
    pepStatus: "unknown",
    sanctionsStatus: "unknown",
    amlRiskLevel: "",
    complianceNotes: "",
  });
  const [compSaving, setCompSaving] = useState(false);

  async function loadData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      const data = await getAdminKycList("");
      const list = Array.isArray(data?.kyc) ? data.kyc : [];
      setRows(list);
      if (selected?._id) {
        const fresh = list.find((k) => String(k._id) === String(selected._id)) || null;
        setSelected(fresh);
      }
    } catch (err) {
      console.error("Erro ao carregar KYC:", err);
      setRows([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  // Sync compliance form + reset state when selection changes
  useEffect(() => {
    if (!selected) return;
    setCompForm({
      pepStatus:       selected.pepStatus       || "unknown",
      sanctionsStatus: selected.sanctionsStatus || "unknown",
      amlRiskLevel:    selected.amlRiskLevel    || "",
      complianceNotes: selected.complianceNotes || "",
    });
    setRejectionReason("");
    setFeedback("");
    setActiveTab("dados");
  }, [selected?._id]);

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const c = { all: rows.length, pending: 0, under_review: 0, approved: 0, rejected: 0 };
    for (const row of rows) {
      if (c[row.status] !== undefined) c[row.status]++;
    }
    return c;
  }, [rows]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter((k) => k.status === statusFilter);
    }

    const term = String(search || "").trim().toLowerCase();
    if (term) {
      result = result.filter((k) => {
        const name  = String(k?.userId?.name  || k?.fullName       || "").toLowerCase();
        const email = String(k?.userId?.email || "").toLowerCase();
        const doc   = String(k?.documentNumber || "").toLowerCase();
        return name.includes(term) || email.includes(term) || doc.includes(term);
      });
    }

    return [...result].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [rows, statusFilter, search]);

  // ── Review action ─────────────────────────────────────────────────────────
  async function handleReview(decision) {
    if (!selected?._id || actingId) return;
    if (decision === "rejected" && !rejectionReason.trim()) {
      setFeedback("Preencha o motivo da rejeição antes de continuar.");
      return;
    }
    try {
      setActingId(String(selected._id));
      setFeedback("");
      const result = await reviewAdminKyc(String(selected._id), {
        decision,
        reason: decision === "rejected" ? rejectionReason.trim() : "",
      });
      setFeedback(result?.msg || "Ação executada com sucesso.");
      setRejectionReason("");
      await loadData(false);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao processar ação.");
    } finally {
      setActingId("");
    }
  }

  // ── Compliance save ───────────────────────────────────────────────────────
  async function handleSaveCompliance() {
    if (!selected?._id || compSaving) return;
    try {
      setCompSaving(true);
      setFeedback("");
      const payload = {
        pepStatus:       compForm.pepStatus,
        sanctionsStatus: compForm.sanctionsStatus,
        complianceNotes: compForm.complianceNotes,
      };
      if (compForm.amlRiskLevel) payload.amlRiskLevel = compForm.amlRiskLevel;
      const result = await updateAdminKycCompliance(String(selected._id), payload);
      setFeedback(result?.msg || "Compliance atualizado com sucesso.");
      await loadData(false);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao salvar compliance.");
    } finally {
      setCompSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="a-up" style={{ maxWidth: 1280 }}>
      <style>{ADMIN_CSS}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: A.white, margin: 0, letterSpacing: "-0.02em" }}>
            KYC / Verificação de Identidade
          </h1>
          <p style={{ fontSize: 12, color: A.muted, margin: "4px 0 0" }}>
            Revisão e aprovação de documentos enviados pelos usuários
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="a-btn"
        >
          <RefreshCw size={11} />
          Atualizar
        </button>
      </div>

      {/* Metric Rail */}
      <ARail>
        <ARailCell label="Pendentes"   value={statusCounts.pending}      sub="Aguardando análise"       accent={A.amber} />
        <ARailCell label="Em análise"  value={statusCounts.under_review}  sub="Em revisão pelo backoffice" accent="#818CF8" />
        <ARailCell label="Aprovados"   value={statusCounts.approved}      sub="Identidade verificada"    accent={A.green} />
        <ARailCell label="Total KYC"   value={statusCounts.all}           sub={`${statusCounts.rejected} rejeitados`} accent={A.gold} />
      </ARail>

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            marginBottom: 14,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.55,
            color: feedback.toLowerCase().includes("erro") ? C.error : C.green,
            background: feedback.toLowerCase().includes("erro")
              ? "rgba(229,72,77,0.08)"
              : "rgba(45,134,89,0.08)",
            border: `1px solid ${
              feedback.toLowerCase().includes("erro")
                ? "rgba(229,72,77,0.20)"
                : "rgba(45,134,89,0.20)"
            }`,
          }}
        >
          {feedback}
        </div>
      )}

      {/* Main two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
          gap: 16,
        }}
      >
        {/* ── KYC list ── */}
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
                Fila de verificações
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {filteredRows.length} KYC(s) encontrado(s)
              </div>
            </div>

            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                background: C.inputDeep,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 210,
                flex: 1,
                maxWidth: 280,
              }}
            >
              <Search size={14} color={C.muted} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, email ou documento..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  color: C.white,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Status filter bar */}
          <div style={{ marginBottom: 14 }}>
            <StatusFilterBar
              active={statusFilter}
              counts={statusCounts}
              onChange={(key) => {
                setStatusFilter(key);
                setSelected(null);
              }}
            />
          </div>

          {/* List rows */}
          {loading ? (
            <EmptyState text="Carregando KYC..." loading />
          ) : filteredRows.length === 0 ? (
            <EmptyState text="Nenhum KYC encontrado para este filtro." />
          ) : (
            filteredRows.map((item, index) => {
              const isSelected = String(selected?._id) === String(item._id);
              const userName = item?.userId?.name || item?.fullName || "Sem nome";
              const userEmail = item?.userId?.email || "";
              const ini = initials(userName);

              return (
                <button
                  key={String(item._id)}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setFeedback("");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    background: isSelected ? "rgba(45,134,89,0.07)" : "transparent",
                    border: "none",
                    borderBottom:
                      index < filteredRows.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    fontFamily: "inherit",
                  }}
                >
                  {/* Initials avatar */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "rgba(45,134,89,0.15)",
                      border: "1px solid rgba(45,134,89,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: C.greenBright,
                    }}
                  >
                    {ini || "?"}
                  </div>

                  {/* Info block */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.white }}>
                        {userName}
                      </span>
                      <KycTypeBadge kycType={item.kycType} />
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                      {userEmail || "Sem email"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flexWrap: "wrap",
                      }}
                    >
                      <StatusBadge status={item.status} />
                      <AmlBadge level={item.amlRiskLevel} />
                      <CompliancePill value={item.pepStatus} prefix="PEP" />
                      <CompliancePill value={item.sanctionsStatus} prefix="Sanções" />
                    </div>
                  </div>

                  {/* Date */}
                  <div
                    style={{
                      fontSize: 11,
                      color: C.dim,
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    {fmtDate(item.submittedAt)}
                  </div>
                </button>
              );
            })
          )}
        </Card>

        {/* ── Detail panel ── */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
            Detalhes do KYC
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: selected ? 14 : 16 }}>
            {selected
              ? "Revise os dados e tome uma decisão."
              : "Selecione um KYC na lista ao lado."}
          </div>

          {!selected ? (
            <EmptyState text="Nenhum KYC selecionado." />
          ) : (
            <div>
              {/* KYC header card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "rgba(45,134,89,0.15)",
                    border: "1px solid rgba(45,134,89,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    color: C.greenBright,
                  }}
                >
                  {initials(selected?.userId?.name || selected?.fullName || "") || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: C.white,
                      marginBottom: 5,
                    }}
                  >
                    {selected?.userId?.name || selected?.fullName || "—"}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
                  >
                    <StatusBadge status={selected.status} />
                    <KycTypeBadge kycType={selected.kycType} />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  marginBottom: 16,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {[
                  { key: "dados",      label: "Dados",      icon: <FileText size={12} /> },
                  { key: "documentos", label: "Documentos", icon: <Eye size={12} /> },
                  { key: "compliance", label: "Compliance", icon: <Flag size={12} /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "9px 12px",
                      border: "none",
                      background: "transparent",
                      borderBottom:
                        activeTab === key
                          ? `2px solid ${C.green}`
                          : "2px solid transparent",
                      color: activeTab === key ? C.white : C.muted,
                      fontSize: 12,
                      fontWeight: activeTab === key ? 800 : 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginBottom: -1,
                      transition: "color 0.15s",
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Tab: Dados ── */}
              {activeTab === "dados" && (
                <div style={{ display: "grid", gap: 2 }}>
                  <FieldRow label="Nome completo"  value={selected.fullName} />
                  <FieldRow label="Email"           value={selected?.userId?.email} />
                  <FieldRow
                    label="Documento"
                    value={`${(selected.documentType || "").toUpperCase()} ${selected.documentNumber}`}
                  />
                  <FieldRow
                    label="Tipo de KYC"
                    value={
                      selected.kycType === "business"
                        ? "Empresa (KYB)"
                        : selected.kycType === "individual"
                        ? "Individual"
                        : "—"
                    }
                  />
                  <FieldRow label="Status da conta" value={selected?.userId?.accountStatus} />
                  <FieldRow label="Role"             value={selected?.userId?.role} />
                  <FieldRow label="Enviado em"       value={fmtDate(selected.submittedAt)} />
                  <FieldRow label="Revisado em"      value={fmtDate(selected.reviewedAt)} />
                  {selected.rejectionReason && (
                    <FieldRow label="Motivo rejeição" value={selected.rejectionReason} />
                  )}

                  {/* Individual extra fields */}
                  {selected.kycType === "individual" && (
                    <>
                      {selected.birthDate && (
                        <FieldRow label="Data nascimento" value={fmtDate(selected.birthDate)} />
                      )}
                      {selected.phone && <FieldRow label="Telefone" value={selected.phone} />}
                      {selected.occupation && (
                        <FieldRow label="Profissão" value={selected.occupation} />
                      )}
                      {selected.sourceOfFunds && (
                        <FieldRow label="Fonte de renda" value={selected.sourceOfFunds} />
                      )}
                      {selected.monthlyIncome != null && (
                        <FieldRow
                          label="Renda mensal"
                          value={`R$ ${Number(selected.monthlyIncome).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`}
                        />
                      )}
                      {selected.address?.city && (
                        <FieldRow
                          label="Endereço"
                          value={`${selected.address.street || ""} ${
                            selected.address.number || ""
                          }, ${selected.address.city}/${selected.address.state}`}
                        />
                      )}
                    </>
                  )}

                  {/* Business / KYB fields */}
                  {selected.kycType === "business" && (
                    <>
                      <SectionLabel>Dados da Empresa</SectionLabel>
                      {selected.companyName && (
                        <FieldRow label="Razão social" value={selected.companyName} />
                      )}
                      {selected.tradeName && (
                        <FieldRow label="Nome fantasia" value={selected.tradeName} />
                      )}
                      {selected.cnpj && <FieldRow label="CNPJ" value={selected.cnpj} />}
                      {selected.businessActivity && (
                        <FieldRow label="Atividade" value={selected.businessActivity} />
                      )}
                      {selected.companyRevenue != null && (
                        <FieldRow
                          label="Faturamento"
                          value={`R$ ${Number(selected.companyRevenue).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`}
                        />
                      )}
                      {selected.incorporationDate && (
                        <FieldRow
                          label="Data constituição"
                          value={fmtDate(selected.incorporationDate)}
                        />
                      )}
                      {selected.companyAddress?.city && (
                        <FieldRow
                          label="Endereço empresa"
                          value={`${selected.companyAddress.street || ""} ${
                            selected.companyAddress.number || ""
                          }, ${selected.companyAddress.city}/${selected.companyAddress.state}`}
                        />
                      )}

                      {/* UBOs */}
                      {Array.isArray(selected.beneficialOwners) &&
                        selected.beneficialOwners.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 10,
                                fontWeight: 700,
                                color: C.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.09em",
                                marginBottom: 8,
                                paddingBottom: 4,
                                borderBottom: `1px solid ${C.border}`,
                              }}
                            >
                              <Users size={10} />
                              Sócios / UBO ({selected.beneficialOwners.length})
                            </div>
                            {selected.beneficialOwners.map((owner, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "10px 12px",
                                  marginBottom: 8,
                                  borderRadius: 10,
                                  border: `1px solid ${C.border}`,
                                  background: "rgba(255,255,255,0.02)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 4,
                                  }}
                                >
                                  <span
                                    style={{ fontSize: 13, fontWeight: 800, color: C.white }}
                                  >
                                    {owner.fullName}
                                  </span>
                                  {owner.isPoliticallyExposed && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        padding: "2px 7px",
                                        borderRadius: 999,
                                        background: "rgba(229,72,77,0.12)",
                                        color: "#E5484D",
                                        fontWeight: 700,
                                      }}
                                    >
                                      PEP
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 12, color: C.muted }}>
                                  {[
                                    owner.documentNumber,
                                    owner.ownershipPercentage != null
                                      ? `${owner.ownershipPercentage}%`
                                      : null,
                                    owner.role,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {/* ── Tab: Documentos ── */}
              {activeTab === "documentos" && (
                <div style={{ display: "grid", gap: 10 }}>
                  <DocCard
                    label="Selfie"
                    filePath={selected.selfieFile}
                    icon={<UserCircle size={16} />}
                  />
                  <DocCard
                    label="Documento de identidade"
                    filePath={selected.documentFile}
                    icon={<FileText size={16} />}
                  />
                  <DocCard
                    label="Selfie com documento (liveness)"
                    filePath={selected.livenessFile}
                    icon={<Eye size={16} />}
                  />
                  <DocCard
                    label="Comprovante de endereço"
                    filePath={selected.addressProofFile}
                    icon={<Building2 size={16} />}
                  />
                </div>
              )}

              {/* ── Tab: Compliance ── */}
              {activeTab === "compliance" && (
                <div style={{ display: "grid", gap: 14 }}>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(129,140,248,0.06)",
                      border: "1px solid rgba(129,140,248,0.16)",
                      fontSize: 12,
                      color: "#818CF8",
                      lineHeight: 1.5,
                    }}
                  >
                    Atualizações de compliance não alteram o status do KYC — apenas registram
                    informações de risco para o backoffice.
                  </div>
                  <FormSelect
                    label="Status PEP (Pessoa Politicamente Exposta)"
                    value={compForm.pepStatus}
                    onChange={(v) => setCompForm((f) => ({ ...f, pepStatus: v }))}
                    options={[
                      { value: "unknown",        label: "Desconhecido" },
                      { value: "clear",          label: "Limpo" },
                      { value: "possible_match", label: "Possível match" },
                      { value: "confirmed",      label: "Confirmado" },
                    ]}
                  />
                  <FormSelect
                    label="Status de Sanções"
                    value={compForm.sanctionsStatus}
                    onChange={(v) => setCompForm((f) => ({ ...f, sanctionsStatus: v }))}
                    options={[
                      { value: "unknown",        label: "Desconhecido" },
                      { value: "clear",          label: "Limpo" },
                      { value: "possible_match", label: "Possível match" },
                      { value: "confirmed",      label: "Confirmado" },
                    ]}
                  />
                  <FormSelect
                    label="Nível de risco AML"
                    value={compForm.amlRiskLevel}
                    onChange={(v) => setCompForm((f) => ({ ...f, amlRiskLevel: v }))}
                    options={[
                      { value: "",       label: "Não definido" },
                      { value: "low",    label: "Baixo" },
                      { value: "medium", label: "Médio" },
                      { value: "high",   label: "Alto" },
                    ]}
                  />
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Notas de compliance
                    </label>
                    <textarea
                      value={compForm.complianceNotes}
                      onChange={(e) =>
                        setCompForm((f) => ({ ...f, complianceNotes: e.target.value }))
                      }
                      placeholder="Observações internas sobre este usuário..."
                      style={{
                        width: "100%",
                        minHeight: 90,
                        resize: "vertical",
                        background: C.inputDeep,
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        color: C.white,
                        fontFamily: "inherit",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <Btn
                    variant="primary"
                    onClick={handleSaveCompliance}
                    disabled={compSaving}
                    icon={<Flag size={14} />}
                    fullWidth
                  >
                    {compSaving ? "Salvando..." : "Salvar compliance"}
                  </Btn>
                </div>
              )}

              {/* ── Action buttons — always visible ── */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: `1px solid ${C.border}`,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Motivo de rejeição
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Obrigatório apenas se for rejeitar o KYC."
                    style={{
                      width: "100%",
                      minHeight: 70,
                      resize: "vertical",
                      background: C.inputDeep,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      color: C.white,
                      fontFamily: "inherit",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Approve / Reject */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <Btn
                    variant="primary"
                    onClick={() => handleReview("approved")}
                    disabled={!!actingId}
                    icon={<CheckCircle2 size={14} />}
                    fullWidth
                  >
                    {actingId ? "Processando..." : "Aprovar KYC"}
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => handleReview("rejected")}
                    disabled={!!actingId}
                    icon={<XCircle size={14} />}
                    fullWidth
                  >
                    {actingId ? "Processando..." : "Rejeitar KYC"}
                  </Btn>
                </div>

                {/* Move to review / Manual review */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <Btn
                    variant="secondary"
                    onClick={() => handleReview("under_review")}
                    disabled={!!actingId}
                    icon={<Clock3 size={14} />}
                    fullWidth
                  >
                    Mover para análise
                  </Btn>
                  <Btn
                    variant="secondary"
                    onClick={() => handleReview("manual_review")}
                    disabled={!!actingId}
                    icon={<AlertTriangle size={14} />}
                    fullWidth
                  >
                    Revisão manual
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
