import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw, TrendingUp, TrendingDown,
  Wallet, Receipt, Users, ArrowRightLeft, Percent,
  AlertTriangle, ShieldOff, Clock, Ban,
  ShieldCheck, ArrowDownToLine, GitPullRequestArrow, ShieldAlert,
  Activity, CheckCircle2, Circle,
} from "lucide-react";
import { A, ADMIN_CSS } from "../../components/admin/AdminDS";
import {
  getDashboardOverview, getDashboardVolumeSeries,
  getDashboardRevenueSeries, getDashboardTopSellers,
  getDashboardAttention, getPendingCashouts,
  listApprovals, getSecurityStats,
} from "../../services/admin.service";

/* ── helpers ─────────────────────────────────────────────────── */
function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtK(v = 0) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(1)}K`;
  return `R$ ${fmtBRL(n)}`;
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? "—" : dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtFull(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function getStatusBadge(s) {
  if (s === "blocked")  return { label: "Bloqueado", color: A.red,   bg: "rgba(239,68,68,0.12)"  };
  if (s === "inactive") return { label: "Inativo",   color: A.amber, bg: "rgba(245,158,11,0.12)" };
  return                       { label: "Ativo",     color: A.green, bg: "rgba(57,217,138,0.10)" };
}
function getAccountStatusLabel(v) {
  const map = { email_pending:"Email pendente", basic_user:"Básico", kyc_pending:"KYC pendente", kyc_under_review:"KYC análise", kyc_approved:"KYC aprovado", kyc_rejected:"KYC rejeitado", seller_active:"Seller ativo", suspended:"Suspenso" };
  return map[v] || v || "—";
}

/* ── scoped CSS (extends AdminDS) ────────────────────────────── */
const STYLES = `${ADMIN_CSS}
  .dash-seller { display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.12s; }
  .dash-seller:last-child { border-bottom:none; }
  .dash-seller:hover { background:rgba(57,217,138,0.04); }
  .dash-attn  { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.12s; }
  .dash-attn:last-child { border-bottom:none; }
  .dash-attn:hover { background:rgba(255,255,255,0.02); }
  .dash-period { border:1px solid rgba(255,255,255,0.07); background:transparent; color:#5C6E82; border-radius:7px; padding:5px 11px; font-size:11px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.14s; letter-spacing:0.04em; }
  .dash-period.on { border-color:rgba(57,217,138,0.45); background:rgba(57,217,138,0.10); color:#39D98A; }
  .dash-alert-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:700; font-family:inherit; cursor:pointer; border:1px solid transparent; transition:background 0.14s; }
  .dash-alert-chip:hover { filter:brightness(1.15); }
`;

/* ── Tooltip ──────────────────────────────────────────────────── */
function ChartTip({ active, payload, label, color = A.green }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18191D", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 13px", boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}>
      <div style={{ fontSize: 10, color: A.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>R$ {fmtBRL(payload[0].value)}</div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function Skel({ h, r = 12, style = {} }) {
  return <div className="a-skel" style={{ height: h, borderRadius: r, ...style }} />;
}
function SkeletonDash({ isMobile }) {
  return (
    <div>
      <Skel h={isMobile ? 210 : 270} r={20} style={{ marginBottom: 20 }} />
      <Skel h={72} r={14} style={{ marginBottom: 20 }} />
      <Skel h={isMobile ? 180 : 280} r={18} style={{ marginBottom: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 14 }}>
        <Skel h={240} />
        <Skel h={240} />
      </div>
    </div>
  );
}

/* ── xTick helper ─────────────────────────────────────────────── */
function xTick(val, labels) {
  const idx  = labels.indexOf(val);
  const step = labels.length > 60 ? 14 : labels.length > 30 ? 7 : labels.length > 14 ? 3 : 1;
  return idx % step === 0 ? val : "";
}

/* ══════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════ */
function Hero({ overview, volSeries, period, setPeriod, loading, onRefresh, refreshedAt, attnTotal, isMobile }) {
  const volume = overview?.volumeTotal ?? 0;
  const delta  = overview?.deltas?.volume;
  const up     = delta > 0;

  return (
    <div
      className="a-hero a-up"
      style={{ minHeight: isMobile ? 210 : 268 }}
    >
      {/* dot-grid */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.14, backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      {/* green glow */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(57,217,138,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
      {/* chart ghost */}
      {!isMobile && volSeries.length > 0 && (
        <div style={{ position: "absolute", right: 0, bottom: 0, top: 0, width: "46%", pointerEvents: "none", opacity: 0.18, filter: "drop-shadow(0 0 18px rgba(57,217,138,0.55))" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volSeries} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={A.green} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={A.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="volume" stroke={A.green} strokeWidth={2.5} fill="url(#hg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "22px 20px" : "26px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "inherit" }}>
        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "rgba(57,217,138,0.10)", border: "1px solid rgba(57,217,138,0.24)", color: A.green, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <span className="a-live" style={{ width: 5, height: 5, borderRadius: "50%", background: A.green }} />
              Operacional
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: A.muted, fontSize: 10, fontWeight: 600 }}>
              <Activity size={9} /> OrionPay Admin
            </span>
            {attnTotal > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.22)", color: A.red, fontSize: 10, fontWeight: 700 }}>
                <AlertTriangle size={9} /> {attnTotal} pendência{attnTotal > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[7, 30, 90].map(d => (
              <button key={d} className={`dash-period${period === d ? " on" : ""}`} onClick={() => setPeriod(d)}>{d}d</button>
            ))}
            <button onClick={onRefresh} disabled={loading} className="a-btn" style={{ opacity: loading ? 0.5 : 1 }}>
              <RefreshCw size={11} className={loading ? "a-spin" : ""} />
              {loading ? "..." : "Atualizar"}
            </button>
          </div>
        </div>

        {/* main metric */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: A.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Volume processado · {period} dias
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ fontSize: isMobile ? 44 : 64, fontWeight: 900, color: A.white, letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(57,217,138,0.30)" }}>
              {loading ? "—" : `R$ ${fmtBRL(volume)}`}
            </div>
            {delta != null && !loading && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: up ? "rgba(57,217,138,0.14)" : "rgba(239,68,68,0.12)", color: up ? A.green : A.red, border: `1px solid ${up ? "rgba(57,217,138,0.28)" : "rgba(239,68,68,0.26)"}`, marginBottom: 4 }}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="a-live" style={{ width: 4, height: 4, borderRadius: "50%", background: A.green }} />
              <span style={{ fontSize: 11, color: A.green, fontWeight: 600 }}>Todos os sistemas ativos</span>
            </div>
            {refreshedAt && <span style={{ fontSize: 10, color: A.dim }}>· {fmtFull(refreshedAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALERT BAR
══════════════════════════════════════════════════════════════ */
function AlertBar({ opCounts, attention, opLoading, nav }) {
  if (opLoading) return null;
  const chips = [];
  if (opCounts.security > 0)        chips.push({ c: A.red,   icon: <ShieldAlert size={11} />, label: `${opCounts.security} alerta SOC`,                   href: "/admin/security"    });
  if (attention.blocked.length > 0) chips.push({ c: A.red,   icon: <Ban size={11} />,         label: `${attention.blocked.length} conta bloqueada`,         href: "/admin/sellers"     });
  if (opCounts.kyc > 0)             chips.push({ c: A.amber, icon: <Clock size={11} />,        label: `${opCounts.kyc} KYC pendente`,                       href: "/admin/kyc"         });
  if (opCounts.withdrawals > 0)     chips.push({ c: A.amber, icon: <ArrowDownToLine size={11} />, label: `${opCounts.withdrawals} saque pendente`,          href: "/admin/withdrawals" });
  if (opCounts.approvals > 0)       chips.push({ c: A.blue,  icon: <GitPullRequestArrow size={11} />, label: `${opCounts.approvals} aprovação`,             href: "/admin/approvals"   });
  if (attention.noTwoFA.length > 0) chips.push({ c: A.muted, icon: <ShieldOff size={11} />,   label: `${attention.noTwoFA.length} sem 2FA`,                 href: "/admin/sellers"     });
  if (chips.length === 0) return null;

  const hasRed = chips.some(ch => ch.c === A.red);
  const accent = hasRed ? A.red : A.amber;
  return (
    <div className="a-up" style={{ marginBottom: 20, padding: "11px 16px 11px 20px", borderRadius: 12, background: hasRed ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)", border: `1px solid ${hasRed ? "rgba(239,68,68,0.16)" : "rgba(245,158,11,0.16)"}`, borderLeft: `3px solid ${accent}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", animationDelay: "30ms" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <AlertTriangle size={11} color={accent} />
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: accent }}>
          {hasRed ? "Atenção necessária" : "Pendências"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {chips.map((ch, i) => (
          <button key={i} className="dash-alert-chip" onClick={() => nav(ch.href)} style={{ background: `${ch.c}14`, borderColor: `${ch.c}28`, color: ch.c }}>
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   METRIC RAIL
══════════════════════════════════════════════════════════════ */
function MetricRail({ overview, isMobile }) {
  if (!overview) return null;
  const taxa = overview.revenueTotal && overview.volumeTotal
    ? `${((overview.revenueTotal / overview.volumeTotal) * 100).toFixed(2)}%`
    : "—";

  const cells = [
    { label: "Receita em taxas",  value: `R$ ${fmtBRL(overview.revenueTotal)}`,      delta: overview.deltas?.revenue,      accent: A.gold   },
    { label: "Transações",        value: String(overview.transactionsTotal ?? 0),     delta: overview.deltas?.transactions, accent: A.blue   },
    { label: "Sellers ativos",    value: String(overview.activeSellers ?? 0),         delta: null, sub: `de ${overview.totalSellers ?? 0} total`, accent: A.purple },
    { label: "Ticket médio",      value: `R$ ${fmtBRL(overview.ticketAverage)}`,      delta: null,                          accent: A.green  },
    { label: "Taxa média",        value: taxa,                                         delta: null,                          accent: A.gold   },
  ];

  return (
    <div className="a-rail a-up" style={{ marginBottom: 20, animationDelay: "40ms", flexWrap: isMobile ? "wrap" : "nowrap" }}>
      {cells.map((cell, i) => {
        const up = cell.delta > 0;
        return (
          <div key={cell.label} className="a-rail-cell" style={isMobile ? { minWidth: "45%", borderBottom: i < cells.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" } : {}}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.11em", textTransform: "uppercase", color: A.dim, marginBottom: 6 }}>{cell.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: A.white, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{cell.value}</span>
              {typeof cell.delta === "number" && (
                <span style={{ fontSize: 10, fontWeight: 800, color: up ? A.green : A.red }}>{up ? "▲" : "▼"} {Math.abs(cell.delta)}%</span>
              )}
            </div>
            {cell.sub && <div style={{ fontSize: 10, color: A.muted, marginTop: 2 }}>{cell.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
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

  const load = useCallback(async (p = period, showSkel = true) => {
    try {
      if (showSkel) setLoading(true);
      setError("");
      const [ov, vol, rev, top, attn, opRes] = await Promise.all([
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
      setTopSellers(Array.isArray(top?.items) ? top.items  : []);
      const attnData = {
        blocked:    Array.isArray(attn?.blocked)    ? attn.blocked    : [],
        kycPending: Array.isArray(attn?.kycPending) ? attn.kycPending : [],
        noTwoFA:    Array.isArray(attn?.noTwoFA)    ? attn.noTwoFA    : [],
      };
      setAttention(attnData);
      const [cashR, apprR, secR] = opRes;
      setOpCounts({
        kyc:         attnData.kycPending.length,
        withdrawals: extractCount(cashR),
        approvals:   extractCount(apprR),
        security:    secR.status === "fulfilled" ? (secR.value?.unresolved ?? 0) : 0,
      });
      setOpLoading(false);
      setRefreshedAt(new Date());
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados do dashboard.");
    } finally {
      if (showSkel) setLoading(false);
    }
  }, [period]);

  useEffect(() => { document.title = "Dashboard • OrionPay"; load(period); }, [period]);

  const attnTotal  = attention.blocked.length + attention.kycPending.length + attention.noTwoFA.length;
  const mainH      = isMobile ? 200 : 290;
  const secH       = isMobile ? 170 : 224;
  const volLabels  = volSeries.map(d => fmtDate(d.date));
  const revLabels  = revSeries.map(d => fmtDate(d.date));

  return (
    <div style={{ maxWidth: 1280, paddingBottom: 48 }}>
      <style>{STYLES}</style>

      {/* 1. HERO */}
      <Hero
        overview={overview}
        volSeries={volSeries}
        period={period}
        setPeriod={setPeriod}
        loading={loading}
        onRefresh={() => load(period, true)}
        refreshedAt={refreshedAt}
        attnTotal={attnTotal}
        isMobile={isMobile}
      />

      {/* error */}
      {error && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)", fontSize: 13, color: A.red, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <SkeletonDash isMobile={isMobile} />
      ) : (
        <>
          {/* 2. ALERT BAR */}
          <AlertBar opCounts={opCounts} attention={attention} opLoading={opLoading} nav={navigate} />

          {/* 3. METRIC RAIL */}
          <MetricRail overview={overview} isMobile={isMobile} />

          {/* 4. MAIN CHART — Volume */}
          <div className="a-panel a-up" style={{ marginBottom: 14, animationDelay: "80ms" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: A.white, marginBottom: 2 }}>Volume por dia</div>
                <div style={{ fontSize: 11, color: A.muted }}>Transações aprovadas — últimos {period} dias</div>
              </div>
            </div>
            {volSeries.length === 0 ? (
              <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12, color: A.dim }}>Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={mainH}>
                <AreaChart data={volSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={A.green} stopOpacity={0.30} />
                      <stop offset="95%" stopColor={A.green} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), volLabels)} tick={{ fill: A.dim, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: A.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={62} />
                  <Tooltip content={<ChartTip color={A.green} />} />
                  <Area type="monotone" dataKey="volume" stroke={A.green} strokeWidth={2.5} fill="url(#gVol)" dot={false} activeDot={{ r: 5, fill: A.green, stroke: "#0A0A0E", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 5. SECONDARY ROW */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Revenue */}
            <div className="a-panel a-up" style={{ animationDelay: "120ms" }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: A.white, marginBottom: 2 }}>Receita diária</div>
                <div style={{ fontSize: 11, color: A.muted }}>Taxas coletadas — últimos {period} dias</div>
              </div>
              {revSeries.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12, color: A.dim }}>Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={secH}>
                  <BarChart data={revSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={period > 30 ? 3 : 6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), revLabels)} tick={{ fill: A.dim, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: A.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={62} />
                    <Tooltip content={<ChartTip color={A.goldBright} />} />
                    <Bar dataKey="revenue" fill={A.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Sellers */}
            <div className="a-panel a-up" style={{ padding: 0, overflow: "hidden", animationDelay: "140ms" }}>
              <div style={{ padding: "18px 18px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: A.white, marginBottom: 2 }}>Top sellers</div>
                <div style={{ fontSize: 11, color: A.muted }}>Ranking — {period} dias</div>
              </div>
              <hr className="a-hr" />
              {topSellers.length === 0 ? (
                <div style={{ padding: "28px 0", textAlign: "center", fontSize: 12, color: A.dim }}>Nenhuma transação</div>
              ) : (
                topSellers.map((s, idx) => {
                  const badge = getStatusBadge(s.status);
                  const top3  = idx < 3;
                  return (
                    <div key={String(s.userId)} className="dash-seller">
                      <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: top3 ? "rgba(57,217,138,0.10)" : "rgba(255,255,255,0.04)", border: `1px solid ${top3 ? "rgba(57,217,138,0.22)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: top3 ? A.green : A.dim }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: A.white, marginBottom: 1 }}>{s.name || "—"}</div>
                        <div style={{ fontSize: 10, color: A.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: A.white, fontVariantNumeric: "tabular-nums" }}>R$ {fmtBRL(s.volume)}</div>
                        <div style={{ fontSize: 10, color: A.dim }}>{s.transactions} txn</div>
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: 999, background: badge.bg, color: badge.color, fontSize: 9, fontWeight: 800, flexShrink: 0, whiteSpace: "nowrap" }}>{badge.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 6. ATTENTION */}
          {attnTotal > 0 && (
            <div className="a-panel a-up" style={{ animationDelay: "160ms" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: A.white, marginBottom: 4 }}>Contas — atenção</div>
              <div style={{ fontSize: 11, color: A.muted, marginBottom: 18 }}>Ações operacionais recomendadas</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
                {attention.blocked.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <Ban size={11} color={A.red} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: A.red, textTransform: "uppercase", letterSpacing: "0.10em" }}>Bloqueadas ({attention.blocked.length})</span>
                    </div>
                    {attention.blocked.map(u => (
                      <div key={u.id} className="dash-attn">
                        <div style={{ fontSize: 12, fontWeight: 700, color: A.white, marginBottom: 1 }}>{u.name || "—"}</div>
                        <div style={{ fontSize: 10, color: A.muted }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
                {attention.kycPending.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <Clock size={11} color={A.amber} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: A.amber, textTransform: "uppercase", letterSpacing: "0.10em" }}>KYC Pendente ({attention.kycPending.length})</span>
                    </div>
                    {attention.kycPending.map(u => (
                      <div key={u.id} className="dash-attn">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: A.white, marginBottom: 1 }}>{u.name || "—"}</div>
                            <div style={{ fontSize: 10, color: A.muted }}>{u.email}</div>
                          </div>
                          <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.10)", color: A.amber, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>
                            {getAccountStatusLabel(u.accountStatus)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {attention.noTwoFA.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <ShieldOff size={11} color={A.muted} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: A.muted, textTransform: "uppercase", letterSpacing: "0.10em" }}>Sem 2FA ({attention.noTwoFA.length})</span>
                    </div>
                    {attention.noTwoFA.map(u => (
                      <div key={u.id} className="dash-attn">
                        <div style={{ fontSize: 12, fontWeight: 700, color: A.white, marginBottom: 1 }}>{u.name || "—"}</div>
                        <div style={{ fontSize: 10, color: A.muted }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
