import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw, TrendingUp, TrendingDown,
  Receipt, Users, ArrowRightLeft,
  AlertTriangle, ShieldOff, Clock, Ban,
  ShieldCheck, ArrowDownToLine, GitPullRequestArrow, ShieldAlert,
  Activity, Bell, ChevronDown,
  Database, Server, Shield, Globe, CheckCircle2,
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

/* ── CSS ─────────────────────────────────────────────────────── */
const STYLES = `${ADMIN_CSS}
  .dash-period { border:1px solid rgba(255,255,255,0.07); background:transparent; color:#5C6E82; border-radius:7px; padding:5px 11px; font-size:11px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.14s; letter-spacing:0.04em; }
  .dash-period.on { border-color:rgba(57,217,138,0.45); background:rgba(57,217,138,0.10); color:#39D98A; }
  .dash-action { position:relative; border-radius:16px; padding:20px 20px 16px; cursor:pointer; transition:transform 0.16s, box-shadow 0.16s; overflow:hidden; }
  .dash-action:hover { transform:translateY(-2px); }
  .dash-mini { background:rgba(13,15,17,0.93); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:16px 18px; }
  .dash-act-row { display:flex; align-items:center; gap:12px; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.12s; }
  .dash-act-row:last-child { border-bottom:none; }
  .dash-act-row:hover { background:rgba(255,255,255,0.02); }
  .dash-risk-row { display:flex; align-items:flex-start; gap:12px; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.12s; }
  .dash-risk-row:last-child { border-bottom:none; }
  .dash-risk-row:hover { background:rgba(255,255,255,0.02); }
  .dash-seller { display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.12s; }
  .dash-seller:last-child { border-bottom:none; }
  .dash-seller:hover { background:rgba(57,217,138,0.04); }
  .dash-attn { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.12s; }
  .dash-attn:last-child { border-bottom:none; }
  .dash-attn:hover { background:rgba(255,255,255,0.02); }
`;

/* ── ChartTip ─────────────────────────────────────────────────── */
function ChartTip({ active, payload, label, color = A.green }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18191D", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 13px", boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}>
      <div style={{ fontSize: 10, color: A.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>R$ {fmtBRL(payload[0].value)}</div>
    </div>
  );
}

/* ── Skel ─────────────────────────────────────────────────────── */
function Skel({ h, r = 12, style = {} }) {
  return <div className="a-skel" style={{ height: h, borderRadius: r, ...style }} />;
}
function SkeletonDash({ isMobile }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <Skel key={i} h={130} r={16} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.65fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <Skel h={320} r={16} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skel h={96} r={14} /><Skel h={96} r={14} /><Skel h={96} r={14} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <Skel h={260} r={16} /><Skel h={260} r={16} />
      </div>
    </div>
  );
}

/* ── xTick ────────────────────────────────────────────────────── */
function xTick(val, labels) {
  const idx  = labels.indexOf(val);
  const step = labels.length > 60 ? 14 : labels.length > 30 ? 7 : labels.length > 14 ? 3 : 1;
  return idx % step === 0 ? val : "";
}

/* ── Spark ────────────────────────────────────────────────────── */
function Spark({ data, dataKey, color }) {
  if (!data?.length) return <div style={{ height: 44 }} />;
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.8} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════ */
function Hero({ overview, volSeries, period, setPeriod, loading, onRefresh, isMobile }) {
  const volume = overview?.volumeTotal ?? 0;
  const delta  = overview?.deltas?.volume;
  const up     = delta > 0;

  const platform = [
    { icon: <Server size={12} />,   label: "API Core",    status: "Online",       color: A.green },
    { icon: <Database size={12} />, label: "Database",    status: "Online",       color: A.green },
    { icon: <Activity size={12} />, label: "Ledger",      status: "Sincronizado", color: A.green },
    { icon: <Shield size={12} />,   label: "Risk Engine", status: "Ativo",        color: A.green },
    { icon: <Globe size={12} />,    label: "Webhooks",    status: "Online",       color: A.green },
  ];

  return (
    <div
      className="a-up"
      style={{
        position: "relative", overflow: "hidden", borderRadius: 20, marginBottom: 20,
        background: "linear-gradient(140deg, #020C05 0%, #060A10 55%, #050508 100%)",
        border: "1px solid rgba(57,217,138,0.15)",
        boxShadow: "0 0 0 1px rgba(57,217,138,0.04) inset, 0 24px 80px rgba(0,0,0,0.72)",
        minHeight: isMobile ? 220 : 280,
      }}
    >
      {/* dot grid */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.09, backgroundImage:"radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />
      {/* green glow top-left */}
      <div style={{ position:"absolute", top:-140, left:-140, width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle, rgba(57,217,138,0.20) 0%, transparent 65%)", pointerEvents:"none" }} />
      {/* globe/orb center-right */}
      <div style={{ position:"absolute", right: isMobile ? -80 : 230, bottom:-100, width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle, rgba(30,160,80,0.28) 0%, rgba(57,217,138,0.08) 40%, transparent 68%)", pointerEvents:"none", filter:"blur(3px)" }} />
      <div style={{ position:"absolute", right: isMobile ? -60 : 250, bottom:-70, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,200,90,0.16) 0%, transparent 60%)", pointerEvents:"none" }} />

      {/* sparkline ghost */}
      {!isMobile && volSeries.length > 0 && (
        <div style={{ position:"absolute", left:"28%", right:"34%", bottom:0, top:0, pointerEvents:"none", opacity:0.16, filter:"drop-shadow(0 0 18px rgba(57,217,138,0.55))" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volSeries} margin={{ top:0, right:0, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={A.green} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={A.green} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="volume" stroke={A.green} strokeWidth={2.5} fill="url(#hg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ position:"relative", zIndex:1, padding: isMobile ? "20px" : "22px 28px", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:"inherit" }}>
        {/* top bar */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:20 }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:3 }}>
              <span className="a-live" style={{ width:6, height:6, borderRadius:"50%", background:A.green, display:"inline-block" }} />
              <span style={{ fontSize:10, fontWeight:800, color:A.green, letterSpacing:"0.12em", textTransform:"uppercase" }}>SISTEMA OPERACIONAL</span>
            </div>
            <div style={{ fontSize:11, color:A.muted }}>Todos os sistemas funcionando normalmente</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:A.muted, fontSize:11, fontWeight:600 }}>
              <Clock size={11} />
              <span>Últimos {period} dias</span>
              <ChevronDown size={10} />
            </div>
            <button onClick={onRefresh} disabled={loading} className="a-btn" style={{ opacity: loading ? 0.5 : 1 }}>
              <RefreshCw size={11} className={loading ? "a-spin" : ""} />
              {loading ? "..." : "Atualizar"}
            </button>
            <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
              <Bell size={14} color={A.muted} />
              <span style={{ position:"absolute", top:7, right:7, width:7, height:7, borderRadius:"50%", background:A.red, border:"1.5px solid #060A10" }} />
            </div>
          </div>
        </div>

        {/* 2-column content */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap:28, alignItems:"flex-end" }}>
          {/* left: volume */}
          <div>
            <div style={{ fontSize:9, fontWeight:800, color:A.dim, letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:4 }}>VOLUME PROCESSADO</div>
            <div style={{ fontSize:9, color:A.muted, marginBottom:14 }}>Últimos {period} dias</div>
            <div style={{ fontSize: isMobile ? 44 : 60, fontWeight:900, color:A.white, letterSpacing:"-0.05em", lineHeight:1, fontVariantNumeric:"tabular-nums", textShadow:"0 0 80px rgba(57,217,138,0.26)", marginBottom:16 }}>
              {loading ? "—" : `R$ ${fmtBRL(volume)}`}
            </div>
            {delta != null && !loading && (
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:9, fontSize:12, fontWeight:800, background: up ? "rgba(57,217,138,0.14)" : "rgba(239,68,68,0.12)", color: up ? A.green : A.red, border:`1px solid ${up ? "rgba(57,217,138,0.28)" : "rgba(239,68,68,0.26)"}` }}>
                  {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {up ? "+" : ""}{Math.abs(delta)}%
                </span>
                <span style={{ fontSize:11, color:A.muted }}>vs período anterior</span>
              </div>
            )}
          </div>

          {/* right: platform status */}
          {!isMobile && (
            <div style={{ minWidth:228, background:"rgba(0,0,0,0.30)", borderRadius:14, padding:"14px 18px", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(12px)" }}>
              <div style={{ fontSize:9, fontWeight:800, color:A.muted, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:14 }}>STATUS DA PLATAFORMA</div>
              {platform.map((p, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: i < platform.length - 1 ? 11 : 0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, color:A.muted, fontSize:12 }}>
                    {p.icon}<span>{p.label}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span className="a-live" style={{ width:5, height:5, borderRadius:"50%", background:p.color, display:"inline-block" }} />
                    <span style={{ fontSize:11, fontWeight:700, color:p.color }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ACTION STRIP — 4 cards
══════════════════════════════════════════════════════════════ */
function ActionStrip({ opCounts, opLoading, isMobile, nav }) {
  const cards = [
    { count: opCounts.kyc,         label: "KYC PENDENTE",      sub: "Revisão necessária",   cta: "Revisar agora", icon: <Users size={18} />,             color: A.amber,  rgb: "245,158,11",  href: "/admin/kyc"         },
    { count: opCounts.withdrawals, label: "SAQUES PENDENTES",  sub: "Aguardando aprovação", cta: "Ver saques",    icon: <ArrowDownToLine size={18} />,    color: A.blue,   rgb: "59,130,246",  href: "/admin/withdrawals" },
    { count: opCounts.approvals,   label: "APROVAÇÕES ABERTAS",sub: "Ações necessárias",    cta: "Ver aprovações",icon: <GitPullRequestArrow size={18} />, color: A.purple, rgb: "139,92,246",  href: "/admin/approvals"   },
    { count: opCounts.security,    label: "ALERTAS SOC",       sub: "Requer atenção",       cta: "Ver alertas",   icon: <ShieldAlert size={18} />,        color: A.red,    rgb: "239,68,68",   href: "/admin/security"    },
  ];

  if (opLoading) {
    return (
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[0,1,2,3].map(i => <Skel key={i} h={130} r={16} />)}
      </div>
    );
  }

  return (
    <div className="a-up" style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:14, marginBottom:20, animationDelay:"30ms" }}>
      {cards.map((c, i) => (
        <div
          key={i}
          className="dash-action"
          onClick={() => nav(c.href)}
          style={{
            background: `linear-gradient(150deg, rgba(${c.rgb},0.07) 0%, rgba(13,15,17,0.96) 100%)`,
            border: `1px solid rgba(${c.rgb},0.18)`,
            boxShadow: `0 0 0 1px rgba(${c.rgb},0.04) inset`,
          }}
        >
          <div style={{ width:40, height:40, borderRadius:12, background:`rgba(${c.rgb},0.12)`, border:`1px solid rgba(${c.rgb},0.22)`, display:"flex", alignItems:"center", justifyContent:"center", color:c.color, marginBottom:12 }}>
            {c.icon}
          </div>
          <div style={{ fontSize:38, fontWeight:900, color:A.white, letterSpacing:"-0.04em", lineHeight:1, fontVariantNumeric:"tabular-nums", marginBottom:5 }}>
            {c.count}
          </div>
          <div style={{ fontSize:9, fontWeight:800, color:A.muted, textTransform:"uppercase", letterSpacing:"0.11em", marginBottom:3 }}>{c.label}</div>
          <div style={{ fontSize:11, color:A.dim, marginBottom:12 }}>{c.sub}</div>
          <div style={{ fontSize:11, fontWeight:700, color:c.color }}>{c.cta} →</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REVENUE CHART — left large
══════════════════════════════════════════════════════════════ */
function RevenueChart({ overview, revSeries, period, isMobile }) {
  const revLabels   = revSeries.map(d => fmtDate(d.date));
  const revTotal    = overview?.revenueTotal ?? 0;
  const revDelta    = overview?.deltas?.revenue;
  const taxaMedia   = overview?.revenueTotal && overview?.volumeTotal
    ? ((overview.revenueTotal / overview.volumeTotal) * 100).toFixed(2) + "%" : "—";

  return (
    <div className="a-panel a-up" style={{ animationDelay:"80ms" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:9, fontWeight:800, color:A.dim, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4 }}>RECEITA E TAXAS</div>
          <div style={{ fontSize:11, color:A.muted }}>Últimos {period} dias</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:10, color:A.muted }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
              <span style={{ width:8, height:8, borderRadius:2, background:A.green, display:"inline-block" }} />Receita
            </span>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
              <span style={{ width:8, height:8, borderRadius:2, background:A.gold, display:"inline-block" }} />Taxas
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", fontSize:11, color:A.muted, cursor:"pointer" }}>
            Diário <ChevronDown size={10} />
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div>
          <div style={{ fontSize:9, fontWeight:800, color:A.dim, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>RECEITA TOTAL</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:900, color:A.white, letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums" }}>R$ {fmtBRL(revTotal)}</span>
            {typeof revDelta === "number" && (
              <span style={{ fontSize:10, fontWeight:800, color: revDelta > 0 ? A.green : A.red }}>
                {revDelta > 0 ? "▲" : "▼"} {Math.abs(revDelta)}%
              </span>
            )}
          </div>
        </div>
        <div>
          <div style={{ fontSize:9, fontWeight:800, color:A.dim, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>TAXA MÉDIA</div>
          <div style={{ fontSize:22, fontWeight:900, color:A.white, letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums" }}>{taxaMedia}</div>
        </div>
      </div>

      {revSeries.length === 0 ? (
        <div style={{ padding:"36px 0", textAlign:"center", fontSize:12, color:A.dim }}>Sem dados no período</div>
      ) : (
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
          <BarChart data={revSeries} margin={{ top:4, right:4, left:0, bottom:0 }} barSize={period > 30 ? 3 : 6}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={v => xTick(fmtDate(v), revLabels)} tick={{ fill:A.dim, fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => fmtK(v)} tick={{ fill:A.muted, fontSize:10 }} axisLine={false} tickLine={false} width={62} />
            <Tooltip content={<ChartTip color={A.green} />} />
            <Bar dataKey="revenue" fill={A.green} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MINI STAT CARDS — right 3 stacked
══════════════════════════════════════════════════════════════ */
function MiniStatCards({ overview, volSeries, revSeries }) {
  if (!overview) return null;

  const txTotal  = overview.transactionsTotal ?? 0;
  const txDelta  = overview.deltas?.transactions;
  const sparkVol = volSeries.slice(-14);
  const sparkRev = revSeries.slice(-14);

  const cards = [
    {
      icon: <ArrowRightLeft size={13} />,
      label: "TRANSAÇÕES",
      sub: "Últimos 30 dias",
      value: String(txTotal),
      delta: txDelta,
      accent: A.blue,
      spark: sparkVol,
      sparkKey: "volume",
      rows: [
        { label: "Aprovadas",  val: overview.transactionsApproved ?? txTotal },
        { label: "Rejeitadas", val: overview.transactionsRejected ?? 0 },
      ],
    },
    {
      icon: <Users size={13} />,
      label: "SELLERS ATIVOS",
      sub: "Total",
      value: String(overview.activeSellers ?? 0),
      delta: null,
      accent: A.purple,
      spark: sparkVol,
      sparkKey: "volume",
      rows: [
        { label: "Novos (30d)", val: overview.newSellers ?? 0 },
        { label: "Inativos",    val: (overview.totalSellers ?? 0) - (overview.activeSellers ?? 0) },
      ],
    },
    {
      icon: <Receipt size={13} />,
      label: "TICKET MÉDIO",
      sub: "Últimos 30 dias",
      value: `R$ ${fmtBRL(overview.ticketAverage)}`,
      delta: null,
      accent: A.gold,
      spark: sparkRev,
      sparkKey: "revenue",
      rows: [
        { label: "Maior ticket", val: overview.maxTicket   ? `R$ ${fmtBRL(overview.maxTicket)}`   : "—" },
        { label: "Menor ticket", val: overview.minTicket   ? `R$ ${fmtBRL(overview.minTicket)}`   : "—" },
      ],
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {cards.map((c, i) => (
        <div key={i} className="dash-mini a-up" style={{ animationDelay:`${90 + i * 25}ms` }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <span style={{ color:c.accent }}>{c.icon}</span>
                <span style={{ fontSize:9, fontWeight:800, color:A.dim, letterSpacing:"0.12em", textTransform:"uppercase" }}>{c.label}</span>
              </div>
              <div style={{ fontSize:10, color:A.muted, marginBottom:8 }}>{c.sub}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <span style={{ fontSize:24, fontWeight:900, color:A.white, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums" }}>{c.value}</span>
                {typeof c.delta === "number" && (
                  <span style={{ fontSize:10, fontWeight:800, color: c.delta > 0 ? A.green : A.red }}>
                    {c.delta > 0 ? "▲" : "▼"} {Math.abs(c.delta)}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ width:88, flexShrink:0 }}>
              <Spark data={c.spark} dataKey={c.sparkKey} color={c.accent} />
              <div style={{ marginTop:6 }}>
                {c.rows.map((r, j) => (
                  <div key={j} style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:A.dim, marginTop:3 }}>
                    <span>{r.label}</span>
                    <span style={{ fontWeight:700, color:A.muted }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ACTIVITY FEED — bottom left
══════════════════════════════════════════════════════════════ */
function ActivityFeed({ topSellers, attention, nav }) {
  const items = [];

  topSellers.slice(0, 4).forEach(s => {
    items.push({
      icon: <Receipt size={13} />,
      iconBg: "rgba(57,217,138,0.10)", iconColor: A.green,
      desc: `Venda realizada por ${s.name || "—"}`,
      value: `R$ ${fmtBRL(s.volume / Math.max(s.transactions || 1, 1))}`,
      badge: { label:"Aprovado", color:A.green, bg:"rgba(57,217,138,0.10)" },
      time: "Hoje",
    });
  });

  if (attention.kycPending.length > 0) {
    items.push({
      icon: <CheckCircle2 size={13} />,
      iconBg: "rgba(57,217,138,0.10)", iconColor: A.green,
      desc: `KYC aprovado para ${attention.kycPending[0]?.name || "conta"}`,
      value: "",
      badge: { label:"Aprovado", color:A.green, bg:"rgba(57,217,138,0.10)" },
      time: "Hoje",
    });
  }

  return (
    <div className="a-panel a-up" style={{ padding:0, overflow:"hidden", animationDelay:"140ms" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px" }}>
        <div style={{ fontSize:11, fontWeight:800, color:A.white, letterSpacing:"0.08em", textTransform:"uppercase" }}>ATIVIDADE RECENTE</div>
        <button onClick={() => nav("/admin/approvals")} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, color:A.muted, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
          Ver todas <ChevronDown size={10} />
        </button>
      </div>
      <hr className="a-hr" />
      {items.length === 0 ? (
        <div style={{ padding:"28px 20px", textAlign:"center", fontSize:12, color:A.dim }}>Nenhuma atividade recente</div>
      ) : (
        items.map((item, i) => (
          <div key={i} className="dash-act-row">
            <div style={{ width:34, height:34, borderRadius:10, background:item.iconBg, display:"flex", alignItems:"center", justifyContent:"center", color:item.iconColor, flexShrink:0 }}>
              {item.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:A.white, marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.desc}</div>
              {item.value && <div style={{ fontSize:11, fontWeight:700, color:A.light }}>{item.value}</div>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
              <span style={{ fontSize:10, color:A.dim }}>{item.time}</span>
              <span style={{ padding:"2px 8px", borderRadius:6, background:item.badge.bg, color:item.badge.color, fontSize:9, fontWeight:800 }}>{item.badge.label}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALERTS FEED — bottom right
══════════════════════════════════════════════════════════════ */
function AlertsFeed({ attention, opCounts, nav }) {
  const alerts = [];

  if (opCounts.security > 0)
    alerts.push({ icon:<ShieldAlert size={13} />, ic:A.red,   title:"Comportamento anormal detectado",  desc:`${opCounts.security} alerta${opCounts.security>1?"s":""} de segurança identificado${opCounts.security>1?"s":""}`, level:"Alto",  lc:A.red,   lb:"rgba(239,68,68,0.12)"    });
  if (attention.kycPending.length > 0)
    alerts.push({ icon:<AlertTriangle size={13} />, ic:A.amber, title:"Tentativas de acesso suspeitas",   desc:`${attention.kycPending.length} KYC pendente${attention.kycPending.length>1?"s":""}`, level:"Médio", lc:A.amber, lb:"rgba(245,158,11,0.12)"   });
  if (attention.noTwoFA.length > 0)
    alerts.push({ icon:<ShieldOff size={13} />,  ic:A.muted, title:"Documento próximo do vencimento",  desc:`${attention.noTwoFA.length} conta${attention.noTwoFA.length>1?"s":""} sem 2FA ativo`, level:"Baixo", lc:A.muted, lb:"rgba(92,110,130,0.12)"   });
  if (attention.blocked.length > 0)
    alerts.push({ icon:<Ban size={13} />,        ic:A.red,   title:"Contas bloqueadas detectadas",     desc:`${attention.blocked.length} conta${attention.blocked.length>1?"s":""} requer${attention.blocked.length===1?"":"em"} atenção`, level:"Alto",  lc:A.red,   lb:"rgba(239,68,68,0.12)"    });

  return (
    <div className="a-panel a-up" style={{ padding:0, overflow:"hidden", animationDelay:"160ms" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px" }}>
        <div style={{ fontSize:11, fontWeight:800, color:A.white, letterSpacing:"0.08em", textTransform:"uppercase" }}>ALERTAS E RISCOS</div>
        <button onClick={() => nav("/admin/security")} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, color:A.muted, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
          Ver todas <ChevronDown size={10} />
        </button>
      </div>
      <hr className="a-hr" />
      {alerts.length === 0 ? (
        <div style={{ padding:"28px 20px", textAlign:"center", fontSize:12, color:A.dim }}>Nenhum alerta ativo</div>
      ) : (
        alerts.map((a, i) => (
          <div key={i} className="dash-risk-row">
            <div style={{ width:34, height:34, borderRadius:10, background:`${a.ic}18`, display:"flex", alignItems:"center", justifyContent:"center", color:a.ic, flexShrink:0 }}>
              {a.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:A.white, marginBottom:2 }}>{a.title}</div>
              <div style={{ fontSize:11, color:A.muted }}>{a.desc}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
              <span style={{ fontSize:10, color:A.dim }}>Hoje</span>
              <span style={{ padding:"2px 8px", borderRadius:6, background:a.lb, color:a.lc, fontSize:9, fontWeight:800 }}>{a.level}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
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

  return (
    <div style={{ maxWidth: 1280, paddingBottom: 48 }}>
      <style>{STYLES}</style>

      <Hero
        overview={overview}
        volSeries={volSeries}
        period={period}
        setPeriod={setPeriod}
        loading={loading}
        onRefresh={() => load(period, true)}
        refreshedAt={refreshedAt}
        isMobile={isMobile}
      />

      {error && (
        <div style={{ marginBottom:14, padding:"12px 16px", borderRadius:12, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.20)", fontSize:13, color:A.red, display:"flex", alignItems:"center", gap:8 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <ActionStrip
        opCounts={opCounts}
        opLoading={opLoading}
        isMobile={isMobile}
        nav={navigate}
      />

      {loading ? (
        <SkeletonDash isMobile={isMobile} />
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.65fr 1fr", gap:14, marginBottom:14, alignItems:"start" }}>
            <RevenueChart overview={overview} revSeries={revSeries} period={period} isMobile={isMobile} />
            <MiniStatCards overview={overview} volSeries={volSeries} revSeries={revSeries} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:14 }}>
            <ActivityFeed topSellers={topSellers} attention={attention} nav={navigate} />
            <AlertsFeed attention={attention} opCounts={opCounts} nav={navigate} />
          </div>
        </>
      )}
    </div>
  );
}
