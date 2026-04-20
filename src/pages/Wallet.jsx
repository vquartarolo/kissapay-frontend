import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Lock,
  Clock,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import C from "../constants/colors";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Btn from "../components/ui/Btn";
import { getWallet, getTransactionsHistory } from "../services/user.service";

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtShort = (v) => {
  const value = Number(v || 0);
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`;
  return `R$ ${Math.round(value)}`;
};

const RANGES = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
];

function buildChartData(transactions = [], days = 30) {
  const today = new Date();
  const buckets = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({
      key: d.toISOString().slice(0, 10),
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      entrada: 0,
      saida: 0,
    });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  transactions.forEach((tx) => {
    const status = String(tx?.status || "").toLowerCase();
    if (!["confirmed", "paid", "approved", "completed"].includes(status)) return;

    const d = new Date(tx?.createdAt || "");
    if (Number.isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (!bucket) return;

    const type = String(tx?.type || tx?.direction || "").toLowerCase();
    if (type === "cashout" || type === "out" || type === "withdrawal") {
      bucket.saida += Number(tx?.amount || 0);
    } else {
      bucket.entrada += Number(tx?.amount || 0);
    }
  });

  return buckets;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.cardSoft,
        border: `1px solid ${C.borderStrong}`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: p.dataKey === "entrada" ? C.green : C.gold,
            marginBottom: 2,
          }}
        >
          {p.dataKey === "entrada" ? "Entrada" : "Saída"}: {fmtShort(p.value)}
        </div>
      ))}
    </div>
  );
}

function MetricCard({ icon, label, value, sub, accent, loading }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: `${accent}18`,
            border: `1px solid ${accent}28`,
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
            fontSize: 10,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 2,
            textAlign: "right",
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          fontSize: loading ? 16 : 26,
          fontWeight: 900,
          color: loading ? C.dim : C.white,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {loading ? "Carregando..." : value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: C.muted }}>{sub}</div>
      )}
    </Card>
  );
}

const TX_STATUS = {
  confirmed: { label: "Confirmado", color: C.green, bg: "rgba(45,134,89,0.10)" },
  paid: { label: "Pago", color: C.green, bg: "rgba(45,134,89,0.10)" },
  approved: { label: "Aprovado", color: C.green, bg: "rgba(45,134,89,0.10)" },
  completed: { label: "Concluído", color: C.green, bg: "rgba(45,134,89,0.10)" },
  pending: { label: "Pendente", color: C.gold, bg: "rgba(212,175,55,0.10)" },
  processing: { label: "Processando", color: C.gold, bg: "rgba(212,175,55,0.10)" },
  failed: { label: "Falhou", color: C.error, bg: "rgba(229,72,77,0.10)" },
  cancelled: { label: "Cancelado", color: C.muted, bg: "rgba(255,255,255,0.06)" },
  expired: { label: "Expirado", color: C.muted, bg: "rgba(255,255,255,0.06)" },
};

function TxStatusPill({ status }) {
  const s = TX_STATUS[String(status || "").toLowerCase()] || { label: status, color: C.muted, bg: "rgba(255,255,255,0.06)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
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

export default function WalletPage({ isMobile }) {
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [range, setRange] = useState("30d");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setTxLoading(true);
      setError("");

      const [walletRes, txRes] = await Promise.all([
        getWallet().catch(() => null),
        getTransactionsHistory({ page: 1, limit: 200 }).catch(() => null),
      ]);

      setWallet(walletRes);
      setTransactions(Array.isArray(txRes?.items) ? txRes.items : []);
    } catch (err) {
      setError("Erro ao carregar os dados da carteira.");
    } finally {
      setLoading(false);
      setTxLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedRange = RANGES.find((r) => r.key === range) || RANGES[1];
  const chartData = useMemo(
    () => buildChartData(transactions, selectedRange.days),
    [transactions, range]
  );

  const totalEntrada = useMemo(
    () => chartData.reduce((acc, d) => acc + d.entrada, 0),
    [chartData]
  );
  const totalSaida = useMemo(
    () => chartData.reduce((acc, d) => acc + d.saida, 0),
    [chartData]
  );

  const available = wallet?.balance?.available ?? wallet?.available ?? 0;
  const pending = wallet?.balance?.pending ?? wallet?.pending ?? 0;
  const blocked = wallet?.balance?.blocked ?? wallet?.blocked ?? 0;
  const retentionDays = wallet?.retentionDays ?? wallet?.settings?.retentionDays ?? 0;

  const recentTx = transactions.slice(0, 8);

  return (
    <div className="page">
      <PageHeader
        title="Carteira"
        subtitle="Saldo disponível, retenções, bloqueios e histórico de movimentações."
        right={
          <Btn
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={loadData}
          >
            Atualizar
          </Btn>
        }
      />

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(229,72,77,0.08)",
            border: "1px solid rgba(229,72,77,0.20)",
            color: C.error,
            fontSize: 13,
          }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Métricas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <MetricCard
          icon={<Wallet size={16} />}
          label="Disponível"
          value={`R$ ${fmtBRL(available)}`}
          sub="Saldo livre para saque"
          accent={C.green}
          loading={loading}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label="Em retenção"
          value={`R$ ${fmtBRL(pending)}`}
          sub={retentionDays > 0 ? `${retentionDays} dias de retenção` : "Aguardando liberação"}
          accent={C.gold}
          loading={loading}
        />
        <MetricCard
          icon={<Lock size={16} />}
          label="Bloqueado"
          value={`R$ ${fmtBRL(blocked)}`}
          sub="Saldo retido pelo sistema"
          accent={C.error}
          loading={loading}
        />
        <MetricCard
          icon={<TrendingUp size={16} />}
          label={`Entrada (${selectedRange.label})`}
          value={`R$ ${fmtBRL(totalEntrada)}`}
          sub={`Saídas: R$ ${fmtBRL(totalSaida)}`}
          accent={C.green}
          loading={txLoading}
        />
      </div>

      {/* Gráfico */}
      <Card style={{ marginBottom: 20, padding: "20px 20px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.white, marginBottom: 3 }}>
              Movimentações
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Entradas e saídas por dia no período selecionado
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 4,
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 3,
            }}
          >
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: range === r.key ? C.card : "transparent",
                  color: range === r.key ? C.white : C.muted,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: range === r.key ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                  transition: "all 0.12s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: C.green,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, color: C.muted }}>Entrada</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: C.gold,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, color: C.muted }}>Saída</span>
          </div>
        </div>

        {txLoading ? (
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: `2px solid ${C.border}`,
                borderTopColor: C.green,
                animation: "spin 0.7s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="wGradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wGradOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gold} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(selectedRange.days / 7) - 1)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: C.muted }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtShort(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="entrada"
                stroke={C.green}
                strokeWidth={1.8}
                fill="url(#wGradIn)"
                dot={false}
                activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="saida"
                stroke={C.gold}
                strokeWidth={1.8}
                fill="url(#wGradOut)"
                dot={false}
                activeDot={{ r: 4, fill: C.gold, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Últimas movimentações */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: C.white }}>
            Últimas movimentações
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.muted,
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: "2px 8px",
            }}
          >
            {recentTx.length}
          </span>
        </div>

        {txLoading ? (
          <div style={{ padding: "28px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            Carregando movimentações...
          </div>
        ) : recentTx.length === 0 ? (
          <div style={{ padding: "28px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            Nenhuma movimentação encontrada.
          </div>
        ) : (
          <>
            {!isMobile && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 110px 110px",
                  gap: 12,
                  padding: "10px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                <span>Descrição</span>
                <span>Método</span>
                <span>Status</span>
                <span style={{ textAlign: "right" }}>Valor</span>
              </div>
            )}

            {recentTx.map((tx, idx) => {
              const isOut =
                String(tx?.type || tx?.direction || "").toLowerCase().includes("out") ||
                String(tx?.type || "").toLowerCase().includes("cashout") ||
                String(tx?.type || "").toLowerCase().includes("withdrawal");

              return (
                <div
                  key={tx._id || idx}
                  style={{
                    display: isMobile ? "flex" : "grid",
                    gridTemplateColumns: "1fr 100px 110px 110px",
                    flexDirection: isMobile ? "column" : undefined,
                    gap: isMobile ? 6 : 12,
                    alignItems: isMobile ? "flex-start" : "center",
                    padding: "13px 20px",
                    borderBottom: idx < recentTx.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: C.white,
                        marginBottom: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tx.description || tx.externalReference || tx._id}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {new Date(tx.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {isOut ? (
                      <ArrowUpRight size={12} color={C.gold} />
                    ) : (
                      <ArrowDownLeft size={12} color={C.green} />
                    )}
                    <span style={{ fontSize: 12, color: C.muted, textTransform: "uppercase" }}>
                      {tx.method || "—"}
                    </span>
                  </div>

                  <div>
                    <TxStatusPill status={tx.status} />
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: isOut ? C.gold : C.green,
                      textAlign: isMobile ? "left" : "right",
                    }}
                  >
                    {isOut ? "- " : "+ "}R$ {fmtBRL(tx.amount)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Card>
    </div>
  );
}
