import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Clock, ShieldAlert, AlertTriangle } from "lucide-react";
import C from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import {
  listApprovals,
  approveApprovalRequest,
  rejectApprovalRequest,
} from "../../services/admin.service";

// ── Constantes de UI ──────────────────────────────────────────────────────────

const ACTION_LABELS = {
  cashout_approval: "Aprovação de saque",
  kyc_approval:     "Aprovação de KYC",
  user_freeze:      "Congelar conta",
  user_unfreeze:    "Descongelar conta",
  admin_override:   "Override admin",
};

const STATUS_TABS = [
  { key: "all",      label: "Todos" },
  { key: "pending",  label: "Pendente" },
  { key: "approved", label: "Aprovado" },
  { key: "rejected", label: "Rejeitado" },
];

const STATUS_CONFIG = {
  pending:  { label: "Pendente",  color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  approved: { label: "Aprovado",  color: "#34A065", bg: "rgba(45,134,89,0.10)"  },
  rejected: { label: "Rejeitado", color: "#E5484D", bg: "rgba(229,72,77,0.10)"  },
};

const ACTION_COLORS = {
  cashout_approval: { color: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
  kyc_approval:     { color: "#A78BFA", bg: "rgba(167,139,250,0.10)" },
  user_freeze:      { color: "#E5484D", bg: "rgba(229,72,77,0.10)"   },
  user_unfreeze:    { color: "#34A065", bg: "rgba(45,134,89,0.10)"   },
  admin_override:   { color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
};

// ── Utilitários ───────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function shortId(id) {
  return id ? String(id).slice(-8).toUpperCase() : "—";
}

function userName(u) {
  if (!u) return "—";
  return u.name || u.email || "Admin";
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { label: status, color: C.muted, bg: "rgba(90,106,126,0.1)" };
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

function ActionBadge({ actionType }) {
  const c = ACTION_COLORS[actionType] || { color: C.muted, bg: "rgba(90,106,126,0.1)" };
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {ACTION_LABELS[actionType] || actionType}
    </span>
  );
}

function InfoRow({ label, value, color }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        padding: "7px 0",
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
      }}
    >
      <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: color || C.white,
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PayloadCard({ payload }) {
  if (!payload || Object.keys(payload).length === 0) return null;
  const entries = Object.entries(payload).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
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
        Dados do alvo
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          padding: "4px 10px",
        }}
      >
        {entries.map(([k, v]) => (
          <InfoRow
            key={k}
            label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
            value={String(v)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminApprovals() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const pollRef = useRef(null);

  async function fetchAll() {
    try {
      const [allRes, pendRes, appRes, rejRes] = await Promise.all([
        listApprovals({ limit: 200 }),
        listApprovals({ status: "pending", limit: 200 }),
        listApprovals({ status: "approved", limit: 200 }),
        listApprovals({ status: "rejected", limit: 200 }),
      ]);
      setCounts({
        all:      allRes.total  ?? 0,
        pending:  pendRes.total ?? 0,
        approved: appRes.total  ?? 0,
        rejected: rejRes.total  ?? 0,
      });

      const visible = tab === "all"
        ? (allRes.approvals  ?? [])
        : tab === "pending"
        ? (pendRes.approvals ?? [])
        : tab === "approved"
        ? (appRes.approvals  ?? [])
        : (rejRes.approvals  ?? []);
      setRows(visible);

      if (selected) {
        const fresh = visible.find((r) => String(r._id) === String(selected._id));
        if (fresh) setSelected(fresh);
      }
    } catch (err) {
      console.error("[AdminApprovals] fetch:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchAll();
    pollRef.current = setInterval(fetchAll, 8000);
    return () => clearInterval(pollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function showFeedback(msg, ok = true) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleApprove() {
    if (!selected) return;
    setActionLoading(true);
    try {
      await approveApprovalRequest(String(selected._id));
      showFeedback("Aprovado e ação executada com sucesso.");
      setSelected(null);
      fetchAll();
    } catch (err) {
      const msg = err?.response?.data?.msg || "Erro ao aprovar.";
      showFeedback(msg, false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    if (!confirmReject) {
      setConfirmReject(true);
      return;
    }
    setActionLoading(true);
    try {
      await rejectApprovalRequest(String(selected._id), rejectReason);
      showFeedback("Solicitação rejeitada.");
      setSelected(null);
      setConfirmReject(false);
      setRejectReason("");
      fetchAll();
    } catch (err) {
      const msg = err?.response?.data?.msg || "Erro ao rejeitar.";
      showFeedback(msg, false);
    } finally {
      setActionLoading(false);
    }
  }

  const isMaker =
    selected &&
    user?.id &&
    String(selected.requestedBy?._id || selected.requestedBy) === String(user.id);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: C.white }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.white,
            letterSpacing: "-0.01em",
            marginBottom: 4,
          }}
        >
          Aprovações
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          Fluxo maker-checker — solicitações requerem aprovação de um segundo administrador.
        </p>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 16px",
            borderRadius: 10,
            background: feedback.ok ? "rgba(45,134,89,0.12)" : "rgba(229,72,77,0.12)",
            border: `1px solid ${feedback.ok ? "rgba(45,134,89,0.3)" : "rgba(229,72,77,0.3)"}`,
            color: feedback.ok ? "#34A065" : "#E5484D",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelected(null); }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: tab === t.key ? C.cardSoft : "transparent",
              color: tab === t.key ? C.white : C.muted,
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            <span
              style={{
                padding: "1px 7px",
                borderRadius: 999,
                background: tab === t.key ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
                color: tab === t.key ? C.white : C.muted,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Corpo em duas colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1.2fr 0.8fr" : "1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Lista */}
        <div
          style={{
            background: C.card,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>
              Carregando…
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>
              Nenhuma solicitação{tab !== "all" ? ` com status "${STATUS_CONFIG[tab]?.label}"` : ""}.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Ação", "Alvo", "Solicitante", "Status", "Data"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.muted,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isActive = String(row._id) === String(selected?._id);
                  return (
                    <tr
                      key={String(row._id)}
                      onClick={() => {
                        setSelected(row);
                        setConfirmReject(false);
                        setRejectReason("");
                      }}
                      style={{
                        cursor: "pointer",
                        background: isActive ? C.cardSoft : "transparent",
                        borderBottom: `1px solid ${C.border}`,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "11px 16px" }}>
                        <ActionBadge actionType={row.actionType} />
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>
                          #{shortId(row.targetId)}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 12, color: C.white }}>
                          {userName(row.requestedBy)}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>
                          {fmtDate(row.requestedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detalhe */}
        {selected && (
          <div
            style={{
              background: C.card,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              padding: 20,
              position: "sticky",
              top: 24,
            }}
          >
            {/* Cabeçalho do detalhe */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.white, marginBottom: 6 }}>
                  Solicitação
                </div>
                <ActionBadge actionType={selected.actionType} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <StatusBadge status={selected.status} />
                <button
                  onClick={() => { setSelected(null); setConfirmReject(false); setRejectReason(""); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.muted,
                    fontSize: 11,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✕ fechar
                </button>
              </div>
            </div>

            {/* Dados da solicitação */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: "4px 10px",
                marginBottom: 12,
              }}
            >
              <InfoRow label="ID" value={`#${shortId(String(selected._id))}`} color={C.muted} />
              <InfoRow label="ID completo" value={String(selected._id)} color={C.muted} />
              <InfoRow label="Tipo de alvo" value={selected.targetType} />
              <InfoRow
                label="ID do alvo"
                value={selected.targetId ? String(selected.targetId) : "—"}
                color={C.muted}
              />
              <InfoRow label="Solicitado por" value={userName(selected.requestedBy)} />
              <InfoRow label="Solicitado em" value={fmtDate(selected.requestedAt)} color={C.muted} />
              {selected.notes && <InfoRow label="Observações" value={selected.notes} />}
              {selected.status === "approved" && (
                <>
                  <InfoRow label="Aprovado por" value={userName(selected.approvedBy)} color="#34A065" />
                  <InfoRow label="Aprovado em" value={fmtDate(selected.decidedAt)} color={C.muted} />
                </>
              )}
              {selected.status === "rejected" && (
                <>
                  <InfoRow label="Rejeitado por" value={userName(selected.rejectedBy)} color="#E5484D" />
                  <InfoRow label="Rejeitado em" value={fmtDate(selected.decidedAt)} color={C.muted} />
                  {selected.reason && <InfoRow label="Motivo" value={selected.reason} color="#E5484D" />}
                </>
              )}
            </div>

            <PayloadCard payload={selected.payload} />

            {/* Alerta regra dos 4 olhos */}
            {selected.status === "pending" && isMaker && (
              <div
                style={{
                  marginTop: 14,
                  padding: "9px 12px",
                  borderRadius: 9,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.22)",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={13} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600, lineHeight: 1.5 }}>
                  Você criou esta solicitação. Outro administrador deve aprová-la (regra dos 4 olhos).
                </span>
              </div>
            )}

            {/* Ações */}
            {selected.status === "pending" && !isMaker && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {confirmReject ? (
                  <>
                    <textarea
                      placeholder="Motivo da rejeição (opcional)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid rgba(229,72,77,0.3)`,
                        borderRadius: 8,
                        color: C.white,
                        fontSize: 13,
                        padding: "9px 12px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 9,
                          border: "none",
                          background: "rgba(229,72,77,0.15)",
                          color: "#E5484D",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />
                        Confirmar rejeição
                      </button>
                      <button
                        onClick={() => { setConfirmReject(false); setRejectReason(""); }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 9,
                          border: `1px solid ${C.border}`,
                          background: "transparent",
                          color: C.muted,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(45,134,89,0.15)",
                        color: "#34A065",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        opacity: actionLoading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle size={13} />
                      Aprovar e executar
                    </button>
                    <button
                      onClick={() => setConfirmReject(true)}
                      disabled={actionLoading}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(229,72,77,0.12)",
                        color: "#E5484D",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        opacity: actionLoading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <XCircle size={13} />
                      Rejeitar
                    </button>
                  </div>
                )}

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(90,106,126,0.07)",
                    border: `1px solid rgba(90,106,126,0.15)`,
                    display: "flex",
                    gap: 7,
                    alignItems: "flex-start",
                  }}
                >
                  <ShieldAlert size={12} color={C.muted} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                    Ao aprovar, a ação será executada imediatamente. Esta operação não pode ser desfeita.
                  </span>
                </div>
              </div>
            )}

            {/* Status terminal */}
            {selected.status !== "pending" && (
              <div
                style={{
                  marginTop: 14,
                  padding: "9px 12px",
                  borderRadius: 9,
                  background:
                    selected.status === "approved"
                      ? "rgba(45,134,89,0.08)"
                      : "rgba(229,72,77,0.08)",
                  border: `1px solid ${
                    selected.status === "approved"
                      ? "rgba(45,134,89,0.22)"
                      : "rgba(229,72,77,0.22)"
                  }`,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {selected.status === "approved" ? (
                  <CheckCircle size={13} color="#34A065" />
                ) : (
                  <XCircle size={13} color="#E5484D" />
                )}
                <span
                  style={{
                    fontSize: 12,
                    color: selected.status === "approved" ? "#34A065" : "#E5484D",
                    fontWeight: 700,
                  }}
                >
                  {selected.status === "approved"
                    ? "Solicitação aprovada — ação já executada."
                    : "Solicitação rejeitada — nenhuma ação foi executada."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
