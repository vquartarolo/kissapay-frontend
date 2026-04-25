import {
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  User,
  XCircle,
  Clock,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import C from "../../constants/colors";
import {
  getSecurityStats,
  getSecurityEvents,
  getSecuritySuspiciousUsers,
  resolveSecurityEvent,
} from "../../services/admin.service";

const SEVERITY_CONFIG = {
  low:      { label: "Baixo",    color: "#3B82F6", bg: "rgba(59,130,246,0.12)"  },
  medium:   { label: "Médio",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  },
  high:     { label: "Alto",     color: "#EF4444", bg: "rgba(239,68,68,0.12)"   },
  critical: { label: "Crítico",  color: "#DC2626", bg: "rgba(220,38,38,0.18)"   },
};

const TYPE_LABELS = {
  login_success:            "Login bem-sucedido",
  login_failed:             "Falha de login",
  multiple_login_attempts:  "Múltiplas tentativas",
  suspicious_ip:            "IP suspeito",
  rate_limit_triggered:     "Rate limit ativo",
  admin_action:             "Ação administrativa",
  permission_denied:        "Permissão negada",
  session_revoked:          "Sessão revogada",
  account_frozen:           "Conta congelada",
  account_unfrozen:         "Conta descongelada",
  suspicious_cashout:       "Saque suspeito",
  unusual_volume:           "Volume atípico",
};

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
  return (
    <span
      style={{
        display:      "inline-block",
        padding:      "2px 8px",
        borderRadius: 6,
        fontSize:     11,
        fontWeight:   700,
        color:        cfg.color,
        background:   cfg.bg,
        border:       `1px solid ${cfg.color}33`,
        letterSpacing: "0.03em",
      }}
    >
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.border}`,
        borderRadius: 12,
        padding:      "20px 24px",
        display:      "flex",
        alignItems:   "center",
        gap:          16,
        flex:         1,
        minWidth:     180,
      }}
    >
      <div
        style={{
          width:        44,
          height:       44,
          borderRadius: 10,
          background:   color + "18",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          flexShrink:   0,
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>{value}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminSecurity({ isMobile }) {
  const [stats, setStats]           = useState(null);
  const [events, setEvents]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [suspicious, setSuspicious] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingEvts, setLoadingEvts] = useState(false);
  const [resolving, setResolving]   = useState(null);
  const [tab, setTab]               = useState("events");

  const [filters, setFilters] = useState({
    severity: "all",
    type:     "all",
    resolved: "false",
    page:     1,
  });

  const fetchStats = useCallback(async () => {
    try {
      const data = await getSecurityStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvts(true);
    try {
      const params = {};
      if (filters.severity !== "all") params.severity = filters.severity;
      if (filters.type !== "all")     params.type     = filters.type;
      if (filters.resolved !== "all") params.resolved = filters.resolved;
      params.page  = filters.page;
      params.limit = 30;

      const data = await getSecurityEvents(params);
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvts(false);
    }
  }, [filters]);

  const fetchSuspicious = useCallback(async () => {
    try {
      const data = await getSecuritySuspiciousUsers();
      setSuspicious(data.users || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchSuspicious()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "events") fetchEvents();
  }, [tab, fetchEvents]);

  const handleResolve = async (eventId) => {
    setResolving(eventId);
    try {
      await resolveSecurityEvent(eventId);
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, resolved: true } : e))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(null);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchSuspicious();
    if (tab === "events") fetchEvents();
  };

  const TABS = [
    { id: "events",     label: "Eventos" },
    { id: "suspicious", label: "Usuários Suspeitos" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.green, animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={22} style={{ color: C.green }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.white, margin: 0 }}>
            Central de Segurança
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard
          label="Eventos nas últimas 24h"
          value={stats?.total24h ?? 0}
          icon={Shield}
          color="#3B82F6"
        />
        <StatCard
          label="Alta severidade (24h)"
          value={stats?.highSeverity24h ?? 0}
          sub={stats?.highSeverity24h > 0 ? "Requer atenção" : undefined}
          icon={AlertTriangle}
          color="#EF4444"
        />
        <StatCard
          label="Eventos não resolvidos"
          value={stats?.unresolved ?? 0}
          icon={Clock}
          color="#F59E0B"
        />
        <StatCard
          label="Usuários suspeitos (24h)"
          value={suspicious.length}
          icon={User}
          color="#8B5CF6"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding:      "9px 18px",
              borderRadius: "8px 8px 0 0",
              border:       "none",
              background:   tab === t.id ? C.card : "transparent",
              color:        tab === t.id ? C.white : C.muted,
              fontWeight:   tab === t.id ? 700 : 500,
              fontSize:     13,
              cursor:       "pointer",
              fontFamily:   "inherit",
              borderBottom: tab === t.id ? `2px solid ${C.green}` : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {tab === "events" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <select
              value={filters.severity}
              onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value, page: 1 }))}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 13, fontFamily: "inherit" }}
            >
              <option value="all">Todas as severidades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 13, fontFamily: "inherit" }}
            >
              <option value="all">Todos os tipos</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <select
              value={filters.resolved}
              onChange={(e) => setFilters((f) => ({ ...f, resolved: e.target.value, page: 1 }))}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 13, fontFamily: "inherit" }}
            >
              <option value="all">Todos</option>
              <option value="false">Não resolvidos</option>
              <option value="true">Resolvidos</option>
            </select>
          </div>

          {/* Events Table */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            {loadingEvts ? (
              <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando...</div>
            ) : events.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
                <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>Nenhum evento encontrado</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Severidade", "Tipo", "Usuário", "IP", "Descrição", "Data", "Ação"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding:   "10px 16px",
                          textAlign: "left",
                          fontSize:  11,
                          fontWeight: 700,
                          color:     C.muted,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt, i) => (
                    <tr
                      key={evt._id}
                      style={{
                        borderBottom: i < events.length - 1 ? `1px solid ${C.border}` : "none",
                        opacity: evt.resolved ? 0.5 : 1,
                      }}
                    >
                      <td style={{ padding: "10px 16px" }}>
                        <SeverityBadge severity={evt.severity} />
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: C.white }}>
                        {TYPE_LABELS[evt.type] || evt.type}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: C.muted }}>
                        {evt.userId ? (
                          <div>
                            <div style={{ color: C.white }}>{evt.userId.name || "—"}</div>
                            <div style={{ fontSize: 11 }}>{evt.userId.email || ""}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: C.muted, fontFamily: "monospace" }}>
                        {evt.ip || "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: C.muted, maxWidth: 220 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {evt.description || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 11, color: C.dim, whiteSpace: "nowrap" }}>
                        {new Date(evt.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {!evt.resolved ? (
                          <button
                            onClick={() => handleResolve(evt._id)}
                            disabled={resolving === evt._id}
                            style={{
                              padding:      "4px 10px",
                              borderRadius: 6,
                              border:       `1px solid ${C.green}44`,
                              background:   "transparent",
                              color:        C.green,
                              fontSize:     12,
                              cursor:       "pointer",
                              fontFamily:   "inherit",
                              opacity:      resolving === evt._id ? 0.5 : 1,
                            }}
                          >
                            {resolving === evt._id ? "..." : "Resolver"}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle size={12} /> Resolvido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {total > 30 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page <= 1}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: filters.page <= 1 ? 0.4 : 1 }}
              >
                Anterior
              </button>
              <span style={{ padding: "6px 14px", fontSize: 13, color: C.muted }}>
                Página {filters.page} — {total} eventos
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page * 30 >= total}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: filters.page * 30 >= total ? 0.4 : 1 }}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {/* Suspicious Users Tab */}
      {tab === "suspicious" && (
        <div>
          {suspicious.length === 0 ? (
            <div
              style={{
                background:   C.card,
                border:       `1px solid ${C.border}`,
                borderRadius: 12,
                padding:      40,
                textAlign:    "center",
                color:        C.muted,
              }}
            >
              <CheckCircle size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontSize: 14 }}>Nenhum usuário suspeito nas últimas 24h</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {suspicious.map((s) => (
                <div
                  key={s.userId}
                  style={{
                    background:   C.card,
                    border:       `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding:      "16px 20px",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          16,
                    flexWrap:     "wrap",
                  }}
                >
                  <div
                    style={{
                      width:        40,
                      height:       40,
                      borderRadius: 10,
                      background:   "rgba(239,68,68,0.12)",
                      display:      "flex",
                      alignItems:   "center",
                      justifyContent: "center",
                      flexShrink:   0,
                    }}
                  >
                    <AlertTriangle size={18} style={{ color: "#EF4444" }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
                      {s.user?.name || "Usuário desconhecido"}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {s.user?.email || "—"} &nbsp;·&nbsp; {s.user?.role || "—"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#EF4444" }}>
                      {s.eventCount}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>eventos críticos</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Tipos</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {[...new Set(s.types)].slice(0, 4).map((t) => (
                        <span
                          key={t}
                          style={{
                            padding:      "2px 7px",
                            borderRadius: 5,
                            fontSize:     10,
                            background:   "rgba(239,68,68,0.1)",
                            color:        "#EF4444",
                            border:       "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          {TYPE_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: C.dim, whiteSpace: "nowrap" }}>
                    Último: {new Date(s.lastEvent).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
