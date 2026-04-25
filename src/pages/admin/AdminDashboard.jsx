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

/* ── TOKENS ──────────────────────────────────────────────────── */
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

/* ── STYLES ──────────────────────────────────────────────────── */
const STYLES = `
  @keyframes d-up {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes d-spin { to { transform:rotate(360deg); } }
  @keyframes d-pulse {
    0%,100% { opacity:1; }
    50%     { opacity:0.28; }
  }
  @keyframes d-skel {
    0%   { background-position:-400% 0; }
    100% { background-position: 400% 0; }
  }

  .d-up   { animation:d-up 0.35s cubic-bezier(.16,1,.3,1) both; }
  .d-spin { animation:d-spin 0.75s linear infinite; }
  .d-live { animation:d-pulse 2.2s ease-in-out infinite; }

  /* KPI strip card */
  .d-strip-card {
    flex: 0 0 auto;
    width: 176px;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 16px 18px 15px;
    transition: transform 0.20s cubic-bezier(.22,.68,0,1.2), box-shadow 0.20s, border-color 0.20s;
    cursor: default;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
  }
  .d-strip-card:hover {
    transform: translateY(-2px) scale(1.02);
    border-color: var(--sc-border, rgba(255,255,255,0.11));
    box-shadow: 0 12px 36px rgba(0,0,0,0.40), var(--sc-glow, 0 0 0 transparent), 0 1px 0 rgba(255,255,255,0.05) inset;
  }

  /* Chart panel */
  .d-chart-panel {
    background: rgba(11,11,14,0.94);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 24px 24px 20px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.30);
  }

  /* Section panel */
  .d-panel {
    background: rgba(11,11,14,0.94);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px;
    padding: 22px 22px 18px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
  }

  /* Seller row */
  .d-seller-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 13px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(22,22,28,0.65);
    transition: border-color 0.15s, transform 0.15s, background 0.15s;
  }
  .d-seller-row:hover {
    border-color: rgba(255,255,255,0.10);
    transform: translateX(2px);
    background: rgba(45,134,89,0.06);
  }

  /* Attention row */
  .d-attn-row {
    padding: 10px 13px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(22,22,28,0.65);
    transition: border-color 0.15s, background 0.15s;
    margin-bottom: 7px;
  }
  .d-attn-row:last-child { margin-bottom:0; }
  .d-attn-row:hover { border-color:rgba(255,255,255,0.10); background:rgba(255,255,255,0.02); }

  /* Period buttons */
  .d-period-btn {
    border: 1px solid rgba(255,255,255,0.07);
    background: transparent;
    color: #5A6A7E;
    border-radius: 8px;
    padding: 5px 11px;
    font-size: 11px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    letter-spacing: 0.04em;
  }
  .d-period-btn.on {
    border-color: rgba(45,134,89,0.50);
    background: rgba(45,134,89,0.12);
    color: #34A065;
  }

  /* Alert chip */
  .d-alert-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.15s, transform 0.15s;
  }
  .d-alert-chip:hover { transform: translateY(-1px); }

  /* Skeleton */
  .d-skel {
    background: linear-gradient(90deg, #17171B 25%, #1F1F23 50%, #17171B 75%);
    background-size: 400% 100%;
    animation: d-skel 1.8s ease infinite;
    border-radius: 14px;
  }

  /* Hide scrollbar on strip */
  .d-strip-scroll::-webkit-scrollbar { display:none; }
  .d-strip-scroll { scrollbar-width:none; }
`;

/* ── HELPERS ─────────────────────────────────────────────────── */
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
  if (status === "blocked")  return { label: "Bloqueado", color: P.red,   bg: "rgba(239,68,68,0.12)"  };
  if (status === "inactive") return { label: "Inativo",   color: P.amber, bg: "rgba(245,158,11,0.12)" };
  return                            { label: "Ativo",     color: P.green, bg: "rgba(45,134,89,0.12)"  };
}
function getAccountStatusLabel(v) {
  const map = { email_pending:"Email pendente", basic_user:"Básico", kyc_pending:"KYC pendente", kyc_under_review:"KYC análise", kyc_approved:"KYC aprovado", kyc_rejected:"KYC rejeitado", seller_active:"Seller ativo", suspended:"Suspenso" };
  return map[v] || v || "—";
}

/* ── SVG SPARKLINE ───────────────────────────────────────────── */
function Sparkline({ data, color = P.green, width = 180, height = 64 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.volume ?? d.revenue ?? 0);
  const max  = Math.max(...vals) || 1;
  const min  = Math.min(...vals);
  const rng  = max - min || 1;
  const pts  = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * width,
    y: (1 - (v - min) / rng) * (height - 4) + 2,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath}L${width},${height}L0,${height}Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0}    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spk)" />
      <path d={linePath} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── CHART TOOLTIP ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, color = P.green }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1A1A1E", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}>
      <div style={{ fontSize: 10, color: P.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
          R$ {fmtBRL(p.value)}
        </div>
      ))}
    </div>
  );
}

/* ── SKELETON ────────────────────────────────────────────────── */
function Skel({ w = "100%", h = 90, r = 16, style = {} }) {
  return <div className="d-skel" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />;
}
function SkeletonDash({ isMobile }) {
  return (
    <div>
      <Skel h={isMobile ? 220 : 290} r={22} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, overflow: "hidden" }}>
        {[...Array(5)].map((_, i) => <Skel key={i} h={112} w={176} r={16} style={{ flexShrink: 0 }} />)}
      </div>
      <Skel h={isMobile ? 200 : 300} r={20} style={{ marginBottom: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 14 }}>
        <Skel h={260} />
        <Skel h={260} />
      </div>
    </div>
  );
}

/* ── SECTION HEADER ──────────────────────────────────────────── */
function SH({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: P.white, letterSpacing: "-0.01em", marginBottom: 3 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: P.muted }}>{sub}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO SECTION
══════════════════════════════════════════════════════════════ */
function HeroSection({ overview, volSeries, period, setPeriod, loading, onRefresh, refreshedAt, attnTotal, isMobile }) {
  const volume = overview?.volumeTotal ?? 0;
  const delta  = overview?.deltas?.volume;
  const up     = delta > 0;
  const hasD   = delta != null;

  return (
    <div
      className="d-up"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 22,
        marginBottom: 20,
        minHeight: isMobile ? 220 : 290,
        background: "linear-gradient(155deg, #060E0A 0%, #08090D 45%, #060608 100%)",
        border: "1px solid rgba(45,134,89,0.16)",
        boxShadow: "0 0 0 1px rgba(45,134,89,0.05) inset, 0 24px 80px rgba(0,0,0,0.65)",
      }}
    >
      {/* Dot-grid texture */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.15, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      {/* Primary green radial glow */}
      <div style={{ position: "absolute", top: -100, left: -100, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,134,89,0.22) 0%, transparent 65%)", pointerEvents: "none" }} />
      {/* Ambient center glow */}
      <div style={{ position: "absolute", top: "20%", left: "22%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,134,89,0.09) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(36px)" }} />
      {/* Gold accent glow bottom-right */}
      <div style={{ position: "absolute", bottom: -50, right: 0, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,153,31,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Embedded area chart — right half */}
      {!isMobile && volSeries.length > 0 && (
        <div style={{ position: "absolute", right: 0, bottom: 0, top: 0, width: "48%", pointerEvents: "none", opacity: 0.20, filter: "drop-shadow(0 0 20px rgba(45,134,89,0.60))" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volSeries} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={P.green} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={P.green} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="volume" stroke={P.greenBright} strokeWidth={2.5} fill="url(#hGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "22px 20px" : "28px 32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "inherit" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "rgba(45,134,89,0.12)", border: "1px solid rgba(45,134,89,0.26)", color: P.greenBright, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <span className="d-live" style={{ width: 5, height: 5, borderRadius: "50%", background: P.greenBright }} />
              Operacional
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: P.muted, fontSize: 10, fontWeight: 600 }}>
              <Activity size={9} />
              OrionPay Admin
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {[7, 30, 90].map(d => (
              <button key={d} className={`d-period-btn${period === d ? " on" : ""}`} onClick={() => setPeriod(d)}>{d}d</button>
            ))}
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "5px 11px", cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: P.muted, fontFamily: "inherit", opacity: loading ? 0.5 : 1 }}
            >
              <RefreshCw size={11} className={loading ? "d-spin" : ""} />
              {loading ? "..." : "Atualizar"}
            </button>
          </div>
        </div>

        {/* Main metric */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: P.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
            Volume processado · {period} dias
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            <div style={{ fontSize: isMobile ? 46 : 68, fontWeight: 900, color: P.white, letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(45,134,89,0.38)" }}>
              {loading ? "—" : `R$ ${fmtBRL(volume)}`}
            </div>
            {hasD && !loading && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: up ? "rgba(45,134,89,0.16)" : "rgba(239,68,68,0.14)", color: up ? P.greenBright : P.red, border: `1px solid ${up ? "rgba(45,134,89,0.30)" : "rgba(239,68,68,0.28)"}`, marginBottom: 4 }}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="d-live" style={{ width: 4, height: 4, borderRadius: "50%", background: P.greenBright }} />
              <span style={{ fontSize: 11, color: P.greenBright, fontWeight: 600 }}>Todos os sistemas ativos</span>
            </div>
            {refreshedAt && <span style={{ fontSize: 10, color: P.dim }}>· {fmtFull(refreshedAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALERT BANNER
══════════════════════════════════════════════════════════════ */
function AlertBanner({ opCounts, attention, opLoading, nav }) {
  if (opLoading) return null;

  const alerts = [];
  if (opCounts.security > 0)        alerts.push({ level: "red",   icon: <ShieldAlert size={12} />,        label: `${opCounts.security} alerta${opCounts.security > 1 ? "s" : ""} SOC`,                                                           href: "/admin/security"    });
  if (attention.blocked.length > 0) alerts.push({ level: "red",   icon: <Ban size={12} />,                label: `${attention.blocked.length} bloqueada${attention.blocked.length > 1 ? "s" : ""}`,                                               href: "/admin/sellers"     });
  if (opCounts.kyc > 0)             alerts.push({ level: "amber", icon: <Clock size={12} />,              label: `${opCounts.kyc} KYC pendente${opCounts.kyc > 1 ? "s" : ""}`,                                                                    href: "/admin/kyc"         });
  if (opCounts.withdrawals > 0)     alerts.push({ level: "amber", icon: <ArrowDownToLine size={12} />,    label: `${opCounts.withdrawals} saque${opCounts.withdrawals > 1 ? "s" : ""} pendente${opCounts.withdrawals > 1 ? "s" : ""}`,             href: "/admin/withdrawals" });
  if (opCounts.approvals > 0)       alerts.push({ level: "blue",  icon: <GitPullRequestArrow size={12} />,label: `${opCounts.approvals} aprovação${opCounts.approvals > 1 ? "ões" : ""}`,                                                         href: "/admin/approvals"   });
  if (attention.noTwoFA.length > 0) alerts.push({ level: "muted", icon: <ShieldOff size={12} />,          label: `${attention.noTwoFA.length} sem 2FA`,                                                                                            href: "/admin/sellers"     });

  if (alerts.length === 0) return null;

  const hasRed  = alerts.some(a => a.level === "red");
  const accent  = hasRed ? P.red : P.amber;
  const chipC   = { red: P.red, amber: P.amber, blue: P.blue, muted: P.muted };

  return (
    <div className="d-up" style={{ marginBottom: 16, borderRadius: 14, padding: "12px 16px 12px 20px", background: hasRed ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)", border: `1px solid ${hasRed ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.18)"}`, borderLeft: `3px solid ${accent}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <AlertTriangle size={12} color={accent} />
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: accent }}>
          {hasRed ? "Atenção necessária" : "Pendências"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        {alerts.map((a, i) => {
          const c = chipC[a.level];
          return (
            <button key={i} className="d-alert-chip" onClick={() => nav(a.href)} style={{ background: `${c}16`, borderColor: `${c}2A`, color: c }}>
              {a.icon}
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI STRIP
══════════════════════════════════════════════════════════════ */
function KpiStrip({ overview, period }) {
  if (!overview) return null;

  const taxaMedia = overview.revenueTotal && overview.volumeTotal
    ? `${((overview.revenueTotal / overview.volumeTotal) * 100).toFixed(2)}%`
    : "—";

  const items = [
    { icon: <Percent size={13} />,        label: "Receita",        value: `R$ ${fmtBRL(overview.revenueTotal)}`,      delta: overview.deltas?.revenue,      accent: P.gold   },
    { icon: <ArrowRightLeft size={13} />, label: "Transações",     value: String(overview.transactionsTotal ?? 0),    delta: overview.deltas?.transactions, accent: P.blue   },
    { icon: <Users size={13} />,          label: "Sellers ativos", value: String(overview.activeSellers ?? 0),        delta: null, sub: `de ${overview.totalSellers ?? 0} total`, accent: P.purple },
    { icon: <Receipt size={13} />,        label: "Ticket médio",   value: `R$ ${fmtBRL(overview.ticketAverage)}`,     delta: null,                          accent: P.green  },
    { icon: <Wallet size={13} />,         label: "Taxa média",     value: taxaMedia,                                   delta: null,                          accent: P.goldBright },
  ];

  return (
    <div className="d-strip-scroll d-up" style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 20, paddingBottom: 2, animationDelay: "50ms" }}>
      {items.map((item, i) => {
        const up  = item.delta > 0;
        const hasD = typeof item.delta === "number";
        return (
          <div
            key={item.label}
            className="d-strip-card d-up"
            style={{
              animationDelay: `${60 + i * 45}ms`,
              background: `linear-gradient(148deg, ${item.accent}0D 0%, rgba(12,12,16,0.88) 55%)`,
              "--sc-border": `${item.accent}3A`,
              "--sc-glow":   `0 0 26px ${item.accent}20`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.accent}18`, border: `1px solid ${item.accent}28`, display: "flex", alignItems: "center", justifyContent: "center", color: item.accent, boxShadow: `0 0 14px ${item.accent}40` }}>
                {item.icon}
              </div>
              {hasD && (
                <span style={{ fontSize: 10, fontWeight: 800, color: up ? P.greenBright : P.red, letterSpacing: "0.02em" }}>
                  {up ? "▲" : "▼"} {Math.abs(item.delta)}%
                </span>
              )}
            </div>
            <div style={{ fontSize: 21, fontWeight: 900, color: P.white, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
              {item.value}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: P.dim }}>
              {item.label}
            </div>
            {item.sub && <div style={{ fontSize: 10, color: P.muted, marginTop: 2 }}>{item.sub}</div>}
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

  const attnTotal  = attention.blocked.length + attention.kycPending.length + attention.noTwoFA.length;
  const mainChartH = isMobile ? 200 : 300;
  const secChartH  = isMobile ? 180 : 234;
  const volLabels  = volSeries.map(d => fmtDate(d.date));
  const revLabels  = revSeries.map(d => fmtDate(d.date));

  function xTick(val, series) {
    const idx  = series.indexOf(val);
    const step = series.length > 60 ? 14 : series.length > 30 ? 7 : series.length > 14 ? 3 : 1;
    return idx % step === 0 ? val : "";
  }

  return (
    <div>
      <style>{STYLES}</style>

      {/* ══ 1. HERO ══════════════════════════════════════════════ */}
      <HeroSection
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

      {/* ══ ERROR ════════════════════════════════════════════════ */}
      {error && (
        <div style={{ marginBottom: 14, borderRadius: 14, padding: "12px 16px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", fontSize: 13, color: P.red, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonDash isMobile={isMobile} />
      ) : (
        <>
          {/* ══ 2. ALERT BANNER ══════════════════════════════════ */}
          <AlertBanner
            opCounts={opCounts}
            attention={attention}
            opLoading={opLoading}
            nav={navigate}
          />

          {/* ══ 3. KPI STRIP ═════════════════════════════════════ */}
          <KpiStrip overview={overview} period={period} />

          {/* ══ 4. MAIN CHART — Volume (full width) ══════════════ */}
          <div className="d-chart-panel d-up" style={{ marginBottom: 14, animationDelay: "100ms" }}>
            <SH title="Volume por dia" sub={`Transações aprovadas — últimos ${period} dias`} />
            {volSeries.length === 0 ? (
              <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12, color: P.dim }}>Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={mainChartH}>
                <AreaChart data={volSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={P.green} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={P.green} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), volLabels)} tick={{ fill: P.dim, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={62} />
                  <Tooltip content={<ChartTooltip color={P.greenBright} />} />
                  <Area type="monotone" dataKey="volume" stroke={P.greenBright} strokeWidth={2.5} fill="url(#gVol)" dot={false} activeDot={{ r: 5, fill: P.greenBright, stroke: "#0A0A0E", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ══ 5. SECONDARY ROW — Revenue + Top Sellers ═════════ */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Revenue */}
            <div className="d-chart-panel d-up" style={{ animationDelay: "140ms" }}>
              <SH title="Receita diária" sub={`Taxas coletadas — últimos ${period} dias`} />
              {revSeries.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12, color: P.dim }}>Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={secChartH}>
                  <BarChart data={revSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={period > 30 ? 3 : 6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), revLabels)} tick={{ fill: P.dim, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={62} />
                    <Tooltip content={<ChartTooltip color={P.goldBright} />} />
                    <Bar dataKey="revenue" fill={P.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Sellers */}
            <div className="d-panel d-up" style={{ animationDelay: "160ms" }}>
              <SH title="Top sellers" sub={`Ranking — últimos ${period} dias`} />
              {topSellers.length === 0 ? (
                <div style={{ padding: "28px 0", textAlign: "center", fontSize: 12, color: P.dim }}>Nenhuma transação no período</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {topSellers.map((s, idx) => {
                    const badge = getStatusBadge(s.status);
                    const top3  = idx < 3;
                    return (
                      <div key={String(s.userId)} className="d-seller-row">
                        <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: top3 ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${top3 ? "rgba(45,134,89,0.24)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: top3 ? P.green : P.dim }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: P.white, marginBottom: 1 }}>{s.name || "Sem nome"}</div>
                          <div style={{ fontSize: 10, color: P.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: P.white, fontVariantNumeric: "tabular-nums", marginBottom: 1 }}>R$ {fmtBRL(s.volume)}</div>
                          <div style={{ fontSize: 10, color: P.dim }}>{s.transactions} txn · R$ {fmtBRL(s.revenue)} fee</div>
                        </div>
                        <span style={{ padding: "3px 8px", borderRadius: 999, background: badge.bg, color: badge.color, fontSize: 9, fontWeight: 800, flexShrink: 0, whiteSpace: "nowrap" }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ 6. ATTENTION PANEL — only when needed ════════════ */}
          {attnTotal > 0 && (
            <div className="d-panel d-up" style={{ animationDelay: "180ms" }}>
              <SH title="Contas — atenção" sub="Ações operacionais recomendadas" />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
                {attention.blocked.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                      <Ban size={11} color={P.red} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: P.red, textTransform: "uppercase", letterSpacing: "0.10em" }}>Bloqueadas ({attention.blocked.length})</span>
                    </div>
                    {attention.blocked.map(u => (
                      <div key={u.id} className="d-attn-row">
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.white, marginBottom: 2 }}>{u.name || "Sem nome"}</div>
                        <div style={{ fontSize: 10, color: P.muted }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
                {attention.kycPending.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                      <Clock size={11} color={P.amber} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: P.amber, textTransform: "uppercase", letterSpacing: "0.10em" }}>KYC Pendente ({attention.kycPending.length})</span>
                    </div>
                    {attention.kycPending.map(u => (
                      <div key={u.id} className="d-attn-row">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: P.white, marginBottom: 2 }}>{u.name || "Sem nome"}</div>
                            <div style={{ fontSize: 10, color: P.muted }}>{u.email}</div>
                          </div>
                          <span style={{ padding: "3px 8px", borderRadius: 999, background: "rgba(245,158,11,0.10)", color: P.amber, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>
                            {getAccountStatusLabel(u.accountStatus)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {attention.noTwoFA.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                      <ShieldOff size={11} color={P.muted} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: "uppercase", letterSpacing: "0.10em" }}>Sem 2FA ({attention.noTwoFA.length})</span>
                    </div>
                    {attention.noTwoFA.map(u => (
                      <div key={u.id} className="d-attn-row">
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.white, marginBottom: 2 }}>{u.name || "Sem nome"}</div>
                        <div style={{ fontSize: 10, color: P.muted }}>{u.email}</div>
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
