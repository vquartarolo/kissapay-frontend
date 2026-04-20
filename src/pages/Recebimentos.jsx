import { useEffect, useMemo, useState } from "react";
import { Search, QrCode, TrendingUp, Copy, Check, ExternalLink } from "lucide-react";
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
import { getTransactionsHistory } from "../services/user.service";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import TypeIcon from "../components/ui/TypeIcon";
import PageHeader from "../components/ui/PageHeader";
import Btn from "../components/ui/Btn";
import { mapStatus } from "../utils/statusMap";
import { useNavigate } from "react-router-dom";

function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtShort(v) {
  const value = Number(v || 0);
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
}

function getMethod(tx) {
  return String(tx?.method || "").toLowerCase() === "crypto" ? "crypto" : "pix";
}

function getAmount(tx) {
  return Number(tx?.amount || 0);
}

function getTitle(tx) {
  return getMethod(tx) === "crypto" ? "Cripto pagamento" : "PIX pagamento";
}

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRemaining(ms) {
  if (ms <= 0) return "Expirado";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const finalMinutes = minutes % 60;
  if (hours > 0) return `${hours}h ${finalMinutes}m`;
  return `${finalMinutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getExpiresAt(tx) {
  if (tx?.expiresAt) return tx.expiresAt;
  if (tx?.pix?.expiresAt) return tx.pix.expiresAt;
  return null;
}

function buildChartData(items = [], period = "90d") {
  const daysMap = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const totalDays = daysMap[period] || 90;
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

  items.forEach((tx) => {
    if (mapStatus(tx?.status) !== "confirmed") return;

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

const PERIODS = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
];

export default function RecebimentosPage({ isMobile }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ today: 0, week: 0, month: 0, count: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [copiedId, setCopiedId] = useState(null);

  const [period, setPeriod] = useState("90d");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const chartData = useMemo(() => buildChartData(items, period), [items, period]);
  const chartTotal = useMemo(
    () => chartData.reduce((acc, item) => acc + Number(item.v || 0), 0),
    [chartData]
  );

  async function loadHistory({
    page = 1,
    methodValue = method,
    statusValue = status,
    searchValue = search,
    dateFromValue = dateFrom,
    dateToValue = dateTo,
    showLoading = false,
  } = {}) {
    try {
      if (showLoading) setLoading(true);

      const data = await getTransactionsHistory({
        page,
        limit: 100,
        method: methodValue,
        status: statusValue,
        search: searchValue,
        dateFrom: dateFromValue,
        dateTo: dateToValue,
      });

      setItems(Array.isArray(data?.items) ? data.items : []);
      setSummary(
        data?.summary || {
          today: 0,
          week: 0,
          month: 0,
          count: 0,
        }
      );
      setPagination(
        data?.pagination || {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setItems([]);
      setSummary({ today: 0, week: 0, month: 0, count: 0 });
      setPagination({ page: 1, limit: 100, total: 0, totalPages: 1 });
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory({ page: 1, showLoading: true });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadHistory({
        page: 1,
        methodValue: method,
        statusValue: status,
        searchValue: search,
        dateFromValue: dateFrom,
        dateToValue: dateTo,
        showLoading: false,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [method, status, search, dateFrom, dateTo]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      loadHistory({
        page: 1,
        methodValue: method,
        statusValue: status,
        searchValue: searchInput,
        dateFromValue: dateFrom,
        dateToValue: dateTo,
        showLoading: true,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  function applyFilters(nextMethod, nextStatus, nextDateFrom, nextDateTo) {
    loadHistory({
      page: 1,
      methodValue: nextMethod,
      statusValue: nextStatus,
      searchValue: search,
      dateFromValue: nextDateFrom,
      dateToValue: nextDateTo,
      showLoading: true,
    });
  }

  const metrics = [
    { label: "Hoje", value: `R$ ${fmtBRL(summary.today)}` },
    { label: "Esta semana", value: `R$ ${fmtBRL(summary.week)}` },
    { label: "Este mês", value: `R$ ${fmtBRL(summary.month)}` },
    { label: "Transações", value: String(summary.count) },
  ];

  const selectSt = {
    width: "100%",
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    padding: "10px 12px",
    color: C.white,
    outline: "none",
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div>
      <PageHeader
        title="Recebimentos"
        subtitle="Histórico de pagamentos recebidos"
        right={
          <Btn size="sm" icon={<QrCode size={14} />} onClick={() => navigate("/cobrancas/pix")}>
            Nova cobrança
          </Btn>
        }
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
                fontSize: i < 3 ? 20 : 26,
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
              <TrendingUp size={15} color={C.green} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
                Volume de recebimentos
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
                  border: `1px solid ${period === p.key ? C.green : C.border}`,
                  background: period === p.key ? "rgba(45,134,89,0.12)" : "transparent",
                  color: period === p.key ? C.green : C.muted,
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
              <linearGradient id="recvGrad" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#recvGrad)"
              dot={false}
              activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginBottom: 16, padding: "16px 18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr 1fr",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 6,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Buscar
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                padding: "10px 12px",
              }}
            >
              <Search size={14} color={C.muted} strokeWidth={2} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Descrição, TXID..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  color: C.white,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 6,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Método
            </div>

            <select
              value={method}
              style={selectSt}
              onChange={(e) => {
                setMethod(e.target.value);
                applyFilters(e.target.value, status, dateFrom, dateTo);
              }}
            >
              <option value="all">Todos</option>
              <option value="pix">PIX</option>
              <option value="crypto">Cripto</option>
            </select>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 6,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Status
            </div>

            <select
              value={status}
              style={selectSt}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters(method, e.target.value, dateFrom, dateTo);
              }}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="cancelled">Cancelado</option>
              <option value="expired">Expirado</option>
              <option value="failed">Falhou</option>
            </select>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 6,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              De
            </div>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                applyFilters(method, status, e.target.value, dateTo);
              }}
              style={selectSt}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 6,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Até
            </div>

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                applyFilters(method, status, dateFrom, e.target.value);
              }}
              style={selectSt}
            />
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {!isMobile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 140px 160px",
              padding: "10px 20px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {["Transação", "Valor", "Status", "Data"].map((h) => (
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
          <div style={{ padding: "28px 20px", color: C.muted }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: "28px 20px", color: C.muted }}>Nenhum recebimento encontrado.</div>
        ) : (
          items.map((tx, index) => {
            const normalizedStatus = mapStatus(tx?.status);
            const expiresAt = getExpiresAt(tx);
            const remaining =
              normalizedStatus === "pending" && expiresAt
                ? formatRemaining(new Date(expiresAt).getTime() - now)
                : null;

            return (
              <div
                key={tx?._id || index}
                style={{
                  display: isMobile ? "flex" : "grid",
                  gridTemplateColumns: "1fr 140px 140px 160px",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  borderBottom: index < items.length - 1 ? `1px solid ${C.border}` : "none",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <TypeIcon type={getMethod(tx)} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.white,
                        marginBottom: 2,
                      }}
                    >
                      {tx?.description || getTitle(tx)}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {getMethod(tx) === "crypto" ? "Cripto" : "PIX"}
                      {remaining ? ` • ${remaining}` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>
                  {`R$ ${fmtBRL(getAmount(tx))}`}
                </div>

                <div>
                  <StatusBadge status={normalizedStatus} />
                </div>

                <div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: getMethod(tx) === "crypto" ? 6 : 0 }}>
                    {formatDate(tx?.createdAt)}
                  </div>
                  {getMethod(tx) === "crypto" && tx?._id && (
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/pay/${tx._id}`);
                          setCopiedId(tx._id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        title="Copiar link de pagamento"
                        style={{
                          background: "transparent",
                          border: `1px solid ${copiedId === tx._id ? C.green : C.border}`,
                          borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          color: copiedId === tx._id ? C.green : C.muted,
                          fontSize: 11, fontWeight: 600, transition: "all 0.2s",
                        }}
                      >
                        {copiedId === tx._id ? <Check size={11} /> : <Copy size={11} />}
                        {copiedId === tx._id ? "Copiado" : "Link"}
                      </button>
                      <button
                        onClick={() => window.open(`${window.location.origin}/pay/${tx._id}`, "_blank")}
                        title="Abrir cobrança"
                        style={{
                          background: "transparent",
                          border: `1px solid ${C.border}`,
                          borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          color: C.muted, fontSize: 11, fontWeight: 600,
                        }}
                      >
                        <ExternalLink size={11} />
                        Ver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}