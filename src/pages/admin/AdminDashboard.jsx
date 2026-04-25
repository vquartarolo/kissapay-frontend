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
  Activity,
} from "lucide-react";
import C from "../../constants/colors";
import {
  getDashboardOverview, getDashboardVolumeSeries,
  getDashboardRevenueSeries, getDashboardTopSellers,
  getDashboardAttention, getPendingCashouts,
  listApprovals, getSecurityStats,
} from "../../services/admin.service";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS  (hardcoded para SVG/recharts)
══════════════════════════════════════════════════════════════ */
const P = {
  green:        "#2D8659",
  greenBright:  "#34A065",
  greenDeep:    "#1A4A30",
  gold:         "#C9991F",
  goldBright:   "#E8B340",
  blue:         "#3B82F6",
  purple:       "#8B5CF6",
  amber:        "#F59E0B",
  red:          "#EF4444",
  card:         "#141417",
  cardSoft:     "#1C1C21",
  cardDeep:     "#0F0F12",
  border:       "rgba(255,255,255,0.07)",
  borderMed:    "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.18)",
  muted:        "#5A6A7E",
  dim:          "#2D3A48",
  white:        "#FFFFFF",
  bg:           "#09090B",
};

/* ══════════════════════════════════════════════════════════════
   SCOPED STYLES
══════════════════════════════════════════════════════════════ */
const STYLES = `
  @keyframes d-up {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0);     }
  }
  @keyframes d-spin { to { transform:rotate(360deg); } }
  @keyframes d-pulse {
    0%,100% { opacity:1; }
    50%     { opacity:0.35; }
  }
  @keyframes d-skel {
    0%   { background-position:-400% 0; }
    100% { background-position: 400% 0; }
  }
  @keyframes d-glow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,134,89,0); }
    50%     { box-shadow:0 0 20px 0 rgba(45,134,89,0.20); }
  }

  .d-up   { animation:d-up 0.30s ease both; }
  .d-spin { animation:d-spin 0.75s linear infinite; }
  .d-live { animation:d-pulse 2.2s ease-in-out infinite; }

  .d-kpi {
    background: ${P.card};
    border: 1px solid ${P.border};
    border-radius: 18px;
    padding: 20px 22px 18px;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }
  .d-kpi:hover {
    transform: translateY(-4px);
    border-color: ${P.borderMed};
    box-shadow: 0 16px 48px rgba(0,0,0,0.28);
  }
  .d-kpi-hero {
    background: linear-gradient(135deg, #162419 0%, #141417 100%);
    border: 1px solid rgba(45,134,89,0.24);
    border-radius: 18px;
    padding: 24px 26px 20px;
    transition: transform 0.18s, box-shadow 0.18s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }
  .d-kpi-hero:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.32), 0 0 40px rgba(45,134,89,0.08);
  }
  .d-op {
    background: ${P.card};
    border: 1px solid ${P.border};
    border-radius: 16px;
    padding: 16px 18px 14px;
    transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .d-op:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(0,0,0,0.24);
  }
  .d-op:focus-visible {
    outline: 2px solid rgba(45,134,89,0.5);
    outline-offset: 2px;
  }
  .d-panel {
    background: ${P.card};
    border: 1px solid ${P.border};
    border-radius: 18px;
    padding: 22px 22px 18px;
  }
  .d-seller-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 13px;
    border: 1px solid ${P.border};
    background: ${P.cardSoft};
    transition: border-color 0.15s, transform 0.15s, background 0.15s;
  }
  .d-seller-row:hover {
    border-color: ${P.borderMed};
    transform: translateX(2px);
    background: rgba(45,134,89,0.04);
  }
  .d-attn-row {
    padding: 10px 13px;
    border-radius: 12px;
    border: 1px solid ${P.border};
    background: ${P.cardSoft};
    transition: border-color 0.15s, background 0.15s;
    margin-bottom: 7px;
  }
  .d-attn-row:last-child { margin-bottom:0; }
  .d-attn-row:hover { border-color:${P.borderMed}; background:rgba(255,255,255,0.02); }
  .d-period-btn {
    border: 1px solid ${P.border};
    background: transparent;
    color: ${P.muted};
    border-radius: 10px;
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    letter-spacing: 0.04em;
  }
  .d-period-btn.on {
    border-color: rgba(45,134,89,0.45);
    background: rgba(45,134,89,0.10);
    color: #34A065;
  }
  .d-skel {
    background: linear-gradient(90deg, #1C1C21 25%, #252528 50%, #1C1C21 75%);
    background-size: 400% 100%;
    animation: d-skel 1.8s ease infinite;
    border-radius: 14px;
  }
`;

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
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
  return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtFull(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function getStatusBadge(status) {
  if (status === "blocked")  return { label: "Bloqueado", color: P.red,    bg: "rgba(239,68,68,0.12)"  };
  if (status === "inactive") return { label: "Inativo",   color: P.amber,  bg: "rgba(245,158,11,0.12)" };
  return                            { label: "Ativo",     color: P.green,  bg: "rgba(45,134,89,0.12)"  };
}
function getAccountStatusLabel(v) {
  const map = { email_pending:"Email pendente", basic_user:"Básico", kyc_pending:"KYC pendente", kyc_under_review:"KYC análise", kyc_approved:"KYC aprovado", kyc_rejected:"KYC rejeitado", seller_active:"Seller ativo", suspended:"Suspenso" };
  return map[v] || v || "—";
}

/* ══════════════════════════════════════════════════════════════
   SVG SPARKLINE
══════════════════════════════════════════════════════════════ */
function Sparkline({ data, color = P.green, width = 180, height = 64 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.volume ?? d.revenue ?? 0);
  const max = Math.max(...vals) || 1;
  const min = Math.min(...vals);
  const rng = max - min || 1;
  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * width,
    y: (1 - (v - min) / rng) * (height - 4) + 2,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath}L${width},${height}L0,${height}Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0}   />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spk)" />
      <path d={linePath} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHART TOOLTIP
══════════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label, color = P.green }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: P.cardSoft, border: `1px solid ${P.borderMed}`, borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 28px rgba(0,0,0,0.40)" }}>
      <div style={{ fontSize: 10, color: P.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
          R$ {fmtBRL(p.value)}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKELETON LOADER
══════════════════════════════════════════════════════════════ */
function Skel({ w = "100%", h = 90, r = 16, style = {} }) {
  return <div className="d-skel" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />;
}
function SkeletonDash({ isMobile }) {
  return (
    <div>
      <Skel h={130} r={20} style={{ marginBottom: 18 }} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[...Array(4)].map((_, i) => <Skel key={i} h={104} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <Skel h={156} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 12 }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h={68} />)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
        <Skel h={260} />
        <Skel h={260} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   OP CARD (Command Center)
══════════════════════════════════════════════════════════════ */
function OpCard({ icon, label, value, href, color, loading, nav }) {
  const alert = !loading && value > 0;
  return (
    <div
      className="d-op"
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${loading ? "carregando" : value}`}
      onClick={() => nav(href)}
      onKeyDown={(e) => e.key === "Enter" && nav(href)}
      style={{ borderColor: alert ? color + "35" : undefined }}
    >
      {alert && (
        <span className="d-live" style={{ position: "absolute", top: 12, right: 12, width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}99` }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "18", border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: loading ? 18 : 26, fontWeight: 900, color: alert ? color : P.white, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 5, fontVariantNumeric: "tabular-nums", transition: "color 0.2s" }}>
        {loading ? "—" : value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: P.muted }}>{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO KPI (Volume — destaque principal)
══════════════════════════════════════════════════════════════ */
function HeroKpiCard({ value, delta, period, volSeries, delay = 0 }) {
  const up      = delta > 0;
  const hasData = delta != null;
  return (
    <div className="d-kpi-hero d-up" style={{ animationDelay: `${delay}ms`, minHeight: 168 }}>
      <div style={{ position: "absolute", top: -70, left: -70, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,134,89,0.15) 0%, transparent 65%)", pointerEvents: "none" }} />
      {volSeries.length > 0 && (
        <div style={{ position: "absolute", bottom: 0, right: 0, opacity: 0.18, pointerEvents: "none" }}>
          <Sparkline data={volSeries} color={P.green} width={200} height={78} />
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "rgba(45,134,89,0.14)", border: "1px solid rgba(45,134,89,0.25)", color: P.greenBright, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <Wallet size={10} />
            Volume processado
          </div>
          {hasData && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: up ? "rgba(45,134,89,0.14)" : "rgba(239,68,68,0.12)", color: up ? P.greenBright : P.red, border: `1px solid ${up ? "rgba(45,134,89,0.25)" : "rgba(239,68,68,0.25)"}` }}>
              {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: P.white, letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 10, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: P.muted }}>
          Transações aprovadas — últimos {period} dias
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECONDARY KPI CARD
══════════════════════════════════════════════════════════════ */
function KpiCard({ icon, label, value, delta, helper, accent, delay = 0 }) {
  const up      = delta > 0;
  const neutral = delta === 0 || delta == null;
  const hasData = typeof delta === "number";
  return (
    <div className="d-kpi d-up" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${accent}18`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
          {icon}
        </div>
        {hasData && !neutral && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 7, fontSize: 10, fontWeight: 800, background: up ? "rgba(45,134,89,0.10)" : "rgba(239,68,68,0.10)", color: up ? P.green : P.red, border: `1px solid ${up ? "rgba(45,134,89,0.18)" : "rgba(239,68,68,0.18)"}` }}>
            {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: P.white, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: P.dim, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: P.muted }}>{helper}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════════ */
function SH({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: P.white, letterSpacing: "-0.01em", marginBottom: 3 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: P.muted }}>{sub}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function AdminDashboard({ isMobile }) {
  const navigate = useNavigate();

  const [period,     setPeriod]     = useState(30);
  const [loading,    setLoading]    = useState(true);
  const [overview,   setOverview]   = useState(null);
  const [volSeries,  setVolSeries]  = useState([]);
  const [revSeries,  setRevSeries]  = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [attention,  setAttention]  = useState({ blocked: [], kycPending: [], noTwoFA: [] });
  const [error,      setError]      = useState("");
  const [refreshedAt,setRefreshedAt]= useState(null);
  const [opCounts,   setOpCounts]   = useState({ kyc:0, withdrawals:0, approvals:0, security:0 });
  const [opLoading,  setOpLoading]  = useState(true);

  function extractCount(r) {
    if (!r || r.status !== "fulfilled") return 0;
    const v = r.value;
    if (!v) return 0;
    if (Array.isArray(v))            return v.length;
    if (typeof v.total === "number") return v.total;
    if (Array.isArray(v.items))      return v.items.length;
    return 0;
  }

  const load = useCallback(async (p = period, showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
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
      setVolSeries(Array.isArray(vol?.series)  ? vol.series  : []);
      setRevSeries(Array.isArray(rev?.series)  ? rev.series  : []);
      setTopSellers(Array.isArray(top?.items)  ? top.items   : []);

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
      console.error("Dashboard error:", err);
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [period]);

  useEffect(() => { document.title = "Dashboard • OrionPay"; load(period); }, [period]);

  const attnTotal = attention.blocked.length + attention.kycPending.length + attention.noTwoFA.length;
  const chartH    = isMobile ? 180 : 224;
  const volLabels = volSeries.map(d => fmtDate(d.date));
  const revLabels = revSeries.map(d => fmtDate(d.date));

  function xTick(val, series) {
    const idx  = series.indexOf(val);
    const step = series.length > 60 ? 14 : series.length > 30 ? 7 : series.length > 14 ? 3 : 1;
    return idx % step === 0 ? val : "";
  }

  const kpis = overview ? [
    { icon:<Percent size={15}/>,      label:"Receita em taxas",  value:`R$ ${fmtBRL(overview.revenueTotal)}`,  delta:overview.deltas?.revenue,      helper:`Taxas coletadas — ${period}d`,      accent:P.gold   },
    { icon:<ArrowRightLeft size={15}/>,label:"Transações",       value:String(overview.transactionsTotal??0),  delta:overview.deltas?.transactions,  helper:`Operações aprovadas — ${period}d`,  accent:P.blue   },
    { icon:<Users size={15}/>,         label:"Sellers ativos",   value:String(overview.activeSellers??0),      delta:null,                           helper:`De ${overview.totalSellers??0} total`, accent:P.purple },
    { icon:<Receipt size={15}/>,       label:"Ticket médio",     value:`R$ ${fmtBRL(overview.ticketAverage)}`, delta:null,                           helper:`Média por transação — ${period}d`,  accent:P.green  },
  ] : [];

  return (
    <div>
      <style>{STYLES}</style>

      {/* ══ HERO HEADER ══════════════════════════════════════════ */}
      <div
        style={{
          position:"relative", overflow:"hidden",
          borderRadius:20, marginBottom:20,
          padding: isMobile ? "20px 18px" : "24px 28px",
          background:"linear-gradient(135deg, #101A14 0%, #0C0C0F 55%, #0E1014 100%)",
          border:"1px solid rgba(45,134,89,0.20)",
        }}
      >
        {/* Dot grid */}
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",opacity:0.22,backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",backgroundSize:"22px 22px" }} />
        {/* Green glow */}
        <div style={{ position:"absolute",top:-90,left:-90,width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle, rgba(45,134,89,0.13) 0%, transparent 65%)",pointerEvents:"none" }} />
        {/* Gold glow */}
        <div style={{ position:"absolute",bottom:-60,right:-30,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle, rgba(201,153,31,0.07) 0%, transparent 70%)",pointerEvents:"none" }} />

        <div style={{ position:"relative",zIndex:1 }}>
          {/* Top bar */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              <span style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"5px 12px",borderRadius:999,background:"rgba(45,134,89,0.10)",border:"1px solid rgba(45,134,89,0.26)",color:P.greenBright,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase" }}>
                <span className="d-live" style={{ width:6,height:6,borderRadius:"50%",background:P.greenBright }} />
                Sistema operacional
              </span>
              <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:999,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:P.muted,fontSize:10,fontWeight:600 }}>
                <Activity size={9} />
                Painel Seguro
              </span>
              {attnTotal > 0 && (
                <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:999,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.20)",color:P.red,fontSize:10,fontWeight:700 }}>
                  <AlertTriangle size={10} />
                  {attnTotal} {attnTotal===1?"conta":"contas"} requer atenção
                </span>
              )}
            </div>

            {/* Period + refresh */}
            <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
              {[7,30,90].map(d => (
                <button key={d} className={`d-period-btn${period===d?" on":""}`} onClick={() => setPeriod(d)}>
                  {d}d
                </button>
              ))}
              <button
                onClick={() => load(period, true)}
                disabled={loading}
                style={{ border:`1px solid ${P.border}`,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"7px 13px",cursor:loading?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:P.muted,fontFamily:"inherit",opacity:loading?0.5:1,transition:"background 0.15s" }}
              >
                <RefreshCw size={12} className={loading ? "d-spin" : ""} />
                {loading ? "..." : "Atualizar"}
              </button>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom:18 }}>
            <h1 style={{ fontSize:isMobile?24:32,fontWeight:900,color:P.white,letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:6 }}>
              Central de Operações
            </h1>
            <div style={{ display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
              <span style={{ fontSize:13,color:P.muted }}>OrionPay — Infraestrutura Financeira</span>
              {refreshedAt && <span style={{ fontSize:11,color:P.dim }}>Atualizado: {fmtFull(refreshedAt)}</span>}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:`1px solid rgba(255,255,255,0.07)`,paddingTop:12,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span className="d-live" style={{ width:5,height:5,borderRadius:"50%",background:P.greenBright }} />
              <span style={{ fontSize:11,color:P.greenBright,fontWeight:600 }}>Todos os sistemas operacionais</span>
            </div>
            <span style={{ fontSize:11,color:P.dim }}>· Última atualização automática: agora</span>
          </div>
        </div>
      </div>

      {/* ══ ERROR ════════════════════════════════════════════════ */}
      {error && (
        <div style={{ marginBottom:14,borderRadius:14,padding:"12px 16px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.22)",fontSize:13,color:P.red,display:"flex",alignItems:"center",gap:8 }}>
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonDash isMobile={isMobile} />
      ) : (
        <>
          {/* ══ COMMAND CENTER ═══════════════════════════════════ */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.13em",textTransform:"uppercase",color:P.dim,marginBottom:10 }}>
              Central de Operações
            </div>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12 }}>
              <OpCard icon={<ShieldCheck size={15}/>}         label="KYC Pendente"     value={opCounts.kyc}         href="/admin/kyc"         color={P.amber}  loading={opLoading} nav={navigate} />
              <OpCard icon={<ArrowDownToLine size={15}/>}     label="Saques Pend."     value={opCounts.withdrawals} href="/admin/withdrawals" color={P.blue}   loading={opLoading} nav={navigate} />
              <OpCard icon={<GitPullRequestArrow size={15}/>} label="Aprovações"       value={opCounts.approvals}   href="/admin/approvals"  color={P.purple} loading={opLoading} nav={navigate} />
              <OpCard icon={<ShieldAlert size={15}/>}         label="Alertas SOC"      value={opCounts.security}    href="/admin/security"   color={P.red}    loading={opLoading} nav={navigate} />
            </div>
          </div>

          {/* ══ KPI — HERO + SECONDARY ═══════════════════════════ */}
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1.4fr 1fr",gap:14,marginBottom:14 }}>
            <HeroKpiCard
              value={`R$ ${fmtBRL(overview?.volumeTotal)}`}
              delta={overview?.deltas?.volume}
              period={period}
              volSeries={volSeries}
              delay={0}
            />
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:12 }}>
              {kpis.map((k, i) => <KpiCard key={k.label} {...k} delay={i*50} />)}
            </div>
          </div>

          {/* ══ CHARTS ═══════════════════════════════════════════ */}
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1.6fr 1fr",gap:14,marginBottom:14 }}>
            <div className="d-panel d-up">
              <SH title="Volume por dia" sub={`Transações aprovadas — últimos ${period} dias`} />
              {volSeries.length === 0 ? (
                <div style={{ padding:"28px 0",textAlign:"center",fontSize:12,color:P.dim }}>Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={volSeries} margin={{ top:4,right:4,left:0,bottom:0 }}>
                    <defs>
                      <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={P.green} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={P.green} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), volLabels)} tick={{ fill:P.dim,fontSize:10,fontWeight:600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmtK(v)} tick={{ fill:P.muted,fontSize:10 }} axisLine={false} tickLine={false} width={62} />
                    <Tooltip content={<ChartTooltip color={P.greenBright} />} />
                    <Area type="monotone" dataKey="volume" stroke={P.green} strokeWidth={2.5} fill="url(#gVol)" dot={false} activeDot={{ r:5,fill:P.greenBright,stroke:P.card,strokeWidth:2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="d-panel d-up" style={{ animationDelay:"60ms" }}>
              <SH title="Receita diária" sub={`Taxas coletadas — últimos ${period} dias`} />
              {revSeries.length === 0 ? (
                <div style={{ padding:"28px 0",textAlign:"center",fontSize:12,color:P.dim }}>Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={chartH}>
                  <BarChart data={revSeries} margin={{ top:4,right:4,left:0,bottom:0 }} barSize={period>30?3:6}>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), revLabels)} tick={{ fill:P.dim,fontSize:10,fontWeight:600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmtK(v)} tick={{ fill:P.muted,fontSize:10 }} axisLine={false} tickLine={false} width={62} />
                    <Tooltip content={<ChartTooltip color={P.goldBright} />} />
                    <Bar dataKey="revenue" fill={P.gold} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ══ BOTTOM: TOP SELLERS + ATTENTION ═════════════════ */}
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1.3fr 1fr",gap:14 }}>
            {/* Top Sellers */}
            <div className="d-panel d-up" style={{ animationDelay:"80ms" }}>
              <SH title="Top sellers por volume" sub={`Ranking — últimos ${period} dias`} />
              {topSellers.length === 0 ? (
                <div style={{ padding:"24px 0",textAlign:"center",fontSize:12,color:P.dim }}>Nenhuma transação no período</div>
              ) : (
                <div style={{ display:"grid",gap:8 }}>
                  {topSellers.map((s, idx) => {
                    const badge = getStatusBadge(s.status);
                    const top3  = idx < 3;
                    return (
                      <div key={String(s.userId)} className="d-seller-row">
                        <div style={{ width:28,height:28,borderRadius:8,flexShrink:0,background:top3?"rgba(45,134,89,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${top3?"rgba(45,134,89,0.26)":P.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:top3?P.green:P.dim }}>
                          {idx+1}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:P.white,marginBottom:2 }}>{s.name||"Sem nome"}</div>
                          <div style={{ fontSize:11,color:P.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.email}</div>
                        </div>
                        <div style={{ textAlign:"right",flexShrink:0 }}>
                          <div style={{ fontSize:14,fontWeight:900,color:P.white,fontVariantNumeric:"tabular-nums",marginBottom:2 }}>R$ {fmtBRL(s.volume)}</div>
                          <div style={{ fontSize:10,color:P.dim }}>{s.transactions} txn · R$ {fmtBRL(s.revenue)} fee</div>
                        </div>
                        <span style={{ padding:"4px 9px",borderRadius:999,background:badge.bg,color:badge.color,fontSize:10,fontWeight:800,flexShrink:0,whiteSpace:"nowrap" }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attention */}
            <div className="d-panel d-up" style={{ animationDelay:"100ms" }}>
              <SH title="Contas — atenção" sub="Ações operacionais recomendadas" />
              {attnTotal === 0 ? (
                <div style={{ padding:"28px 16px",textAlign:"center",borderRadius:14,border:`1px solid rgba(45,134,89,0.15)`,background:"rgba(45,134,89,0.04)" }}>
                  <div style={{ fontSize:13,color:P.green,fontWeight:700,marginBottom:4 }}>Tudo em ordem</div>
                  <div style={{ fontSize:11,color:P.dim }}>Nenhuma conta requer atenção</div>
                </div>
              ) : (
                <div style={{ display:"grid",gap:16 }}>
                  {attention.blocked.length > 0 && (
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:9 }}>
                        <Ban size={12} color={P.red} />
                        <span style={{ fontSize:10,fontWeight:800,color:P.red,textTransform:"uppercase",letterSpacing:"0.10em" }}>Bloqueadas ({attention.blocked.length})</span>
                      </div>
                      {attention.blocked.map(u => (
                        <div key={u.id} className="d-attn-row">
                          <div style={{ fontSize:12,fontWeight:700,color:P.white,marginBottom:2 }}>{u.name||"Sem nome"}</div>
                          <div style={{ fontSize:10,color:P.muted }}>{u.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {attention.kycPending.length > 0 && (
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:9 }}>
                        <Clock size={12} color={P.amber} />
                        <span style={{ fontSize:10,fontWeight:800,color:P.amber,textTransform:"uppercase",letterSpacing:"0.10em" }}>KYC Pendente ({attention.kycPending.length})</span>
                      </div>
                      {attention.kycPending.map(u => (
                        <div key={u.id} className="d-attn-row">
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
                            <div>
                              <div style={{ fontSize:12,fontWeight:700,color:P.white,marginBottom:2 }}>{u.name||"Sem nome"}</div>
                              <div style={{ fontSize:10,color:P.muted }}>{u.email}</div>
                            </div>
                            <span style={{ padding:"3px 8px",borderRadius:999,background:"rgba(245,158,11,0.10)",color:P.amber,fontSize:9,fontWeight:800,whiteSpace:"nowrap" }}>
                              {getAccountStatusLabel(u.accountStatus)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {attention.noTwoFA.length > 0 && (
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:9 }}>
                        <ShieldOff size={12} color={P.muted} />
                        <span style={{ fontSize:10,fontWeight:800,color:P.muted,textTransform:"uppercase",letterSpacing:"0.10em" }}>Sem 2FA ({attention.noTwoFA.length})</span>
                      </div>
                      {attention.noTwoFA.map(u => (
                        <div key={u.id} className="d-attn-row">
                          <div style={{ fontSize:12,fontWeight:700,color:P.white,marginBottom:2 }}>{u.name||"Sem nome"}</div>
                          <div style={{ fontSize:10,color:P.muted }}>{u.email}</div>
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
