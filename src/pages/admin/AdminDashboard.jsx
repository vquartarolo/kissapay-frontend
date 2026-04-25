import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, TrendingUp, TrendingDown, RefreshCw,
  Wallet, Receipt, Users, ArrowRightLeft, Percent,
  AlertTriangle, ShieldOff, Clock, Ban,
  ShieldCheck, ArrowDownToLine, GitPullRequestArrow, ShieldAlert,
} from "lucide-react";
import C from "../../constants/colors";
import {
  getDashboardOverview,
  getDashboardVolumeSeries,
  getDashboardRevenueSeries,
  getDashboardTopSellers,
  getDashboardAttention,
  getPendingCashouts,
  listApprovals,
  getSecurityStats,
} from "../../services/admin.service";

/* ─── Palette refs (não usar CSS vars dentro de SVG/recharts) ─── */
const P = {
  green:       "#2D8659",
  greenBright: "#34A065",
  gold:        "#81B61C",
  error:       "#E5484D",
  card:        "#141417",
  cardSoft:    "#1C1C21",
  border:      "rgba(255,255,255,0.07)",
  borderMed:   "rgba(255,255,255,0.14)",
  muted:       "#5A6A7E",
  dim:         "#2D3A48",
  white:       "#FFFFFF",
  bg:          "#09090B",
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtK(v = 0) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(1)}K`;
  return `R$ ${fmtBRL(n)}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fmtFull(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getStatusBadge(status) {
  if (status === "blocked")  return { label: "Bloqueado", color: P.error,  bg: "rgba(229,72,77,0.12)" };
  if (status === "inactive") return { label: "Inativo",   color: P.gold,   bg: "rgba(129,182,28,0.10)" };
  return                            { label: "Ativo",     color: P.green,  bg: "rgba(45,134,89,0.12)" };
}

function getAccountStatusLabel(v) {
  const map = {
    email_pending:    "Email pendente",
    basic_user:       "Básico",
    kyc_pending:      "KYC pendente",
    kyc_under_review: "KYC em análise",
    kyc_approved:     "KYC aprovado",
    kyc_rejected:     "KYC rejeitado",
    seller_active:    "Seller ativo",
    suspended:        "Suspenso",
  };
  return map[v] || v || "—";
}

/* ─── Scoped styles ───────────────────────────────────────────── */
const STYLES = `
  @keyframes dash-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dash-spin { to { transform: rotate(360deg); } }
  @keyframes dash-pulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.45; }
  }
  .dash-up   { animation: dash-up 0.28s ease both; }
  .dash-spin { animation: dash-spin 0.75s linear infinite; }
  .dash-live { animation: dash-pulse 2.2s ease-in-out infinite; }
  .dash-kpi {
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 18px;
    padding: 20px 20px 16px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    cursor: default;
  }
  .dash-kpi:hover {
    transform: translateY(-3px);
    border-color: var(--c-border-strong);
    box-shadow: 0 12px 32px rgba(0,0,0,0.18);
  }
  .dash-panel {
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 18px;
    padding: 20px;
  }
  .dash-seller-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 13px;
    border: 1px solid var(--c-border);
    background: var(--c-card-soft);
    transition: border-color 0.15s, transform 0.15s;
  }
  .dash-seller-row:hover { border-color: var(--c-border-strong); transform: translateX(2px); }
  .dash-attn-row {
    padding: 10px 13px;
    border-radius: 12px;
    border: 1px solid var(--c-border);
    background: var(--c-card-soft);
    transition: border-color 0.15s;
    margin-bottom: 7px;
  }
  .dash-attn-row:last-child { margin-bottom: 0; }
  .dash-attn-row:hover { border-color: var(--c-border-strong); }
  .dash-period-btn {
    border: 1px solid var(--c-border);
    background: var(--c-input-deep);
    color: var(--c-text-muted);
    border-radius: 10px;
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    letter-spacing: 0.04em;
  }
  .dash-period-btn.on {
    border-color: rgba(45,134,89,0.45);
    background: rgba(45,134,89,0.10);
    color: #2D8659;
  }
`;

/* ─── Custom recharts tooltip ─────────────────────────────────── */
function ChartTooltip({ active, payload, label, prefix = "R$", color = P.green }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: P.cardSoft, border: `1px solid ${P.borderMed}`,
      borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    }}>
      <div style={{ fontSize: 10, color: P.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
          {prefix} {fmtBRL(p.value)}
        </div>
      ))}
    </div>
  );
}

/* ─── KPI card ────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, delta, helper, accent, delay = 0 }) {
  const up      = delta > 0;
  const neutral = delta === 0 || delta == null;
  const hasData = typeof delta === "number";

  return (
    <div className="dash-kpi dash-up" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent,
        }}>
          {icon}
        </div>

        {hasData && !neutral && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 9px", borderRadius: 8, fontSize: 11, fontWeight: 800,
            background: up ? "rgba(45,134,89,0.10)" : "rgba(229,72,77,0.10)",
            color: up ? P.green : P.error,
            border: `1px solid ${up ? "rgba(45,134,89,0.20)" : "rgba(229,72,77,0.20)"}`,
          }}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>

      <div style={{
        fontSize: 30, fontWeight: 900, color: C.white,
        letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.10em", color: C.dim, marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: C.muted }}>{helper}</div>
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────── */
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color: C.white,
        letterSpacing: "-0.01em", marginBottom: 3,
      }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>}
    </div>
  );
}

/* ─── OpCard: quick-action card for pending counts ───────────── */
function OpCard({ icon, label, value, href, color, loading, nav }) {
  const hasAlert = !loading && value > 0;
  return (
    <div
      className="dash-kpi"
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${loading ? "carregando" : value}`}
      onClick={() => nav(href)}
      onKeyDown={(e) => e.key === "Enter" && nav(href)}
      style={{
        cursor:      "pointer",
        borderColor: hasAlert ? color + "40" : undefined,
        position:    "relative",
        overflow:    "hidden",
      }}
    >
      {hasAlert && (
        <span
          style={{
            position:     "absolute",
            top:          10,
            right:        10,
            width:        7,
            height:       7,
            borderRadius: "50%",
            background:   color,
            boxShadow:    `0 0 8px ${color}88`,
          }}
        />
      )}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            width:          36,
            height:         36,
            borderRadius:   10,
            background:     color + "18",
            border:         `1px solid ${color}28`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize:           loading ? 20 : 28,
          fontWeight:         900,
          color:              hasAlert ? color : P.white,
          letterSpacing:      "-0.04em",
          lineHeight:         1,
          marginBottom:       4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {loading ? "—" : value}
      </div>
      <div
        style={{
          fontSize:      10,
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color:         P.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── Mini spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
      <div className="dash-spin" style={{
        width: 24, height: 24, borderRadius: "50%",
        border: `2px solid ${P.border}`, borderTopColor: P.green,
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard({ isMobile }) {
  const navigate = useNavigate();

  const [period,      setPeriod]      = useState(30);
  const [loading,     setLoading]     = useState(true);
  const [overview,    setOverview]    = useState(null);
  const [volSeries,   setVolSeries]   = useState([]);
  const [revSeries,   setRevSeries]   = useState([]);
  const [topSellers,  setTopSellers]  = useState([]);
  const [attention,   setAttention]   = useState({ blocked: [], kycPending: [], noTwoFA: [] });
  const [error,       setError]       = useState("");
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [opCounts,    setOpCounts]    = useState({ kyc: 0, withdrawals: 0, approvals: 0, security: 0 });
  const [opLoading,   setOpLoading]   = useState(true);

  function extractCount(r) {
    if (!r || r.status !== "fulfilled") return 0;
    const v = r.value;
    if (!v) return 0;
    if (Array.isArray(v))            return v.length;
    if (typeof v.total === "number") return v.total;
    if (Array.isArray(v.items))      return v.items.length;
    return 0;
  }

  const load = useCallback(async (p = period, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const [ov, vol, rev, top, attn, opResults] = await Promise.all([
        getDashboardOverview(p),
        getDashboardVolumeSeries(p),
        getDashboardRevenueSeries(p),
        getDashboardTopSellers(p),
        getDashboardAttention(),
        Promise.allSettled([
          getPendingCashouts(),
          listApprovals({ status: "pending", limit: 1 }),
          getSecurityStats(),
        ]),
      ]);

      setOverview(ov);
      setVolSeries(Array.isArray(vol?.series) ? vol.series : []);
      setRevSeries(Array.isArray(rev?.series) ? rev.series : []);
      setTopSellers(Array.isArray(top?.items) ? top.items : []);

      const attnData = {
        blocked:    Array.isArray(attn?.blocked)    ? attn.blocked    : [],
        kycPending: Array.isArray(attn?.kycPending) ? attn.kycPending : [],
        noTwoFA:    Array.isArray(attn?.noTwoFA)    ? attn.noTwoFA    : [],
      };
      setAttention(attnData);

      const [cashR, apprR, secR] = opResults;
      setOpCounts({
        kyc:         attnData.kycPending.length,
        withdrawals: extractCount(cashR),
        approvals:   extractCount(apprR),
        security:    secR.status === "fulfilled" ? (secR.value?.unresolved ?? 0) : 0,
      });
      setOpLoading(false);
      setRefreshedAt(new Date());
    } catch (err) {
      console.error("Erro no dashboard:", err);
      setError("Erro ao carregar dados do dashboard.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    document.title = "Dashboard • OrionPay";
    load(period);
  }, [period]);

  function changePeriod(p) {
    setPeriod(p);
  }

  const attnTotal =
    attention.blocked.length +
    attention.kycPending.length +
    attention.noTwoFA.length;

  /* ── KPI data ─────────────────────────────────────────────── */
  const kpis = overview ? [
    {
      icon:   <Wallet size={16} />,
      label:  "Volume processado",
      value:  `R$ ${fmtBRL(overview.volumeTotal)}`,
      delta:  overview.deltas?.volume,
      helper: `Transações aprovadas — ${period}d`,
      accent: P.green,
    },
    {
      icon:   <Percent size={16} />,
      label:  "Receita em taxas",
      value:  `R$ ${fmtBRL(overview.revenueTotal)}`,
      delta:  overview.deltas?.revenue,
      helper: `Taxas coletadas — ${period}d`,
      accent: P.gold,
    },
    {
      icon:   <ArrowRightLeft size={16} />,
      label:  "Transações",
      value:  String(overview.transactionsTotal ?? 0),
      delta:  overview.deltas?.transactions,
      helper: `Operações aprovadas — ${period}d`,
      accent: P.green,
    },
    {
      icon:   <Users size={16} />,
      label:  "Sellers ativos",
      value:  String(overview.activeSellers ?? 0),
      delta:  null,
      helper: `De ${overview.totalSellers ?? 0} contas no total`,
      accent: P.gold,
    },
    {
      icon:   <Receipt size={16} />,
      label:  "Ticket médio",
      value:  `R$ ${fmtBRL(overview.ticketAverage)}`,
      delta:  null,
      helper: `Média por transação — ${period}d`,
      accent: P.green,
    },
  ] : [];

  /* ── Chart config ─────────────────────────────────────────── */
  const chartHeight = isMobile ? 180 : 220;
  const xTickStyle  = { fill: P.dim, fontSize: 10, fontWeight: 600 };
  const yTickStyle  = { fill: P.muted, fontSize: 10 };

  /* ─── Reducer for x-axis: show only every N-th label ──────── */
  const volLabels = volSeries.map((d) => fmtDate(d.date));
  const revLabels = revSeries.map((d) => fmtDate(d.date));

  function tickFormatter(val, series) {
    const idx = series.indexOf(val);
    const step = series.length > 60 ? 14 : series.length > 30 ? 7 : series.length > 14 ? 3 : 1;
    return idx % step === 0 ? val : "";
  }

  return (
    <div>
      <style>{STYLES}</style>

      {/* ── HERO HEADER ──────────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: 18, marginBottom: 20,
        padding: isMobile ? "18px 16px 0" : "22px 24px 0",
        background: C.card, border: `1px solid ${C.border}`,
      }}>
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          opacity: 0.30,
          backgroundImage: `radial-gradient(circle, ${P.borderMed} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }} />
        {/* Radial accent */}
        <div style={{
          position: "absolute", top: -80, left: -80,
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,134,89,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 11px", borderRadius: 999, marginBottom: 14,
            border: "1px solid rgba(45,134,89,0.22)",
            background: "rgba(45,134,89,0.07)", color: P.green,
            fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            <LayoutDashboard size={11} />
            Dashboard Executivo
          </div>

          {/* Title row */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 18,
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? 22 : 28, fontWeight: 900, color: C.white,
                letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 5,
              }}>
                OrionPay — Visão Geral
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Volume, receita, sellers e operações em tempo real
              </p>
            </div>

            {/* Period + refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  className={`dash-period-btn${period === d ? " on" : ""}`}
                  onClick={() => changePeriod(d)}
                >
                  {d}d
                </button>
              ))}
              <button
                onClick={() => load(period, true)}
                disabled={loading}
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.inputDeep, borderRadius: 10,
                  padding: "7px 12px", cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: "inherit",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <RefreshCw size={12} className={loading ? "dash-spin" : ""} />
                {loading ? "..." : "Atualizar"}
              </button>
            </div>
          </div>

          {/* Meta bar */}
          <div style={{
            borderTop: `1px solid ${C.border}`, paddingTop: 10, paddingBottom: 14,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="dash-live" style={{ width: 6, height: 6, borderRadius: "50%", background: P.green }} />
              <span style={{ fontSize: 11, color: P.green, fontWeight: 600 }}>Sistema ativo</span>
            </div>
            {refreshedAt && (
              <span style={{ fontSize: 11, color: C.dim }}>
                Atualizado: {fmtFull(refreshedAt)}
              </span>
            )}
            {attnTotal > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 9px", borderRadius: 999,
                background: "rgba(229,72,77,0.09)", color: P.error,
                border: "1px solid rgba(229,72,77,0.20)",
                fontSize: 10, fontWeight: 800,
              }}>
                <AlertTriangle size={10} />
                {attnTotal} {attnTotal === 1 ? "conta" : "contas"} requer atenção
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          marginBottom: 14, borderRadius: 13, padding: "12px 16px",
          background: "rgba(229,72,77,0.07)", border: "1px solid rgba(229,72,77,0.20)",
          fontSize: 13, color: P.error,
        }}>
          {error}
        </div>
      )}

      {/* ── COMMAND CENTER ────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize:      9,
            fontWeight:    700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:         P.muted,
            marginBottom:  10,
          }}
        >
          Central de Operações
        </div>
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap:                 12,
          }}
        >
          <OpCard icon={<ShieldCheck size={16} />}       label="KYC Pendente"       value={opCounts.kyc}         href="/admin/kyc"          color="#F59E0B" loading={opLoading} nav={navigate} />
          <OpCard icon={<ArrowDownToLine size={16} />}   label="Saques Pendentes"   value={opCounts.withdrawals} href="/admin/withdrawals"  color="#3B82F6" loading={opLoading} nav={navigate} />
          <OpCard icon={<GitPullRequestArrow size={16} />} label="Aprovações"       value={opCounts.approvals}   href="/admin/approvals"   color="#8B5CF6" loading={opLoading} nav={navigate} />
          <OpCard icon={<ShieldAlert size={16} />}       label="Alertas SOC"        value={opCounts.security}    href="/admin/security"    color="#EF4444" loading={opLoading} nav={navigate} />
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────────── */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
            gap: 12, marginBottom: 18,
          }}>
            {kpis.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={i * 50} />
            ))}
          </div>

          {/* ── CHARTS ROW ─────────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
            gap: 14, marginBottom: 14,
          }}>
            {/* Volume area chart */}
            <div className="dash-panel dash-up">
              <SectionHeader
                title="Volume processado por dia"
                sub={`Transações aprovadas — últimos ${period} dias`}
              />
              {volSeries.length === 0 ? (
                <div style={{ padding: "30px 0", textAlign: "center", fontSize: 12, color: C.dim }}>
                  Sem dados no período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={volSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={P.green} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={P.green} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => tickFormatter(fmtDate(v), volLabels)}
                      tick={xTickStyle}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => fmtK(v)}
                      tick={yTickStyle}
                      axisLine={false} tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<ChartTooltip color={P.green} />} />
                    <Area
                      type="monotone" dataKey="volume"
                      stroke={P.green} strokeWidth={2}
                      fill="url(#gradVol)"
                      dot={false} activeDot={{ r: 4, fill: P.green, stroke: P.card, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Revenue bar chart */}
            <div className="dash-panel dash-up" style={{ animationDelay: "60ms" }}>
              <SectionHeader
                title="Receita diária em taxas"
                sub={`Taxas coletadas — últimos ${period} dias`}
              />
              {revSeries.length === 0 ? (
                <div style={{ padding: "30px 0", textAlign: "center", fontSize: 12, color: C.dim }}>
                  Sem dados no período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={revSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={period > 30 ? 3 : 6}>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => tickFormatter(fmtDate(v), revLabels)}
                      tick={xTickStyle}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => fmtK(v)}
                      tick={yTickStyle}
                      axisLine={false} tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<ChartTooltip color={P.gold} />} />
                    <Bar dataKey="revenue" fill={P.gold} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── BOTTOM ROW: top sellers + attention ────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr",
            gap: 14,
          }}>
            {/* Top sellers */}
            <div className="dash-panel dash-up" style={{ animationDelay: "80ms" }}>
              <SectionHeader
                title="Top sellers por volume"
                sub={`Ranking — últimos ${period} dias`}
              />

              {topSellers.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: C.dim }}>
                  Nenhuma transação no período
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {topSellers.map((s, idx) => {
                    const badge = getStatusBadge(s.status);
                    return (
                      <div key={String(s.userId)} className="dash-seller-row">
                        {/* Rank */}
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: idx < 3 ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${idx < 3 ? "rgba(45,134,89,0.24)" : P.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 900,
                          color: idx < 3 ? P.green : C.dim,
                        }}>
                          {idx + 1}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                            {s.name || "Sem nome"}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.email}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 900, color: C.white,
                            fontVariantNumeric: "tabular-nums", marginBottom: 2,
                          }}>
                            R$ {fmtBRL(s.volume)}
                          </div>
                          <div style={{ fontSize: 10, color: C.dim }}>
                            {s.transactions} txn · R$ {fmtBRL(s.revenue)} fee
                          </div>
                        </div>

                        {/* Status pill */}
                        <span style={{
                          padding: "4px 9px", borderRadius: 999,
                          background: badge.bg, color: badge.color,
                          fontSize: 10, fontWeight: 800, flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attention */}
            <div className="dash-panel dash-up" style={{ animationDelay: "100ms" }}>
              <SectionHeader
                title="Contas — atenção"
                sub="Ações operacionais recomendadas"
              />

              {attnTotal === 0 ? (
                <div style={{
                  padding: "28px 16px", textAlign: "center",
                  borderRadius: 14, border: `1px solid rgba(45,134,89,0.15)`,
                  background: "rgba(45,134,89,0.05)",
                }}>
                  <div style={{ fontSize: 12, color: P.green, fontWeight: 700 }}>
                    Tudo em ordem
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
                    Nenhuma conta requer atenção no momento
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {/* Blocked */}
                  {attention.blocked.length > 0 && (
                    <div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 7, marginBottom: 9,
                      }}>
                        <Ban size={12} color={P.error} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: P.error, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                          Bloqueadas ({attention.blocked.length})
                        </span>
                      </div>
                      {attention.blocked.map((u) => (
                        <div key={u.id} className="dash-attn-row">
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                            {u.name || "Sem nome"}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted }}>{u.email}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* KYC Pending */}
                  {attention.kycPending.length > 0 && (
                    <div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 7, marginBottom: 9,
                      }}>
                        <Clock size={12} color={P.gold} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: P.gold, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                          KYC Pendente ({attention.kycPending.length})
                        </span>
                      </div>
                      {attention.kycPending.map((u) => (
                        <div key={u.id} className="dash-attn-row">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                                {u.name || "Sem nome"}
                              </div>
                              <div style={{ fontSize: 10, color: C.muted }}>{u.email}</div>
                            </div>
                            <span style={{
                              padding: "3px 8px", borderRadius: 999,
                              background: "rgba(129,182,28,0.10)", color: P.gold,
                              fontSize: 9, fontWeight: 800, whiteSpace: "nowrap",
                            }}>
                              {getAccountStatusLabel(u.accountStatus)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No 2FA */}
                  {attention.noTwoFA.length > 0 && (
                    <div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 7, marginBottom: 9,
                      }}>
                        <ShieldOff size={12} color={C.muted} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                          Sem 2FA ({attention.noTwoFA.length})
                        </span>
                      </div>
                      {attention.noTwoFA.map((u) => (
                        <div key={u.id} className="dash-attn-row">
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                            {u.name || "Sem nome"}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted }}>{u.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
