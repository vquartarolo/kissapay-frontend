import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Scale, TrendingUp, ArrowDownLeft, ArrowUpRight,
  Coins, ShieldCheck, ShieldX, Download, RefreshCw,
  CheckCircle, XCircle,
} from "lucide-react";
import C from "../../constants/colors";
import {
  getTrialBalance,
  getIncomeStatement,
  getAccountingCashFlow,
  getLedgerSummary,
  getLedgerIntegrity,
} from "../../services/admin.service";
import api from "../../services/api";

// ── Palette fixa (recharts não lê CSS vars) ───────────────────────────────────
const P = {
  green:    "#34A065",
  red:      "#E5484D",
  amber:    "#F59E0B",
  blue:     "#60A5FA",
  purple:   "#A78BFA",
  card:     "#141417",
  cardSoft: "#1C1C21",
  border:   "rgba(255,255,255,0.07)",
  muted:    "#5A6A7E",
  dim:      "#2D3A48",
  white:    "#FFFFFF",
};

const TABS = [
  { key: "trial",    label: "Balancete",     Icon: Scale       },
  { key: "dre",      label: "Resultado",     Icon: TrendingUp  },
  { key: "cashflow", label: "Fluxo de Caixa",Icon: Coins       },
  { key: "chart",    label: "Por Período",   Icon: BarChart    },
  { key: "integrity",label: "Integridade",   Icon: ShieldCheck },
];

const CATEGORY_COLOR = {
  asset:      P.blue,
  liability:  P.amber,
  revenue:    P.green,
  expense:    P.red,
  adjustment: P.muted,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color, Icon }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
        {Icon && <Icon size={14} color={color || C.muted} />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || C.white, lineHeight: 1.1 }}>
        R$ {fmtBRL(value)}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
      )}
    </div>
  );
}

function DateRangePicker({ from, to, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: C.muted }}>Período:</span>
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        style={{
          padding: "5px 10px",
          borderRadius: 7,
          border: `1px solid ${C.border}`,
          background: C.card,
          color: C.white,
          fontSize: 12,
          cursor: "pointer",
        }}
      />
      <span style={{ fontSize: 12, color: C.muted }}>até</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        style={{
          padding: "5px 10px",
          borderRadius: 7,
          border: `1px solid ${C.border}`,
          background: C.card,
          color: C.white,
          fontSize: 12,
          cursor: "pointer",
        }}
      />
    </div>
  );
}

function LoadingBox() {
  return (
    <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
      Carregando…
    </div>
  );
}

// ── Seção 1: Balancete ────────────────────────────────────────────────────────

function TrialBalanceSection({ from, to }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrialBalance({ from, to });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBox />;
  if (!data)   return null;

  const grouped = {};
  for (const acc of data.accounts) {
    if (!grouped[acc.categoryLabel]) grouped[acc.categoryLabel] = [];
    grouped[acc.categoryLabel].push(acc);
  }

  return (
    <div>
      {/* Equilíbrio global */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          padding: "10px 14px",
          borderRadius: 10,
          background: data.isBalanced
            ? "rgba(45,134,89,0.08)"
            : "rgba(229,72,77,0.08)",
          border: `1px solid ${data.isBalanced ? "rgba(45,134,89,0.22)" : "rgba(229,72,77,0.22)"}`,
        }}
      >
        {data.isBalanced
          ? <CheckCircle size={14} color={P.green} />
          : <XCircle    size={14} color={P.red}   />
        }
        <span style={{ fontSize: 13, fontWeight: 700, color: data.isBalanced ? P.green : P.red }}>
          {data.isBalanced
            ? "Ledger balanceado — débitos = créditos"
            : `DESBALANCEADO — drift de R$ ${fmtBRL(data.balanceDrift)}`
          }
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>
          Total global: R$ {fmtBRL(data.totals.totalDebit)}
        </span>
      </div>

      {/* Grupos por categoria */}
      {Object.entries(grouped).map(([cat, rows]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              marginBottom: 8,
              padding: "0 4px",
            }}
          >
            {cat}
          </div>
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Conta", "Categoria", "Débito (R$)", "Crédito (R$)", "Saldo (R$)"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 14px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.muted,
                        textAlign: h === "Conta" ? "left" : "right",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.accountId} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{row.label}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{row.type}</div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          color: CATEGORY_COLOR[row.category] ?? C.muted,
                          background: `${CATEGORY_COLOR[row.category] ?? C.muted}18`,
                        }}
                      >
                        {row.categoryLabel}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, color: P.red,   fontWeight: 700 }}>
                      {fmtBRL(row.totalDebit)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, color: P.green, fontWeight: 700 }}>
                      {fmtBRL(row.totalCredit)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 900,
                      color: row.balance >= 0 ? P.green : P.red }}>
                      {fmtBRL(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Totais */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 32,
          padding: "10px 14px",
          borderTop: `1px solid ${C.border}`,
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        <span>Total Débito: <span style={{ color: P.red   }}>R$ {fmtBRL(data.totals.totalDebit)}</span></span>
        <span>Total Crédito: <span style={{ color: P.green }}>R$ {fmtBRL(data.totals.totalCredit)}</span></span>
      </div>
    </div>
  );
}

// ── Seção 2: DRE ─────────────────────────────────────────────────────────────

function DRESection({ from, to }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getIncomeStatement({ from, to })); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBox />;
  if (!data)   return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <SummaryCard
          label="Receita bruta"
          value={data.revenue}
          sub="Taxas cobradas no período"
          color={P.green}
          Icon={TrendingUp}
        />
        <SummaryCard
          label="Despesas"
          value={data.expenses}
          sub="Sem contas de despesa cadastradas"
          color={P.muted}
          Icon={ArrowUpRight}
        />
        <SummaryCard
          label="Lucro líquido"
          value={data.netProfit}
          sub={`Margem: ${data.margin}%`}
          color={data.netProfit >= 0 ? P.green : P.red}
          Icon={Coins}
        />
      </div>

      <div
        style={{
          background: C.card,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Linha DRE", "Valor (R$)"].map((h) => (
                <th key={h} style={{ padding: "9px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textAlign: h === "Linha DRE" ? "left" : "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Receita de taxas (fee_income)", value: data.revenue, color: P.green },
              { label: "(-) Despesas operacionais",    value: data.expenses, color: P.red   },
              { label: "= Lucro líquido",              value: data.netProfit, color: data.netProfit >= 0 ? P.green : P.red, bold: true },
              { label: "Margem líquida",               value: null, label2: `${data.margin}%`, color: C.muted },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, background: row.bold ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: row.bold ? 800 : 500, color: C.white }}>{row.label}</td>
                <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 13, fontWeight: row.bold ? 900 : 700, color: row.color }}>
                  {row.value != null ? `R$ ${fmtBRL(row.value)}` : row.label2}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Seção 3: Fluxo de Caixa ───────────────────────────────────────────────────

function CashFlowSection({ from, to }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAccountingCashFlow({ from, to })); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBox />;
  if (!data)   return null;

  const entries = Object.entries(data.byType || {}).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <SummaryCard label="Entradas"     value={data.inflow}  color={P.green}  Icon={ArrowDownLeft} sub="PIX + cripto" />
        <SummaryCard label="Saídas"       value={data.outflow} color={P.red}    Icon={ArrowUpRight}  sub="Saques concluídos" />
        <SummaryCard label="Taxas"        value={data.fees}    color={P.amber}  Icon={Coins}         sub="Fee income retido" />
        <SummaryCard
          label="Fluxo líquido"
          value={data.netFlow}
          color={data.netFlow >= 0 ? P.green : P.red}
          Icon={TrendingUp}
          sub="Entradas − Saídas − Taxas"
        />
      </div>

      {entries.length > 0 && (
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}` }}>
            Breakdown por tipo de lançamento
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {entries.map(([type, total]) => (
                <tr key={type} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: C.white, fontFamily: "monospace" }}>{type}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontSize: 13, fontWeight: 800, color: P.blue }}>
                    R$ {fmtBRL(total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Seção 4: Gráfico por Período ──────────────────────────────────────────────

function ChartSection({ from, to }) {
  const [period, setPeriod]   = useState("day");
  const [rows,   setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLedgerSummary({ from, to, period });
      setRows(res.rows ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to, period]);

  useEffect(() => { load(); }, [load]);

  const isEmpty = rows.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["day", "month"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: "5px 14px",
              borderRadius: 7,
              border: "none",
              background: period === p ? P.cardSoft : "transparent",
              color: period === p ? P.white : P.muted,
              fontSize: 12,
              fontWeight: period === p ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {p === "day" ? "Por dia" : "Por mês"}
          </button>
        ))}
      </div>

      {loading ? <LoadingBox /> : isEmpty ? (
        <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
          Nenhum dado no período.
        </div>
      ) : (
        <>
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "16px",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 12 }}>
              Volume total por {period === "day" ? "dia" : "mês"}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                <XAxis dataKey="date" tick={{ fill: P.muted, fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: P.muted, fontSize: 10 }} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 8 }}
                  labelStyle={{ color: P.muted, fontSize: 11 }}
                  formatter={(v) => [`R$ ${fmtBRL(v)}`, ""]}
                />
                <Area type="monotone" dataKey="deposits" name="Depósitos" stroke={P.green} fill={`${P.green}18`} strokeWidth={2} />
                <Area type="monotone" dataKey="cashouts" name="Saques"    stroke={P.red}   fill={`${P.red}18`}   strokeWidth={2} />
                <Area type="monotone" dataKey="fees"     name="Taxas"     stroke={P.amber} fill={`${P.amber}18`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "16px",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 12 }}>
              Depósitos vs Saques
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                <XAxis dataKey="date" tick={{ fill: P.muted, fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: P.muted, fontSize: 10 }} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 8 }}
                  labelStyle={{ color: P.muted, fontSize: 11 }}
                  formatter={(v) => [`R$ ${fmtBRL(v)}`, ""]}
                />
                <Bar dataKey="deposits" name="Depósitos" fill={P.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="cashouts" name="Saques"    fill={P.red}   radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ── Seção 5: Integridade do Ledger ────────────────────────────────────────────

function IntegritySection() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  async function runCheck() {
    setLoading(true);
    try { setData(await getLedgerIntegrity()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const ok = data?.integrityStatus === "OK";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={runCheck}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            borderRadius: 9,
            border: "none",
            background: "rgba(96,165,250,0.12)",
            color: P.blue,
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
          {loading ? "Verificando…" : "Executar verificação"}
        </button>
        <span style={{ fontSize: 12, color: C.muted }}>
          Verifica 5 critérios de integridade contábil.
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {data && (
        <>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: ok ? "rgba(45,134,89,0.08)" : "rgba(229,72,77,0.08)",
              border: `1px solid ${ok ? "rgba(45,134,89,0.22)" : "rgba(229,72,77,0.22)"}`,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            {ok
              ? <ShieldCheck size={18} color={P.green} />
              : <ShieldX     size={18} color={P.red}   />
            }
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: ok ? P.green : P.red }}>
                {ok ? "Ledger íntegro — nenhum problema encontrado" : `${data.issues.length} problema(s) detectado(s)`}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                {data.totalEntries} entradas analisadas · {data.checksRun?.length} verificações
              </div>
            </div>
          </div>

          {!ok && data.issues?.length > 0 && (
            <div
              style={{
                background: C.card,
                borderRadius: 12,
                border: `1px solid rgba(229,72,77,0.2)`,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Problemas detectados
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.issues.map((issue, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <XCircle size={13} color={P.red} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: C.white }}>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ok && (
            <div
              style={{
                background: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Verificações realizadas
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {(data.checksRun ?? []).map((check) => (
                  <div key={check} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <CheckCircle size={12} color={P.green} />
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminAccounting() {
  const [tab,  setTab]  = useState("trial");
  const [from, setFrom] = useState(daysAgo(30));
  const [to,   setTo]   = useState(today());
  const [exporting, setExporting] = useState(false);

  async function handleExport(format) {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format, from, to });
      const response = await api.get(`/admin/accounting/export?${params}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `ledger-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[export]", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ color: C.white }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: "-0.01em", marginBottom: 4 }}>
            Contabilidade
          </h1>
          <p style={{ fontSize: 13, color: C.muted }}>
            Balancete, DRE, fluxo de caixa e integridade do ledger double-entry.
          </p>
        </div>

        {/* Exportar */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
              opacity: exporting ? 0.6 : 1,
            }}
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
              opacity: exporting ? 0.6 : 1,
            }}
          >
            <Download size={12} /> JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 2 }}>
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: "8px 8px 0 0",
              border: "none",
              borderBottom: tab === key ? `2px solid ${P.green}` : "2px solid transparent",
              background: tab === key ? "rgba(45,134,89,0.07)" : "transparent",
              color: tab === key ? C.white : C.muted,
              fontSize: 13,
              fontWeight: tab === key ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo da tab ativa */}
      <div>
        {tab === "trial"    && <TrialBalanceSection from={from} to={to} />}
        {tab === "dre"      && <DRESection          from={from} to={to} />}
        {tab === "cashflow" && <CashFlowSection     from={from} to={to} />}
        {tab === "chart"    && <ChartSection        from={from} to={to} />}
        {tab === "integrity"&& <IntegritySection />}
      </div>
    </div>
  );
}
