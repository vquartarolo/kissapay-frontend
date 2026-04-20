import { useState, useEffect, useRef, useMemo } from "react";
import { TrendingDown, ArrowUpRight, Coins, QrCode } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import C from "../constants/colors";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";

function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function fmtShort(v) {
  const value = Number(v || 0);
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
}

function normalizeWithdrawalStatus(status) {
  const s = String(status || "").toLowerCase();

  if (["approved", "completed"].includes(s)) return "confirmed";
  if (["pending", "processing"].includes(s)) return "pending";
  if (["rejected", "failed", "cancelled"].includes(s)) return "failed";

  return "pending";
}

const PERIODS = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
];

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
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>
        {fmtShort(payload[0].value)}
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const isCripto = String(type || "").toLowerCase() !== "pix";

  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: isCripto ? "rgba(212,175,55,0.08)" : "rgba(45,134,89,0.08)",
        border: `1px solid ${
          isCripto ? "rgba(212,175,55,0.15)" : "rgba(45,134,89,0.15)"
        }`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {isCripto ? (
        <Coins size={15} color={C.gold} strokeWidth={1.8} />
      ) : (
        <QrCode size={15} color={C.green} strokeWidth={1.8} />
      )}
    </div>
  );
}

function buildWithdrawalsFromWallet(wallet) {
  const logItems = Array.isArray(wallet?.log) ? wallet.log : [];

  return logItems
    .filter((item) => String(item?.type || "").toLowerCase() === "withdraw")
    .map((item, index) => ({
      _id: `${item?.transactionId || "withdraw"}-${index}`,
      amount: Number(item?.amount || 0),
      status: String(item?.status || "pending").toLowerCase(),
      createdAt: item?.createdAt || null,
      type: item?.withdrawal?.type || item?.method || "pix",
      target: item?.withdrawal?.target || item?.description || "Destino não informado",
      description: item?.description || "",
    }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function buildChartData(withdrawals = [], period = "90d") {
  const selected = PERIODS.find((item) => item.key === period) || PERIODS[2];
  const today = new Date();
  const buckets = [];

  for (let i = selected.days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);

    buckets.push({
      key: d.toISOString().slice(0, 10),
      date: d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      v: 0,
    });
  }

  const bucketMap = new Map(buckets.map((item) => [item.key, item]));

  withdrawals.forEach((item) => {
    const createdAt = new Date(item?.createdAt || "");
    if (Number.isNaN(createdAt.getTime())) return;

    createdAt.setHours(0, 0, 0, 0);
    const key = createdAt.toISOString().slice(0, 10);

    const bucket = bucketMap.get(key);
    if (!bucket) return;

    bucket.v += Number(item?.amount || 0);
  });

  return buckets;
}

export default function HistoricoPage({ isMobile }) {
  const { wallet, refreshProfile } = useAuth();

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [period, setPeriod] = useState("90d");
  const [withdrawals, setWithdrawals] = useState([]);

  // ref estável — sem nova referência a cada render
  const refreshRef = useRef(refreshProfile);
  useEffect(() => { refreshRef.current = refreshProfile; });

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        await refreshRef.current();
      } catch (err) {
        console.error("Erro ao atualizar histórico de saques:", err);
      } finally {
        if (active) setInitialLoaded(true);
      }
    }

    loadData();

    const interval = setInterval(loadData, 7000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []); // deps vazias — estável, sem loop

  useEffect(() => {
    setWithdrawals(buildWithdrawalsFromWallet(wallet));
  }, [wallet]);

  const loading = !initialLoaded;

  const chartData = useMemo(
    () => buildChartData(withdrawals, period),
    [withdrawals, period]
  );

  const chartTotal = useMemo(
    () => chartData.reduce((acc, item) => acc + Number(item.v || 0), 0),
    [chartData]
  );

  const totalSacado = withdrawals.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const pendentes = withdrawals.filter(
    (item) => normalizeWithdrawalStatus(item.status) === "pending"
  ).length;
  const concluidos = withdrawals.filter(
    (item) => normalizeWithdrawalStatus(item.status) === "confirmed"
  ).length;

  const metrics = [
    { label: "Total sacado", value: `R$ ${fmtBRL(totalSacado)}` },
    { label: "Saques", value: String(withdrawals.length) },
    { label: "Concluídos", value: String(concluidos) },
    { label: "Pendentes", value: String(pendentes) },
  ];

  return (
    <div>
      <PageHeader
        title="Histórico de Saques"
        subtitle="Movimentações de saída da sua conta"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {metrics.map((m, i) => (
          <Card key={m.label} style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontSize: i === 0 ? 20 : 26,
                fontWeight: 800,
                color: C.white,
                letterSpacing: "-0.02em",
              }}
            >
              {m.value}
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 24, padding: "20px 20px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <TrendingDown size={15} color={C.warn} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
                Volume de saques
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Total no período:{" "}
              <span style={{ color: C.white, fontWeight: 700 }}>{fmtShort(chartTotal)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  border: `1px solid ${period === p.key ? C.warn : C.border}`,
                  background: period === p.key ? "rgba(245,158,11,0.10)" : "transparent",
                  color: period === p.key ? C.warn : C.muted,
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="saqueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.warn} stopOpacity={0.18} />
                <stop offset="100%" stopColor={C.warn} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: C.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(Math.floor(chartData.length / 6), 0)}
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fill: C.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.borderStrong, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={C.warn}
              strokeWidth={2}
              fill="url(#saqueGrad)"
              dot={false}
              activeDot={{ r: 4, fill: C.warn, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {!isMobile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 120px 130px",
              padding: "10px 20px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {["Destino", "Valor", "Status", "Data"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `2px solid ${C.border}`,
                borderTopColor: C.warn,
                animation: "spin 0.7s linear infinite",
                margin: "0 auto 10px",
              }}
            />
            <div style={{ fontSize: 13, color: C.muted }}>Carregando saques...</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <ArrowUpRight size={20} color={C.dim} />
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.white,
                marginBottom: 6,
              }}
            >
              Nenhum saque encontrado
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              Seus saques aparecerão aqui após a primeira solicitação.
            </div>
          </div>
        ) : (
          withdrawals.map((w, i) => (
            <div
              key={w._id || i}
              style={{
                display: isMobile ? "flex" : "grid",
                gridTemplateColumns: "1fr 140px 120px 130px",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderBottom: i < withdrawals.length - 1 ? `1px solid ${C.border}` : "none",
                flexWrap: "wrap",
                justifyContent: isMobile ? "space-between" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <TypeBadge type={w.type} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.white,
                      marginBottom: 2,
                    }}
                  >
                    {w.target || "Destino não informado"}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {String(w.type || "pix").toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>
                {`R$ ${fmtBRL(w.amount)}`}
              </div>

              <div>
                <StatusBadge status={normalizeWithdrawalStatus(w.status)} />
              </div>

              <div style={{ fontSize: 13, color: C.muted }}>
                {w.createdAt
                  ? new Date(w.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}