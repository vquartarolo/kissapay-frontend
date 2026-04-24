import { useEffect, useMemo, useState } from "react";
import {
  WalletCards,
  Clock3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  Eye,
  AlertTriangle,
  Search,
  ShieldAlert,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import RiskBadge, { getRiskLevel } from "../../components/ui/RiskBadge";
import RiskAnalysisCard from "../../components/ui/RiskAnalysisCard";
import { useAuth } from "../../context/AuthContext";
import { getPendingCashouts, reviewCashoutRequest } from "../../services/admin.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

// ── Sub-componentes locais ────────────────────────────────────────────────────

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
          fontSize: 30,
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

function StatusPill({ tone = "pending", children }) {
  const map = {
    pending:  { bg: "rgba(245,158,11,0.12)",  color: C.warn  },
    approved: { bg: "rgba(45,134,89,0.12)",   color: C.green },
    rejected: { bg: "rgba(229,72,77,0.12)",   color: C.error },
  };
  const current = map[tone] || map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: current.bg,
        color: current.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
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

function SearchField({ value, onChange }) {
  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar nome, email ou ID..."
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
  );
}

// ── Filtro de risco ────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { key: "all",    label: "Todos",     color: null },
  { key: "low",    label: "Baixo",     color: "#34A065" },
  { key: "medium", label: "Revisar",   color: "#F59E0B" },
  { key: "high",   label: "Risco alto",color: "#E5484D" },
];

function RiskFilterBar({ active, counts, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      {FILTER_OPTIONS.map(({ key, label, color }) => {
        const isActive = active === key;
        const count    = key === "all" ? counts.all : (counts[key] ?? 0);
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
                  : C.borderStrong || "rgba(255,255,255,0.08)",
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminWithdrawalsPage({ isMobile }) {
  const { user } = useAuth();

  const [loading,         setLoading]         = useState(true);
  const [actingId,        setActingId]         = useState("");
  const [feedback,        setFeedback]         = useState("");
  const [search,          setSearch]           = useState("");
  const [rows,            setRows]             = useState([]);
  const [selected,        setSelected]         = useState(null);
  const [rejectionReason, setRejectionReason]  = useState("");
  const [riskFilter,      setRiskFilter]       = useState("all");
  const [confirmApprove,  setConfirmApprove]   = useState(false);

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
      console.error("Erro ao carregar fila de saques:", err);
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

  // Reseta confirmação quando muda o saque selecionado
  useEffect(() => {
    setConfirmApprove(false);
    setFeedback("");
  }, [selected?.id]);

  // ── Contagens de risco (sem filtro de texto, sempre sobre rows completas) ──
  const riskCounts = useMemo(() => {
    const counts = { all: rows.length, low: 0, medium: 0, high: 0 };
    for (const row of rows) {
      const level = getRiskLevel(row.riskDecision, row.riskScore);
      if (level) counts[level]++;
    }
    return counts;
  }, [rows]);

  // ── Linhas filtradas + ordenadas ──────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let result = rows;

    // Filtro de texto
    const term = String(search || "").trim().toLowerCase();
    if (term) {
      result = result.filter((item) => {
        const name  = String(item?.user?.name  || "").toLowerCase();
        const email = String(item?.user?.email || "").toLowerCase();
        const id    = String(item?.id          || "").toLowerCase();
        return name.includes(term) || email.includes(term) || id.includes(term);
      });
    }

    // Filtro de risco
    if (riskFilter !== "all") {
      result = result.filter(
        (item) => getRiskLevel(item.riskDecision, item.riskScore) === riskFilter
      );
    }

    // Ordenação: riskScore desc, depois createdAt desc
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

  // ── Ação de aprovação / rejeição ─────────────────────────────────────────
  async function handleDecision(status) {
    if (!selected?.id || actingId) return;

    // Intercepta aprovação de saques com risco médio ou alto
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

  // ── Colunas da tabela ────────────────────────────────────────────────────
  const TABLE_COLS = isMobile
    ? undefined
    : "1fr 110px 120px 110px 140px";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Badge de área administrativa */}
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
        title="Saques / Aprovações"
        subtitle="Fila manual de saques pendentes aguardando análise administrativa."
        right={
          <Btn size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={() => loadData(true)}>
            Atualizar fila
          </Btn>
        }
      />

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard
          icon={<Clock3 size={15} />}
          title="Pendentes"
          value={String(filteredRows.length)}
          helper="Solicitações aguardando decisão"
          accent={C.warn}
        />
        <StatCard
          icon={<WalletCards size={15} />}
          title="Valor da fila"
          value={`R$ ${fmtBRL(totalPendingValue)}`}
          helper="Total filtrado em revisão"
          accent={C.green}
        />
        <StatCard
          icon={<ShieldAlert size={15} />}
          title="Em revisão"
          value={String(riskCounts.medium + riskCounts.high)}
          helper={`${riskCounts.high} alto · ${riskCounts.medium} revisão`}
          accent={C.warn}
        />
        <StatCard
          icon={<Eye size={15} />}
          title="Admin logado"
          value={user?.name || "Admin"}
          helper={String(user?.role || "admin")}
          accent={C.gold}
        />
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div
          style={{
            marginBottom: 14,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.55,
            color: String(feedback).toLowerCase().includes("erro") ? C.error : C.green,
            background: String(feedback).toLowerCase().includes("erro")
              ? "rgba(229,72,77,0.08)"
              : "rgba(45,134,89,0.08)",
            border: `1px solid ${
              String(feedback).toLowerCase().includes("erro")
                ? "rgba(229,72,77,0.20)"
                : "rgba(45,134,89,0.20)"
            }`,
          }}
        >
          {feedback}
        </div>
      )}

      {/* ── Layout principal ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
          gap: 16,
        }}
      >
        {/* ── Fila de solicitações ── */}
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
                Fila de solicitações
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Apenas saques com status pendente retornam do backend atual.
              </div>
            </div>
            <SearchField value={search} onChange={setSearch} />
          </div>

          {/* Filtro de risco */}
          <div style={{ marginBottom: 14 }}>
            <RiskFilterBar
              active={riskFilter}
              counts={riskCounts}
              onChange={(key) => {
                setRiskFilter(key);
                setSelected(null);
              }}
            />
          </div>

          {/* Cabeçalho da tabela */}
          {!isMobile && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: TABLE_COLS,
                gap: 12,
                padding: "10px 14px",
                borderBottom: `1px solid ${C.border}`,
                fontSize: 10,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <span>Solicitação</span>
              <span>Valor</span>
              <span>Risco</span>
              <span>Status</span>
              <span>Enviado em</span>
            </div>
          )}

          {/* Linhas */}
          {loading ? (
            <EmptyState text="Carregando fila de saques..." loading />
          ) : filteredRows.length === 0 ? (
            <EmptyState text="Nenhum saque encontrado para este filtro." />
          ) : (
            filteredRows.map((item, index) => {
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setFeedback("");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: isSelected ? "rgba(45,134,89,0.07)" : "transparent",
                    border: "none",
                    borderBottom:
                      index < filteredRows.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                    padding: "14px",
                    display: isMobile ? "flex" : "grid",
                    gridTemplateColumns: TABLE_COLS,
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {/* Solicitação */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 4 }}>
                      {item?.user?.name || "Usuário sem nome"}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      {item?.user?.email || "Sem email"}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim }}>ID {item.id}</div>
                  </div>

                  {/* Valor */}
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>
                    {`R$ ${fmtBRL(item?.amount || 0)}`}
                  </div>

                  {/* Risco */}
                  <div>
                    <RiskBadge
                      riskDecision={item.riskDecision}
                      riskScore={item.riskScore}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <StatusPill tone="pending">Pendente</StatusPill>
                  </div>

                  {/* Data */}
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {fmtDate(item?.createdAt)}
                  </div>
                </button>
              );
            })
          )}
        </Card>

        {/* ── Painel de revisão ── */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
            Revisão da solicitação
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
            {selected
              ? "Valide os dados antes de aprovar ou rejeitar."
              : "Selecione um saque na fila ao lado."}
          </div>

          {!selected ? (
            <EmptyState text="Nenhuma solicitação selecionada." />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {/* Campos informativos */}
              {[
                ["Nome",              selected?.user?.name],
                ["Email",             selected?.user?.email],
                ["Role",              selected?.user?.role],
                ["Status da conta",   selected?.user?.accountStatus],
                ["Valor",             `R$ ${fmtBRL(selected?.amount || 0)}`],
                ["Valor congelado",   `R$ ${fmtBRL(selected?.walletFrozenAmount || 0)}`],
                ["Descrição",         selected?.description || "—"],
                ["Criado em",         fmtDate(selected?.createdAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
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
              ))}

              {/* ── Análise de risco ── */}
              <RiskAnalysisCard
                riskScore={selected?.riskScore}
                riskDecision={selected?.riskDecision}
                riskReasons={selected?.riskReasons}
                kycRiskLevel={selected?.kycRiskLevel}
                kycPepStatus={selected?.kycPepStatus}
                kycSanctionsStatus={selected?.kycSanctionsStatus}
                kycType={selected?.user?.kycType}
              />

              {/* Motivo de rejeição */}
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
                  Motivo da rejeição
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Obrigatório apenas se for rejeitar a solicitação."
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

              {/* ── Confirmação de risco ou botões normais ── */}
              {confirmApprove ? (
                <div
                  style={{
                    borderRadius: 12,
                    padding: "14px",
                    background: "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.22)",
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <AlertTriangle
                      size={15}
                      color={C.warn}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      Este saque possui risco elevado. Confirme que revisou todos
                      os dados, o histórico do usuário e a origem do saldo antes
                      de aprovar.
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <Btn
                      variant="secondary"
                      onClick={() => setConfirmApprove(false)}
                      fullWidth
                    >
                      Cancelar
                    </Btn>
                    <Btn
                      variant="primary"
                      onClick={() => handleDecision("approved")}
                      disabled={!!actingId}
                      icon={<CheckCircle2 size={14} />}
                      fullWidth
                    >
                      {actingId ? "Processando..." : "Confirmar aprovação"}
                    </Btn>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <Btn
                    variant="primary"
                    onClick={() => handleDecision("approved")}
                    disabled={actingId === selected.id}
                    icon={<CheckCircle2 size={14} />}
                    fullWidth
                  >
                    {actingId === selected.id ? "Processando..." : "Aprovar saque"}
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => handleDecision("rejected")}
                    disabled={actingId === selected.id}
                    icon={<XCircle size={14} />}
                    fullWidth
                  >
                    {actingId === selected.id ? "Processando..." : "Rejeitar saque"}
                  </Btn>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
