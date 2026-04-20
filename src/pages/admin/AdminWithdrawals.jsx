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
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { getPendingCashouts, reviewCashoutRequest } from "../../services/admin.service";

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
    pending: { bg: "rgba(245,158,11,0.12)", color: C.warn },
    approved: { bg: "rgba(45,134,89,0.12)", color: C.green },
    rejected: { bg: "rgba(229,72,77,0.12)", color: C.error },
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
        minWidth: 240,
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

export default function AdminWithdrawalsPage({ isMobile }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function loadData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      const data = await getPendingCashouts();
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

  const filteredRows = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((item) => {
      const name = String(item?.user?.name || "").toLowerCase();
      const email = String(item?.user?.email || "").toLowerCase();
      const id = String(item?.id || "").toLowerCase();
      return name.includes(term) || email.includes(term) || id.includes(term);
    });
  }, [rows, search]);

  const totalPendingValue = useMemo(
    () => filteredRows.reduce((acc, item) => acc + Number(item?.amount || 0), 0),
    [filteredRows]
  );

  async function handleDecision(status) {
    if (!selected?.id || actingId) return;

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
        title="Saques / Aprovações"
        subtitle="Fila manual de saques pendentes aguardando análise administrativa."
        right={
          <Btn size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={() => loadData(true)}>
            Atualizar fila
          </Btn>
        }
      />

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
          icon={<Eye size={15} />}
          title="Admin logado"
          value={user?.name || "Admin"}
          helper={String(user?.role || "admin")}
          accent={C.gold}
        />
        <StatCard
          icon={<CheckCircle2 size={15} />}
          title="Fluxo"
          value="Manual"
          helper="Aprovação obrigatória para saque"
          accent={C.green}
        />
      </div>

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
          gap: 16,
        }}
      >
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
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

          {!isMobile && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 130px 160px",
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
              <span>Status</span>
              <span>Enviado em</span>
            </div>
          )}

          {loading ? (
            <EmptyState text="Carregando fila de saques..." loading />
          ) : filteredRows.length === 0 ? (
            <EmptyState text="Nenhum saque pendente encontrado." />
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
                    borderBottom: index < filteredRows.length - 1 ? `1px solid ${C.border}` : "none",
                    padding: "14px",
                    display: isMobile ? "flex" : "grid",
                    gridTemplateColumns: "1fr 130px 130px 160px",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 4 }}>
                      {item?.user?.name || "Usuário sem nome"}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      {item?.user?.email || "Sem email"}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim }}>
                      ID {item.id}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>
                    {`R$ ${fmtBRL(item?.amount || 0)}`}
                  </div>

                  <div>
                    <StatusPill tone="pending">Pendente</StatusPill>
                  </div>

                  <div style={{ fontSize: 12, color: C.muted }}>
                    {fmtDate(item?.createdAt)}
                  </div>
                </button>
              );
            })
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
            Revisão da solicitação
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
            {selected ? "Valide os dados antes de aprovar ou rejeitar." : "Selecione um saque na fila ao lado."}
          </div>

          {!selected ? (
            <EmptyState text="Nenhuma solicitação selecionada." />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Nome", selected?.user?.name],
                ["Email", selected?.user?.email],
                ["Role", selected?.user?.role],
                ["Status da conta", selected?.user?.accountStatus],
                ["Valor", `R$ ${fmtBRL(selected?.amount || 0)}`],
                ["Valor congelado", `R$ ${fmtBRL(selected?.walletFrozenAmount || 0)}`],
                ["Descrição", selected?.description || "—"],
                ["Criado em", fmtDate(selected?.createdAt)],
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

              <div
                style={{
                  background: "rgba(245,158,11,0.07)",
                  border: "1px solid rgba(245,158,11,0.18)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={15} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                  Como o fluxo é manual, aprove apenas após verificar KYC, origem do saldo,
                  conta do usuário e qualquer sinal de risco operacional.
                </div>
              </div>

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
                  }}
                />
              </div>

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
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
