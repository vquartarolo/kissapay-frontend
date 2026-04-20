import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Eye, EyeOff, Bell } from "lucide-react";
import C from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/dashboard.service";
import { mapStatus } from "../utils/statusMap";

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtShort = (v) => {
  const value = Number(v || 0);
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
};

function buildChartData(transactions = [], range = "30d") {
  const daysMap = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const totalDays = daysMap[range] || 30;
  const today = new Date();

  const buckets = [];

  for (let i = totalDays - 1; i >= 0; i -= 1) {
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

  transactions.forEach((tx) => {
    const normalizedStatus = mapStatus(tx?.status);
    if (normalizedStatus !== "confirmed") return;

    const createdAt = new Date(tx?.createdAt || "");
    if (Number.isNaN(createdAt.getTime())) return;

    createdAt.setHours(0, 0, 0, 0);
    const key = createdAt.toISOString().slice(0, 10);

    const bucket = bucketMap.get(key);
    if (!bucket) return;

    bucket.v += Number(tx?.amount || 0);
  });

  return buckets;
}

function getRecentTransactions(transactions = []) {
  return transactions.slice(0, 5);
}

const STATUS = {
  confirmed: { label: "Aprovado", bg: "rgba(45,134,89,0.12)", color: "#34A065" },
  pending: { label: "Pendente", bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  failed: { label: "Falhou", bg: "rgba(239,68,68,0.12)", color: "#EF4444" },
  cancelled: { label: "Cancelado", bg: "rgba(120,120,120,0.12)", color: "#A1A1AA" },
  expired: { label: "Expirado", bg: "rgba(99,102,241,0.12)", color: "#818CF8" },
};

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

function SectionCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const MILESTONES = [10_000, 50_000, 100_000, 500_000, 1_000_000];

function getMilestone(sales) {
  const next = MILESTONES.find((m) => m > sales) || MILESTONES[MILESTONES.length - 1];
  const prev = MILESTONES[MILESTONES.indexOf(next) - 1] || 0;
  const pct = Math.min(Math.round(((sales - prev) / (next - prev)) * 100), 100);
  return { prev, next, pct };
}

function MilestoneWidget({ simSales }) {
  const { prev, next, pct } = getMilestone(simSales);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "8px 14px",
        minWidth: 190,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
          }}
        >
          {prev === 0 ? "1ª Meta" : `Meta ${fmtShort(next)}`}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: C.green,
            letterSpacing: "0.04em",
          }}
        >
          {pct}%
        </span>
      </div>

      <div
        style={{
          height: 4,
          borderRadius: 999,
          background: C.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, #2D8659, #34A065)`,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: C.green }}>
          {fmtShort(simSales)}
        </span>
        <span style={{ fontSize: 10, color: C.muted }}>
          / {fmtShort(next)}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage({ isMobile }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadData(showLoading = false) {
      try {
        if (showLoading) setLoading(true);

        const data = await getDashboard();

        if (!active) return;
        setDashboard(data);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        if (!active) return;
        setDashboard(null);
      } finally {
        if (active && showLoading) setLoading(false);
      }
    }

    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const available = Number(dashboard?.balance?.available || 0);
  const pendingPix = Number(dashboard?.balance?.pending?.pix || 0);
  const pendingCrypto = Number(dashboard?.balance?.pending?.crypto || 0);
  const pendingTotal = Number(dashboard?.balance?.pending?.total || 0);
  const transactions = Array.isArray(dashboard?.transactions)
    ? dashboard.transactions
    : [];

  const chartData = useMemo(
    () => buildChartData(transactions, period),
    [transactions, period]
  );

  const chartTotal = useMemo(
    () => chartData.reduce((acc, item) => acc + Number(item.v || 0), 0),
    [chartData]
  );

  const approvedPix = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            String(tx?.method || "").toLowerCase() === "pix" &&
            mapStatus(tx?.status) === "confirmed"
        )
        .reduce((acc, tx) => acc + Number(tx?.amount || 0), 0),
    [transactions]
  );

  const approvedCrypto = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            String(tx?.method || "").toLowerCase() === "crypto" &&
            mapStatus(tx?.status) === "confirmed"
        )
        .reduce((acc, tx) => acc + Number(tx?.amount || 0), 0),
    [transactions]
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(transactions),
    [transactions]
  );

  const periodButtons = [
    { key: "7d", label: "Semana" },
    { key: "30d", label: "Mês" },
    { key: "90d", label: "Ano" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Bem-vindo de volta
          </div>

          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: C.white,
              opacity: 0.95,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {!isMobile && <MilestoneWidget simSales={3400} />}

          <div
            style={{
              display: "inline-flex",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {periodButtons.map((btn) => {
              const active = period === btn.key;

              return (
                <button
                  key={btn.key}
                  onClick={() => setPeriod(btn.key)}
                  style={{
                    border: "none",
                    borderRadius: 10,
                    padding: "9px 16px",
                    background: active ? C.bg : "transparent",
                    color: active ? C.white : C.muted,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          <button
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      <SectionCard
        style={{
          padding: isMobile ? "18px 16px" : "22px 24px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Saldo disponível
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 42 : 58,
              lineHeight: 1,
              fontWeight: 900,
              color: C.white,
              letterSpacing: "-0.05em",
            }}
          >
            {visible ? `R$ ${fmtBRL(available)}` : "R$ ••••••••"}
          </div>

          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.cardSoft,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Volume no período
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: C.warn,
              background: "rgba(245,158,11,0.12)",
              border: `1px solid rgba(245,158,11,0.18)`,
              borderRadius: 8,
              padding: "2px 8px",
            }}
          >
            {fmtShort(chartTotal)}
          </div>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: "Disponível",
            value: available,
            sub: "Liberado para saque",
            dot: C.green,
          },
          {
            label: "PIX pendente",
            value: pendingPix,
            sub: "Aguardando pagamento",
            dot: C.warn,
          },
          {
            label: "Cripto pendente",
            value: pendingCrypto,
            sub: "Aguardando confirmação",
            dot: "#6B7C93",
          },
          {
            label: "Total pendente",
            value: pendingTotal,
            sub: "Soma de todos os pendentes",
            dot: "#31415A",
          },
        ].map((card) => (
          <SectionCard key={card.label} style={{ padding: "18px 18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                fontSize: 12,
                color: C.muted,
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: card.dot,
                  display: "inline-block",
                }}
              />
              {card.label}
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: C.white,
                letterSpacing: "-0.04em",
                marginBottom: 6,
              }}
            >
              {visible ? `R$ ${fmtBRL(card.value)}` : "R$ ••••••••"}
            </div>

            <div style={{ fontSize: 13, color: C.muted }}>{card.sub}</div>
          </SectionCard>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <SectionCard style={{ padding: "18px 18px 12px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
            Volume de Pagamentos
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Últimos {period === "7d" ? "7" : period === "30d" ? "30" : "90"} dias
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0} />
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
                stroke={C.green}
                strokeWidth={2}
                fill="url(#dashboardGrad)"
                dot={false}
                activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard style={{ padding: "18px 18px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
            Detalhes do Balanço
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
            Distribuição por método
          </div>

          {[
            {
              label: "PIX Recebidos",
              value: approvedPix,
              dot: C.green,
            },
            {
              label: "Cripto Recebidos",
              value: approvedCrypto,
              dot: C.warn,
            },
            {
              label: "Saques Realizados",
              value: 0,
              dot: "#6B7C93",
            },
          ].map((item) => {
            const totalApproved = approvedPix + approvedCrypto;
            const percentage =
              totalApproved > 0 && item.label !== "Saques Realizados"
                ? Math.round((item.value / totalApproved) * 100)
                : 0;

            return (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: item.dot,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.white, fontSize: 14, fontWeight: 800 }}>
                    {`R$ ${fmtBRL(item.value)}`}
                  </div>
                  <div style={{ color: C.muted, fontSize: 12 }}>
                    {item.label === "Saques Realizados" ? "—" : `${percentage}% do total`}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => navigate("/recebimentos")}
            style={{
              width: "100%",
              marginTop: 16,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.cardSoft,
              color: C.white,
              padding: "14px 16px",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Ver histórico completo ↗
          </button>
        </SectionCard>
      </div>

      <SectionCard style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
              Transações Recentes
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              Últimas atividades da conta
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/recebimentos")}
            style={{
              border: "none",
              background: "transparent",
              color: C.green,
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Ver tudo →
          </button>
        </div>

        {!isMobile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 130px 120px",
              gap: 12,
              padding: "10px 20px",
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11,
              color: C.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>Transação</span>
            <span>Método</span>
            <span>Valor</span>
            <span>Status</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "28px 20px", color: C.muted }}>Carregando...</div>
        ) : recentTransactions.length === 0 ? (
          <div style={{ padding: "28px 20px", color: C.muted }}>
            Nenhuma transação encontrada.
          </div>
        ) : (
          recentTransactions.map((tx, index) => {
            const status = STATUS[mapStatus(tx?.status)] || STATUS.pending;
            const method = String(tx?.method || "").toLowerCase() === "crypto" ? "Cripto" : "PIX";

            return (
              <div
                key={tx?._id || index}
                style={{
                  display: isMobile ? "flex" : "grid",
                  gridTemplateColumns: "1fr 110px 130px 120px",
                  gap: 12,
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom:
                    index < recentTransactions.length - 1 ? `1px solid ${C.border}` : "none",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: C.white,
                      fontWeight: 800,
                      fontSize: 15,
                      marginBottom: 4,
                    }}
                  >
                    {tx?.description || (method === "Cripto" ? "Cobrança cripto" : "Cobrança PIX")}
                  </div>
                  <div style={{ color: C.muted, fontSize: 12 }}>
                    ID {tx?._id || "—"}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 56,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.cardSoft,
                      color: C.muted,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {method}
                  </span>
                </div>

                <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>
                  {`R$ ${fmtBRL(tx?.amount || 0)}`}
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: status.bg,
                      color: status.color,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
    </div>
  );
}