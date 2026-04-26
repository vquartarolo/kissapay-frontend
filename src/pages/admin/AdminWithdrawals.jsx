import { useEffect, useMemo, useState } from "react";
import {
  WalletCards,
  Clock3,
  ShieldAlert,
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Shield,
  ChevronRight,
} from "lucide-react";
import RiskBadge, { getRiskLevel } from "../../components/ui/RiskBadge";
import RiskAnalysisCard from "../../components/ui/RiskAnalysisCard";
import { useAuth } from "../../context/AuthContext";
import { getPendingCashouts, reviewCashoutRequest } from "../../services/admin.service";
import { A, ADMIN_CSS, ARail, ARailCell, APanel, ABtn } from "../../components/admin/AdminDS";

const STYLES = `${ADMIN_CSS}
  .wd-row {
    display: grid;
    grid-template-columns: 1fr 90px 90px 110px;
    align-items: center;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    border-left: 3px solid transparent;
    cursor: pointer;
    transition: background 0.12s, border-left-color 0.12s;
    gap: 10px;
  }
  .wd-row:last-child { border-bottom: none; }
  .wd-row:hover { background: rgba(255,255,255,0.025); }
  .wd-row.sel  { background: rgba(57,217,138,0.04); border-left-color: rgba(57,217,138,0.40); }
  .wd-row.risk-high   { border-left-color: #EF4444 !important; }
  .wd-row.risk-medium { border-left-color: #F59E0B !important; }
  .wd-row.risk-low    { border-left-color: #3B82F6 !important; }

  .wd-detail-field {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .wd-detail-field:last-child { border-bottom: none; }
`;

function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const RISK_FILTER_OPTS = [
  { key: "all",    label: "Todos"    },
  { key: "high",   label: "Alto"     },
  { key: "medium", label: "Revisar"  },
  { key: "low",    label: "Baixo"    },
];
const RISK_PILL = {
  high:   { "--fp-bd": "rgba(239,68,68,0.36)",  "--fp-bg": "rgba(239,68,68,0.08)",  "--fp-c": "#EF4444" },
  medium: { "--fp-bd": "rgba(245,158,11,0.36)", "--fp-bg": "rgba(245,158,11,0.08)", "--fp-c": "#F59E0B" },
  low:    { "--fp-bd": "rgba(59,130,246,0.36)", "--fp-bg": "rgba(59,130,246,0.08)", "--fp-c": "#3B82F6" },
};

export default function AdminWithdrawalsPage({ isMobile }) {
  const { user }    = useAuth();
  const [loading,          setLoading]          = useState(true);
  const [actingId,         setActingId]         = useState("");
  const [feedback,         setFeedback]         = useState("");
  const [search,           setSearch]           = useState("");
  const [rows,             setRows]             = useState([]);
  const [selected,         setSelected]         = useState(null);
  const [rejectionReason,  setRejectionReason]  = useState("");
  const [riskFilter,       setRiskFilter]       = useState("all");
  const [confirmApprove,   setConfirmApprove]   = useState(false);

  async function loadData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      const data    = await getPendingCashouts();
      const pending = Array.isArray(data?.pending) ? data.pending : [];
      setRows(pending);
      if (selected?.id) {
        const fresh = pending.find((item) => item.id === selected.id) || null;
        setSelected(fresh);
      }
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    setConfirmApprove(false);
    setFeedback("");
  }, [selected?.id]);

  const riskCounts = useMemo(() => {
    const counts = { all: rows.length, low: 0, medium: 0, high: 0 };
    for (const row of rows) {
      const level = getRiskLevel(row.riskDecision, row.riskScore);
      if (level) counts[level]++;
    }
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    const term = String(search || "").trim().toLowerCase();
    if (term) {
      result = result.filter((item) => {
        const name  = String(item?.user?.name  || "").toLowerCase();
        const email = String(item?.user?.email || "").toLowerCase();
        const id    = String(item?.id          || "").toLowerCase();
        return name.includes(term) || email.includes(term) || id.includes(term);
      });
    }
    if (riskFilter !== "all") {
      result = result.filter((item) => getRiskLevel(item.riskDecision, item.riskScore) === riskFilter);
    }
    return [...result].sort((a, b) => {
      const sa = a.riskScore ?? -1;
      const sb = b.riskScore ?? -1;
      if (sb !== sa) return sb - sa;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rows, search, riskFilter]);

  const totalPendingValue = useMemo(
    () => filteredRows.reduce((acc, item) => acc + Number(item?.amount || 0), 0),
    [filteredRows]
  );

  async function handleDecision(status) {
    if (!selected?.id || actingId) return;
    if (status === "approved") {
      const level = getRiskLevel(selected.riskDecision, selected.riskScore);
      if (!confirmApprove && (level === "medium" || level === "high")) {
        setConfirmApprove(true);
        return;
      }
    }
    setConfirmApprove(false);
    if (status === "rejected" && !rejectionReason.trim()) {
      setFeedback("Preencha o motivo da rejeição antes de continuar.");
      return;
    }
    try {
      setActingId(selected.id);
      setFeedback("");
      const result = await reviewCashoutRequest(selected.id, {
        status,
        rejectionReason: status === "rejected" ? rejectionReason.trim() : "",
      });
      setFeedback(result?.msg || "Solicitação processada com sucesso.");
      setRejectionReason("");
      await loadData(false);
      setSelected(null);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao processar solicitação.");
    } finally {
      setActingId("");
    }
  }

  const isError = String(feedback).toLowerCase().includes("erro");

  return (
    <div className="page a-up" style={{ maxWidth: 1280 }}>
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: A.amber, animation: "a-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: A.amber, textTransform: "uppercase" }}>
              Área administrativa
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: A.white, margin: 0, letterSpacing: "-0.02em" }}>
            Saques / Aprovações
          </h1>
          <p style={{ fontSize: 12, color: A.muted, margin: "4px 0 0" }}>
            Fila manual · atualiza a cada 8s
          </p>
        </div>
        <ABtn onClick={() => loadData(true)} disabled={loading}>
          <RefreshCw size={11} className={loading ? "a-spin" : ""} />
          Atualizar fila
        </ABtn>
      </div>

      {/* Metric Rail */}
      <ARail>
        <ARailCell
          label="Pendentes"
          value={filteredRows.length}
          sub="Na fila atual"
          accent={A.amber}
        />
        <ARailCell
          label="Valor da fila"
          value={`R$ ${fmtBRL(totalPendingValue)}`}
          sub="Total filtrado"
          accent={A.green}
        />
        <ARailCell
          label="Em revisão"
          value={riskCounts.medium + riskCounts.high}
          sub={`${riskCounts.high} alto · ${riskCounts.medium} revisar`}
          accent={riskCounts.high > 0 ? A.red : A.amber}
        />
        <ARailCell
          label="Admin logado"
          value={user?.name || "Admin"}
          sub={String(user?.role || "admin")}
          accent={A.gold}
        />
      </ARail>

      {/* Feedback */}
      {feedback && (
        <div style={{
          marginBottom: 16, borderRadius: 12, padding: "11px 16px", fontSize: 13,
          color: isError ? A.red : A.green,
          background: isError ? "rgba(239,68,68,0.06)" : "rgba(57,217,138,0.06)",
          border: `1px solid ${isError ? "rgba(239,68,68,0.20)" : "rgba(57,217,138,0.20)"}`,
        }}>
          {feedback}
        </div>
      )}

      {/* Main split layout */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16, alignItems: "start" }}>

        {/* Left: Queue */}
        <APanel style={{ padding: 0, overflow: "hidden" }}>
          {/* Queue header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: A.white }}>Fila de solicitações</div>
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(8,10,12,0.88)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "7px 11px", flex: 1, maxWidth: 240 }}>
                <Search size={12} style={{ color: A.muted, flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome, email ou ID..."
                  style={{ background: "none", border: "none", outline: "none", width: "100%", color: A.white, fontSize: 12, fontFamily: "inherit" }}
                />
              </div>
            </div>
            {/* Risk filters */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {RISK_FILTER_OPTS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`a-fp ${riskFilter === key ? "on" : ""}`}
                  style={riskFilter === key && RISK_PILL[key] ? RISK_PILL[key] : {}}
                  onClick={() => { setRiskFilter(key); setSelected(null); }}
                >
                  {label}
                  <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "0 4px" }}>
                    {key === "all" ? riskCounts.all : (riskCounts[key] ?? 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 110px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 10 }}>
              {["Solicitação", "Valor", "Risco", "Enviado"].map((h) => (
                <div key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: A.dim }}>{h}</div>
              ))}
            </div>
          )}

          {/* Rows */}
          {loading ? (
            <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
              <div className="a-spin" style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.08)`, borderTopColor: A.green }} />
            </div>
          ) : filteredRows.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <Clock3 size={28} style={{ color: A.dim, marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: A.muted }}>Nenhum saque encontrado</div>
            </div>
          ) : (
            filteredRows.map((item) => {
              const isSelected = selected?.id === item.id;
              const riskLevel  = getRiskLevel(item.riskDecision, item.riskScore);
              return (
                <div
                  key={item.id}
                  className={`wd-row ${isSelected ? "sel" : ""} ${!isSelected && riskLevel ? `risk-${riskLevel}` : ""}`}
                  onClick={() => { setSelected(item); setFeedback(""); }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: A.white, marginBottom: 2 }}>{item?.user?.name || "—"}</div>
                    <div style={{ fontSize: 11, color: A.muted, marginBottom: 1 }}>{item?.user?.email || "—"}</div>
                    <div style={{ fontSize: 10, color: A.dim }}>#{String(item.id).slice(-8)}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: A.white }}>R$ {fmtBRL(item?.amount || 0)}</div>
                  <div>
                    <RiskBadge riskDecision={item.riskDecision} riskScore={item.riskScore} />
                  </div>
                  <div style={{ fontSize: 10, color: A.dim }}>
                    {new Date(item?.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })
          )}
        </APanel>

        {/* Right: Detail panel */}
        <APanel style={{ padding: 0, overflow: "hidden", position: "sticky", top: 20 }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: A.white }}>Revisão da solicitação</div>
            <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>
              {selected ? "Valide os dados antes de aprovar ou rejeitar." : "Selecione um saque na fila ao lado."}
            </div>
          </div>

          {!selected ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <ChevronRight size={22} style={{ color: A.dim }} />
              </div>
              <div style={{ fontSize: 13, color: A.muted }}>Nenhuma solicitação selecionada</div>
            </div>
          ) : (
            <div style={{ padding: "16px" }}>
              {/* Fields */}
              <div style={{ marginBottom: 16 }}>
                {[
                  ["Nome",            selected?.user?.name],
                  ["Email",           selected?.user?.email],
                  ["Role",            selected?.user?.role],
                  ["Status da conta", selected?.user?.accountStatus],
                  ["Valor",           `R$ ${fmtBRL(selected?.amount || 0)}`],
                  ["Valor congelado", `R$ ${fmtBRL(selected?.walletFrozenAmount || 0)}`],
                  ["Descrição",       selected?.description || "—"],
                  ["Criado em",       fmtDate(selected?.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="wd-detail-field">
                    <span style={{ fontSize: 11, color: A.muted, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 11, color: A.white, fontWeight: 700, textAlign: "right", wordBreak: "break-word" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Risk analysis */}
              <RiskAnalysisCard
                riskScore={selected?.riskScore}
                riskDecision={selected?.riskDecision}
                riskReasons={selected?.riskReasons}
                kycRiskLevel={selected?.kycRiskLevel}
                kycPepStatus={selected?.kycPepStatus}
                kycSanctionsStatus={selected?.kycSanctionsStatus}
                kycType={selected?.user?.kycType}
              />

              {/* Rejection reason */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, marginBottom: 6 }}>
                  Motivo da rejeição
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Obrigatório apenas se for rejeitar a solicitação."
                  style={{
                    width: "100%", minHeight: 80, resize: "vertical",
                    background: "rgba(8,10,12,0.88)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "9px 12px", color: A.white,
                    fontFamily: "inherit", fontSize: 12, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Actions */}
              {confirmApprove ? (
                <div style={{ marginTop: 14, borderRadius: 12, padding: "14px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 12 }}>
                    <AlertTriangle size={14} style={{ color: A.amber, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: A.muted, lineHeight: 1.6 }}>
                      Este saque possui risco elevado. Confirme que revisou todos os dados, o histórico do usuário e a origem do saldo.
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ABtn onClick={() => setConfirmApprove(false)} style={{ justifyContent: "center" }}>
                      Cancelar
                    </ABtn>
                    <ABtn className="green" onClick={() => handleDecision("approved")} disabled={!!actingId} style={{ justifyContent: "center" }}>
                      <CheckCircle2 size={11} />
                      {actingId ? "..." : "Confirmar"}
                    </ABtn>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  <ABtn className="green" onClick={() => handleDecision("approved")} disabled={actingId === selected.id} style={{ justifyContent: "center", padding: "10px" }}>
                    <CheckCircle2 size={12} />
                    {actingId === selected.id ? "..." : "Aprovar"}
                  </ABtn>
                  <ABtn className="red" onClick={() => handleDecision("rejected")} disabled={actingId === selected.id} style={{ justifyContent: "center", padding: "10px" }}>
                    <XCircle size={12} />
                    {actingId === selected.id ? "..." : "Rejeitar"}
                  </ABtn>
                </div>
              )}
            </div>
          )}
        </APanel>
      </div>
    </div>
  );
}
