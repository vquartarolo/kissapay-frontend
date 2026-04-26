import {
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Wifi,
  Play,
  User,
  Lock,
  Activity,
  ZapOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getSecurityStats,
  getSecurityEvents,
  getSecuritySuspiciousUsers,
  resolveSecurityEvent,
} from "../../services/admin.service";
import { A, ADMIN_CSS, ARail, ARailCell, APanel, ABtn } from "../../components/admin/AdminDS";

const STYLES = `${ADMIN_CSS}
  .sec-sev-critical { border-left-color: #DC2626 !important; }
  .sec-sev-high     { border-left-color: #EF4444 !important; }
  .sec-sev-medium   { border-left-color: #F59E0B !important; }
  .sec-sev-low      { border-left-color: #3B82F6 !important; }

  .sec-event-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 11px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    border-left: 3px solid transparent;
    transition: background 0.12s, border-left-color 0.12s;
    cursor: default;
  }
  .sec-event-row:last-child { border-bottom: none; }
  .sec-event-row:hover { background: rgba(255,255,255,0.022); }

  .sec-module-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .sec-module-row:last-child { border-bottom: none; }
`;

const SEV_CONFIG = {
  low:      { label: "BAIXO",   color: A.blue,    ring: "rgba(59,130,246,0.22)"   },
  medium:   { label: "MÉDIO",   color: A.amber,   ring: "rgba(245,158,11,0.22)"   },
  high:     { label: "ALTO",    color: A.red,     ring: "rgba(239,68,68,0.22)"    },
  critical: { label: "CRÍTICO", color: A.redDark, ring: "rgba(220,38,38,0.28)"    },
};

const TYPE_LABELS = {
  login_success:           "Login bem-sucedido",
  login_failed:            "Falha de login",
  multiple_login_attempts: "Múltiplas tentativas",
  suspicious_ip:           "IP suspeito",
  rate_limit_triggered:    "Rate limit ativo",
  admin_action:            "Ação administrativa",
  permission_denied:       "Permissão negada",
  session_revoked:         "Sessão revogada",
  account_frozen:          "Conta congelada",
  account_unfrozen:        "Conta descongelada",
  suspicious_cashout:      "Saque suspeito",
  unusual_volume:          "Volume atípico",
};

const SEV_ORDER = ["critical", "high", "medium", "low"];

const SECURITY_MODULES = [
  { icon: Lock,     label: "Autenticação 2FA",      status: "ok"   },
  { icon: Wifi,     label: "Monitoramento de IP",   status: "ok"   },
  { icon: Activity, label: "Rate Limiting",          status: "ok"   },
  { icon: ZapOff,   label: "Detecção de anomalias", status: "warn" },
  { icon: Shield,   label: "Firewall de aplicação", status: "ok"   },
];

function SevDot({ sev }) {
  const cfg = SEV_CONFIG[sev] || SEV_CONFIG.low;
  return (
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 0 2px ${cfg.ring}`, flexShrink: 0, marginTop: 3 }} />
  );
}

function EventFeed({ events, resolving, onResolve, loading }) {
  if (loading) {
    return (
      <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
        <div className="a-spin" style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.08)`, borderTopColor: A.green }} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(57,217,138,0.08)", border: "1px solid rgba(57,217,138,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <CheckCircle size={22} style={{ color: A.green }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: A.white, marginBottom: 4 }}>Nenhum alerta crítico nas últimas 24h</div>
        <div style={{ fontSize: 12, color: A.muted, lineHeight: 1.6 }}>Todos os sistemas operando normalmente.</div>
      </div>
    );
  }

  return (
    <>
      {events.map((evt) => {
        const cfg = SEV_CONFIG[evt.severity] || SEV_CONFIG.low;
        const resolved = evt.resolved;
        return (
          <div
            key={evt._id}
            className={`sec-event-row sec-sev-${evt.severity}`}
            style={{ opacity: resolved ? 0.42 : 1 }}
          >
            <SevDot sev={evt.severity} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: A.white }}>
                  {TYPE_LABELS[evt.type] || evt.type}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                  padding: "1px 5px", borderRadius: 4,
                  background: cfg.color + "16", color: cfg.color, border: `1px solid ${cfg.color}28`,
                }}>
                  {cfg.label}
                </span>
              </div>
              {evt.description && (
                <div style={{ fontSize: 11, color: A.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {evt.description}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                {evt.userId?.name && (
                  <span style={{ fontSize: 10, color: A.dim }}>
                    <User size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />
                    {evt.userId.name}
                  </span>
                )}
                {evt.ip && (
                  <span style={{ fontSize: 10, color: A.dim, fontFamily: "monospace" }}>{evt.ip}</span>
                )}
                <span style={{ fontSize: 10, color: A.dim }}>
                  <Clock size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />
                  {new Date(evt.createdAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                </span>
              </div>
            </div>
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              {resolved ? (
                <span style={{ fontSize: 10, color: A.green, fontWeight: 700 }}>✓ OK</span>
              ) : (
                <button
                  onClick={() => onResolve(evt._id)}
                  disabled={resolving === evt._id}
                  className="a-btn green"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                >
                  {resolving === evt._id ? "..." : "Resolver"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function SuspiciousUsers({ users }) {
  if (users.length === 0) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(57,217,138,0.08)", border: "1px solid rgba(57,217,138,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <CheckCircle size={18} style={{ color: A.green }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.white, marginBottom: 3 }}>Nenhum usuário suspeito</div>
        <div style={{ fontSize: 11, color: A.muted }}>Últimas 24h</div>
      </div>
    );
  }

  return (
    <>
      {users.map((s) => (
        <div key={s.userId} style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={14} style={{ color: A.red }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.user?.name || "Usuário desconhecido"}
              </div>
              <div style={{ fontSize: 10, color: A.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.user?.email || "—"}
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: A.red, letterSpacing: "-0.04em", flexShrink: 0 }}>
              {s.eventCount}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[...new Set(s.types)].slice(0, 3).map((t) => (
              <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,0.09)", color: A.red, border: "1px solid rgba(239,68,68,0.18)", letterSpacing: "0.04em" }}>
                {TYPE_LABELS[t] || t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminSecurity({ isMobile }) {
  const [stats,      setStats]      = useState(null);
  const [events,     setEvents]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [suspicious, setSuspicious] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingEvts, setLoadingEvts] = useState(false);
  const [resolving,  setResolving]  = useState(null);

  const [filters, setFilters] = useState({
    severity: "all",
    resolved: "false",
    page:     1,
  });

  const fetchStats = useCallback(async () => {
    try { setStats(await getSecurityStats()); } catch (e) { console.error(e); }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvts(true);
    try {
      const params = { page: filters.page, limit: 25 };
      if (filters.severity !== "all") params.severity = filters.severity;
      if (filters.resolved !== "all") params.resolved = filters.resolved;
      const data = await getSecurityEvents(params);
      setEvents(data.events || []);
      setTotal(data.total  || 0);
    } catch (e) { console.error(e); } finally { setLoadingEvts(false); }
  }, [filters]);

  const fetchSuspicious = useCallback(async () => {
    try {
      const data = await getSecuritySuspiciousUsers();
      setSuspicious(data.users || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchSuspicious(), fetchEvents()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await resolveSecurityEvent(id);
      setEvents((prev) => prev.map((e) => e._id === id ? { ...e, resolved: true } : e));
    } catch (e) { console.error(e); } finally { setResolving(null); }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchSuspicious();
    fetchEvents();
  };

  const SEV_FILTERS = [
    { id: "all",      label: "Todos"    },
    { id: "critical", label: "Crítico"  },
    { id: "high",     label: "Alto"     },
    { id: "medium",   label: "Médio"    },
    { id: "low",      label: "Baixo"    },
  ];

  const SEV_PILL_COLORS = {
    critical: { "--fp-bd": "rgba(220,38,38,0.36)",  "--fp-bg": "rgba(220,38,38,0.08)",  "--fp-c": "#DC2626" },
    high:     { "--fp-bd": "rgba(239,68,68,0.36)",  "--fp-bg": "rgba(239,68,68,0.08)",  "--fp-c": "#EF4444" },
    medium:   { "--fp-bd": "rgba(245,158,11,0.36)", "--fp-bg": "rgba(245,158,11,0.08)", "--fp-c": "#F59E0B" },
    low:      { "--fp-bd": "rgba(59,130,246,0.36)", "--fp-bg": "rgba(59,130,246,0.08)", "--fp-c": "#3B82F6" },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <div className="a-spin" style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.07)`, borderTopColor: A.green }} />
      </div>
    );
  }

  return (
    <div className="page a-up" style={{ maxWidth: 1280 }}>
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: A.white, margin: 0, letterSpacing: "-0.02em" }}>
            Central de Segurança
          </h1>
          <p style={{ fontSize: 12, color: A.muted, margin: "4px 0 0" }}>
            SOC · Monitoramento em tempo real
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ABtn className="green" onClick={handleRefresh}>
            <Play size={10} />
            Executar verificação
          </ABtn>
          <ABtn onClick={handleRefresh}>
            <RefreshCw size={11} />
            Atualizar
          </ABtn>
        </div>
      </div>

      {/* Metric Rail */}
      <ARail>
        <ARailCell
          label="Eventos 24h"
          value={stats?.total24h ?? 0}
          sub="Total de eventos"
          accent={A.blue}
        />
        <ARailCell
          label="Alta severidade"
          value={stats?.highSeverity24h ?? 0}
          sub={stats?.highSeverity24h > 0 ? "Requer atenção" : "Nenhum crítico"}
          accent={stats?.highSeverity24h > 0 ? A.red : A.green}
          delta={stats?.highSeverity24h > 0 ? undefined : undefined}
        />
        <ARailCell
          label="Não resolvidos"
          value={stats?.unresolved ?? 0}
          sub="Pendentes de revisão"
          accent={A.amber}
        />
        <ARailCell
          label="Usuários suspeitos"
          value={suspicious.length}
          sub="Últimas 24h"
          accent={A.purple}
        />
      </ARail>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left: Event Feed */}
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div className="a-tab-bar">
              {SEV_FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={`a-tab ${filters.severity === f.id ? "on" : ""}`}
                  style={filters.severity === f.id && SEV_PILL_COLORS[f.id] ? SEV_PILL_COLORS[f.id] : {}}
                  onClick={() => setFilters((p) => ({ ...p, severity: f.id, page: 1 }))}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              className={`a-fp ${filters.resolved === "false" ? "on" : ""}`}
              onClick={() => setFilters((p) => ({ ...p, resolved: p.resolved === "false" ? "all" : "false", page: 1 }))}
            >
              Não resolvidos
            </button>
            <span style={{ marginLeft: "auto", fontSize: 10, color: A.dim }}>{total} eventos</span>
          </div>

          {/* Feed panel */}
          <APanel style={{ padding: 0, overflow: "hidden" }}>
            <EventFeed events={events} resolving={resolving} onResolve={handleResolve} loading={loadingEvts} />
          </APanel>

          {/* Pagination */}
          {total > 25 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <ABtn
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page <= 1}
              >
                Anterior
              </ABtn>
              <span style={{ padding: "7px 12px", fontSize: 11, color: A.muted }}>
                {filters.page} / {Math.ceil(total / 25)}
              </span>
              <ABtn
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page * 25 >= total}
              >
                Próxima
              </ABtn>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Suspicious Users */}
          <APanel style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px 11px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: A.dim, marginBottom: 2 }}>
                Usuários Suspeitos
              </div>
              <div style={{ fontSize: 12, color: A.muted }}>
                {suspicious.length === 0 ? "Nenhum nas últimas 24h" : `${suspicious.length} identificado${suspicious.length > 1 ? "s" : ""}`}
              </div>
            </div>
            <SuspiciousUsers users={suspicious} />
          </APanel>

          {/* Module Status */}
          <APanel style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px 11px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: A.dim }}>
                Status dos Módulos
              </div>
            </div>
            {SECURITY_MODULES.map((mod) => (
              <div key={mod.label} className="sec-module-row">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: mod.status === "ok" ? "rgba(57,217,138,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${mod.status === "ok" ? "rgba(57,217,138,0.18)" : "rgba(245,158,11,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: mod.status === "ok" ? A.green : A.amber }}>
                  <mod.icon size={12} />
                </div>
                <div style={{ flex: 1, fontSize: 12, color: A.light }}>{mod.label}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: mod.status === "ok" ? A.green : A.amber }}>
                  {mod.status === "ok" ? "Ativo" : "Alerta"}
                </div>
              </div>
            ))}
          </APanel>
        </div>
      </div>
    </div>
  );
}
