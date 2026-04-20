import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, ArrowUpRight, Wallet, Clock, XCircle,
  TrendingUp, Zap, Coins, CheckCircle2, Shield,
} from "lucide-react";
import M from "../../master/theme/colors";
import MCard from "../../master/components/MCard";
import MPageHeader from "../../master/components/MPageHeader";
import MEmptyState from "../../master/components/MEmptyState";
import MBadge from "../../master/components/MBadge";

// ── formatters ──────────────────────────────────────────────────────
function fmtBRL(v = 0) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}
function fmtShort(v) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v}`;
}

// ── mock: 90-day volume chart ───────────────────────────────────────
function buildChart() {
  const result = [];
  const start  = new Date("2026-01-06");
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const t       = i / 89;
    const base    = 8_000 + t * 4_200_000;
    const wave    = Math.sin(i * 0.45) * base * 0.18;
    const noise   = (Math.random() - 0.5) * base * 0.12;
    const weekend = [0, 6].includes(d.getDay()) ? 0.6 : 1;
    const v       = Math.max(500, Math.round((base + wave + noise) * weekend));
    result.push({
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      v, full: d,
    });
  }
  return result;
}
const ALL_DATA = buildChart();

// ── mock KPIs ───────────────────────────────────────────────────────
const MOCK_KPAS = {
  totalUsers:          1_247,
  activeUsers:           891,
  kycPending:              7,
  pendingUsers:           23,
  totalVolume:    4_812_340,
  totalCustody:     234_780,
  withdrawalsPending:     14,
};

// ── mock withdrawals by method ──────────────────────────────────────
const MOCK_WD = {
  pix:    { count: 38, total:  42_800 },
  crypto: { count: 17, total:  28_350 },
};

// ── mock transactions ───────────────────────────────────────────────
const MOCK_TXS = [
  { _id: "6830a1", type: "payment",    method: "pix",    amount:  45_750,  status: "completed",  name: "TechBrasil Pagamentos Ltda",      ago: "há 12 min"  },
  { _id: "6830a2", type: "payment",    method: "crypto",  amount: 189_500,  status: "completed",  name: "Mercado Digital Global S.A.",      ago: "há 1 hora"  },
  { _id: "6830a3", type: "withdrawal", method: "pix",    amount:   7_820,  status: "pending",    name: "Startup Ventures ME",             ago: "há 2 horas" },
  { _id: "6830a4", type: "payment",    method: "crypto",  amount: 892_000,  status: "completed",  name: "Commerce International Inc",      ago: "ontem"      },
  { _id: "6830a5", type: "withdrawal", method: "pix",    amount:   1_250,  status: "failed",     name: "Loja Virtual Express ME",         ago: "2 dias atrás"},
  { _id: "6830a6", type: "payment",    method: "pix",    amount:  23_400,  status: "completed",  name: "Distribuidora Alfa & Beta Ltda",  ago: "2 dias atrás"},
  { _id: "6830a7", type: "payment",    method: "crypto",  amount:  54_000,  status: "pending",    name: "Grupo Nexus Digital",             ago: "3 dias atrás"},
];

// ── status badge ────────────────────────────────────────────────────
function statusMeta(s) {
  if (s === "completed" || s === "approved") return { label: "Concluído", preset: "success" };
  if (s === "pending")                        return { label: "Pendente",  preset: "warning" };
  return                                             { label: "Falhou",   preset: "error"   };
}

// ── chart tooltip ───────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: M.cardSoft, border: `1px solid ${M.border}`,
      borderRadius: 8, padding: "8px 12px", fontSize: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: M.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ color: M.white, fontWeight: 700, fontSize: 14 }}>
        R$ {fmtBRL(payload[0].value)}
      </div>
    </div>
  );
}

// ── font size adapts to value string length ─────────────────────────
function valueFontSize(val) {
  const len = String(val ?? "—").length;
  if (len <= 7)  return 28;
  if (len <= 11) return 22;
  return 17;
}

// ── KPI card — uniform (no color border/bg) ─────────────────────────
function KpiCard({ label, value, sub, icon, dot }) {
  return (
    <div style={{
      background: M.card,
      border: `1px solid ${M.border}`,
      borderRadius: 14,
      padding: "18px 20px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: M.muted }}>
          {label}
        </span>
      </div>
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
      }}>
        <div>
          <div style={{ fontSize: valueFontSize(value), fontWeight: 900, color: M.white, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
            {value ?? "—"}
          </div>
          {sub && <div style={{ fontSize: 12, color: M.muted }}>{sub}</div>}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${M.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: M.muted,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── method card ─────────────────────────────────────────────────────
function MethodCard({ label, icon, color, count, total, pct }) {
  return (
    <MCard style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${color}14`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: M.white }}>{label}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: "-0.03em", marginBottom: 4 }}>{count}</div>
      <div style={{ fontSize: 13, color: M.muted, marginBottom: 14 }}>
        R$ {fmtBRL(total)} movimentados
      </div>
      <div style={{ height: 5, background: M.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: M.dim, marginTop: 5 }}>{pct}% do total de saques</div>
    </MCard>
  );
}

// ── main ─────────────────────────────────────────────────────────────
export default function MasterDashboard() {
  const [period, setPeriod] = useState("Mês");

  const chartData = useMemo(() => {
    if (period === "Semana") return ALL_DATA.slice(-7).map(d => ({ day: d.date, v: d.v }));
    if (period === "Mês")    return ALL_DATA.slice(-30).map(d => ({ day: d.date, v: d.v }));
    const byMonth = {};
    ALL_DATA.forEach(d => {
      if (!byMonth[d.month]) byMonth[d.month] = 0;
      byMonth[d.month] += d.v;
    });
    return Object.entries(byMonth).map(([day, v]) => ({ day, v }));
  }, [period]);

  const totalPeriod = useMemo(() => chartData.reduce((s, d) => s + d.v, 0), [chartData]);

  const total   = MOCK_WD.pix.count + MOCK_WD.crypto.count;
  const pixPct    = total > 0 ? Math.round(MOCK_WD.pix.count / total * 100) : 0;
  const cryptoPct = 100 - pixPct;

  return (
    <div>
      <MPageHeader title="Visão Geral" subtitle="Resumo da plataforma em tempo real" />

      {/* KPI Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: 12, marginBottom: 22,
      }}>
        <KpiCard label="Usuários"      value={MOCK_KPAS.totalUsers.toLocaleString("pt-BR")}  sub={`${MOCK_KPAS.activeUsers.toLocaleString("pt-BR")} ativos`}  icon={<Users size={15}/>}        dot={M.green} />
        <KpiCard label="KYC pendentes" value={MOCK_KPAS.kycPending}                           sub="aguardando análise"                                          icon={<Clock size={15}/>}        dot={M.warn}  />
        <KpiCard label="Ag. aprovação" value={MOCK_KPAS.pendingUsers}                         sub="contas bloqueadas"                                           icon={<XCircle size={15}/>}      dot={M.error} />
        <KpiCard label="Volume total"  value={fmtShort(MOCK_KPAS.totalVolume)}        sub="pagamentos aprovados"                                        icon={<TrendingUp size={15}/>}   dot={M.green} />
        <KpiCard label="Em custódia"   value={fmtShort(MOCK_KPAS.totalCustody)}       sub="saldo nas wallets"                                           icon={<Wallet size={15}/>}       dot={M.gold}  />
        <KpiCard label="Saques pend."  value={MOCK_KPAS.withdrawalsPending}                   sub="aguardando aprovação"                                        icon={<ArrowUpRight size={15}/>} dot={M.warn}  />
      </div>

      {/* Chart + Balance */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 14, marginBottom: 22 }}>
        {/* Area chart */}
        <MCard style={{ padding: "20px 22px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 18,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: M.white }}>Volume de Pagamentos</div>
              <div style={{ fontSize: 11, color: M.muted, marginTop: 3 }}>
                {period === "Semana" ? "Últimos 7 dias" : period === "Mês" ? "Últimos 30 dias" : "Últimos 3 meses"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: M.white,
                background: "rgba(45,134,89,0.10)", border: "1px solid rgba(45,134,89,0.2)",
                borderRadius: 7, padding: "5px 12px",
              }}>
                {fmtShort(totalPeriod)}
              </div>
              <div style={{
                display: "flex", background: M.cardSoft,
                border: `1px solid ${M.border}`, borderRadius: 8, overflow: "hidden",
              }}>
                {["Semana", "Mês", "Ano"].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: "6px 12px", fontSize: 12, fontWeight: 600,
                      background: period === p ? "rgba(255,255,255,0.09)" : "transparent",
                      color: period === p ? M.white : M.muted,
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="masterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={M.green} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={M.green} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: M.dim }} axisLine={false} tickLine={false} interval={period === "Ano" ? 0 : "preserveStartEnd"} />
              <YAxis tick={{ fontSize: 10, fill: M.dim }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="v" stroke={M.green} strokeWidth={1.8} fill="url(#masterGrad)" dot={false} activeDot={{ r: 4, fill: M.greenBright, stroke: M.card, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </MCard>

        {/* Balance breakdown */}
        <MCard style={{ padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: M.white, marginBottom: 4 }}>Detalhes do Balanço</div>
          <div style={{ fontSize: 11, color: M.muted, marginBottom: 18 }}>Distribuição por método</div>

          {[
            { label: "PIX Recebidos",      value: "R$ 3.480.120,00", pct: "72%", dot: M.green },
            { label: "Cripto Recebidos",    value: "R$ 1.332.220,00", pct: "28%", dot: M.gold  },
            { label: "Saques Realizados",   value: "R$   412.000,00", pct: "8%",  dot: M.muted },
            { label: "Custódia atual",      value: `R$ ${fmtBRL(MOCK_KPAS.totalCustody)}`, pct: "5%", dot: M.dim },
          ].map(row => (
            <div key={row.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 0", borderBottom: `1px solid ${M.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: row.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: M.light }}>{row.label}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: M.white }}>{row.value}</div>
                <div style={{ fontSize: 10, color: M.dim }}>{row.pct} do total</div>
              </div>
            </div>
          ))}
        </MCard>
      </div>

      {/* PIX vs Cripto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
        <MethodCard label="Saques PIX"    icon={<Zap   size={18} color={M.green} />} color={M.green} count={MOCK_WD.pix.count}    total={MOCK_WD.pix.total}    pct={pixPct}    />
        <MethodCard label="Saques Cripto" icon={<Coins size={18} color={M.gold}  />} color={M.gold}  count={MOCK_WD.crypto.count} total={MOCK_WD.crypto.total} pct={cryptoPct} />
      </div>

      {/* Last transactions */}
      <MCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${M.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: M.white }}>Últimas transações</div>
            <div style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>Atividades recentes da plataforma</div>
          </div>
          <span style={{ fontSize: 12, color: M.muted }}>Últimas {MOCK_TXS.length}</span>
        </div>

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 130px 110px 130px",
          padding: "9px 20px", borderBottom: `1px solid ${M.border}`,
        }}>
          {["Transação", "Valor", "Status", "Data"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: M.dim }}>{h}</span>
          ))}
        </div>

        {MOCK_TXS.map((tx, i) => {
          const { label, preset } = statusMeta(tx.status);
          return (
            <div
              key={tx._id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 130px 110px 130px",
                padding: "13px 20px",
                borderBottom: i < MOCK_TXS.length - 1 ? `1px solid ${M.border}` : "none",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: M.white, marginBottom: 2 }}>
                  {tx.name}
                </div>
                <div style={{ fontSize: 11, color: M.muted }}>
                  {tx.type === "withdrawal" ? "Saque" : tx.method === "crypto" ? "Cripto" : "PIX"} · {tx.ago}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: M.white }}>
                R$ {fmtBRL(tx.amount)}
              </div>
              <MBadge preset={preset}>{label}</MBadge>
              <div style={{ fontSize: 12, color: M.muted, fontFamily: "monospace" }}>
                #{String(tx._id).slice(-6)}
              </div>
            </div>
          );
        })}
      </MCard>
    </div>
  );
}
