import { useState } from "react";
import {
  FileText, Shield, BarChart2, ScrollText,
  Download, Search, AlertTriangle, CheckCircle, XCircle,
  Clock, User, TrendingUp,
} from "lucide-react";
import C from "../../constants/colors";
import {
  getUserComplianceReport,
  getRiskComplianceReport,
  getFinancialComplianceReport,
  getAuditTrailReport,
} from "../../services/admin.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

async function downloadPDF(fetchFn, filename) {
  const blob = await fetchFn();
  const url  = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

// ── Subcomponentes compartilhados ─────────────────────────────────────────────

function StatusBadge({ value, type = "generic" }) {
  const configs = {
    confirmed:      { color: "#E5484D", bg: "rgba(229,72,77,0.10)",  label: "Confirmado"    },
    possible_match: { color: "#F59E0B", bg: "rgba(245,158,11,0.10)", label: "Possível match"},
    clear:          { color: "#34A065", bg: "rgba(45,134,89,0.10)",  label: "Limpo"         },
    unknown:        { color: "#5A6A7E", bg: "rgba(90,106,126,0.10)", label: "Desconhecido"  },
    approved:       { color: "#34A065", bg: "rgba(45,134,89,0.10)",  label: "Aprovado"      },
    rejected:       { color: "#E5484D", bg: "rgba(229,72,77,0.10)",  label: "Rejeitado"     },
    pending:        { color: "#F59E0B", bg: "rgba(245,158,11,0.10)", label: "Pendente"      },
    under_review:   { color: "#60A5FA", bg: "rgba(96,165,250,0.10)", label: "Em análise"    },
    high:           { color: "#E5484D", bg: "rgba(229,72,77,0.10)",  label: "Alto"          },
    medium:         { color: "#F59E0B", bg: "rgba(245,158,11,0.10)", label: "Médio"         },
    low:            { color: "#34A065", bg: "rgba(45,134,89,0.10)",  label: "Baixo"         },
    block:          { color: "#E5484D", bg: "rgba(229,72,77,0.10)",  label: "Bloqueado"     },
    review:         { color: "#F59E0B", bg: "rgba(245,158,11,0.10)", label: "Revisão"       },
    allow:          { color: "#34A065", bg: "rgba(45,134,89,0.10)",  label: "Permitido"     },
  };
  const c = configs[value] ?? { color: "#5A6A7E", bg: "rgba(90,106,126,0.10)", label: value ?? "—" };
  return (
    <span style={{ padding: "2px 9px", borderRadius: 999, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

function InfoCard({ label, value, color, Icon }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        {Icon && <Icon size={14} color={color || C.muted} />}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: color || C.white }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function KVRow({ label, value, color }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: color || C.white }}>{value}</span>
    </div>
  );
}

function DateRange({ from, to, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: C.muted }}>De:</span>
      <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)}
        style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 12, cursor: "pointer" }} />
      <span style={{ fontSize: 12, color: C.muted }}>Até:</span>
      <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)}
        style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 12, cursor: "pointer" }} />
    </div>
  );
}

function LoadBtn({ onClick, loading, disabled, children, variant = "primary" }) {
  const colors = {
    primary: { bg: "rgba(45,134,89,0.15)", color: "#34A065" },
    outline: { bg: "transparent",          color: C.muted   },
    red:     { bg: "rgba(229,72,77,0.12)", color: "#E5484D" },
    blue:    { bg: "rgba(96,165,250,0.12)",color: "#60A5FA" },
  };
  const c = colors[variant] || colors.primary;
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 9, border: variant === "outline" ? `1px solid ${C.border}` : "none",
        background: c.bg, color: c.color, fontSize: 13, fontWeight: 700,
        cursor: (loading || disabled) ? "not-allowed" : "pointer",
        opacity: (loading || disabled) ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ── Seção 1 — Relatório por Usuário ──────────────────────────────────────────

function UserReportSection() {
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function search() {
    if (!input.trim()) return;
    setLoading(true); setError(null); setData(null);
    try {
      const res = await getUserComplianceReport(input.trim(), "json");
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.msg || "Usuário não encontrado.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePDF() {
    if (!data) return;
    setPdfLoading(true);
    try {
      await downloadPDF(
        () => getUserComplianceReport(input.trim(), "pdf"),
        `user-report-${input.slice(-8)}.pdf`
      );
    } catch (err) { console.error(err); }
    finally { setPdfLoading(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="ID do usuário (ObjectId)"
          style={{
            flex: 1, minWidth: 240,
            padding: "9px 14px", borderRadius: 9,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.white, fontSize: 13, fontFamily: "monospace",
            outline: "none",
          }}
        />
        <LoadBtn onClick={search} loading={loading}><Search size={13} />Buscar</LoadBtn>
        {data && <LoadBtn onClick={handlePDF} loading={pdfLoading} variant="blue"><Download size={13} />Baixar PDF</LoadBtn>}
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.22)", color: "#E5484D", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Usuário */}
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
            <Section title="Identificação">
              <KVRow label="Nome"          value={data.user?.name} />
              <KVRow label="E-mail"        value={data.user?.email} />
              <KVRow label="Documento"     value={data.user?.document} />
              <KVRow label="Perfil"        value={data.user?.role} />
              <KVRow label="Status"        value={data.user?.status} />
              <KVRow label="Status conta"  value={data.user?.accountStatus} />
              <KVRow label="Criado em"     value={fmtDate(data.user?.createdAt)} color={C.muted} />
            </Section>

            {data.kyc && (
              <Section title="KYC">
                <KVRow label="Status"         value={<StatusBadge value={data.kyc.status} />} />
                <KVRow label="Tipo"           value={data.kyc.kycType ?? "—"} />
                <KVRow label="Nome completo"  value={data.kyc.fullName} />
                <KVRow label="Documento"      value={data.kyc.documentNumber} />
                <KVRow label="PEP"            value={<StatusBadge value={data.kyc.pepStatus} />} />
                <KVRow label="Sanções"        value={<StatusBadge value={data.kyc.sanctionsStatus} />} />
                <KVRow label="Risco AML"      value={<StatusBadge value={data.kyc.amlRiskLevel} />} />
                <KVRow label="Enviado em"     value={fmtDate(data.kyc.submittedAt)} color={C.muted} />
              </Section>
            )}
          </div>

          {/* Risco + Financeiro */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <InfoCard label="Score médio"   value={data.riskSummary?.avgScore}     color="#F59E0B" Icon={Shield} />
              <InfoCard label="Score máximo"  value={data.riskSummary?.highestScore} color="#E5484D" Icon={AlertTriangle} />
              <InfoCard label="Bloqueios"     value={data.riskSummary?.blocked}      color="#E5484D" Icon={XCircle} />
              <InfoCard label="Verificações"  value={data.riskSummary?.totalChecks}  Icon={CheckCircle} />
            </div>

            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginBottom: 16 }}>
              <Section title="Financeiro">
                <KVRow label="Total depositado"   value={`R$ ${fmtBRL(data.transactions?.totalDeposits)}`}  color="#34A065" />
                <KVRow label="Total sacado"        value={`R$ ${fmtBRL(data.transactions?.totalCashouts)}`}  color="#E5484D" />
                <KVRow label="Taxas pagas"         value={`R$ ${fmtBRL(data.transactions?.totalFees)}`}       color="#F59E0B" />
                <KVRow label="Nº de saques"        value={data.transactions?.cashoutCount} />
                <KVRow label="Última atividade"    value={fmtDate(data.lastActivity)} color={C.muted} />
              </Section>
            </div>

            {data.riskSummary?.flags?.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
                <Section title="Flags de risco">
                  {data.riskSummary.flags.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "4px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <AlertTriangle size={11} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.muted }}>{f}</span>
                    </div>
                  ))}
                </Section>
              </div>
            )}
          </div>

          {/* Audit events */}
          {data.auditEvents?.length > 0 && (
            <div style={{ gridColumn: "1 / -1", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}` }}>
                Últimos eventos de auditoria ({data.auditEvents.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Ação", "Ator", "Data/Hora"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.muted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.auditEvents.slice(0, 15).map((e, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontFamily: "monospace", color: C.white }}>{e.action}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, color: C.muted }}>{e.actorRole}</td>
                      <td style={{ padding: "9px 14px", fontSize: 11, color: C.muted }}>{fmtDate(e.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Seção 2 — Relatório de Risco ──────────────────────────────────────────────

function RiskReportSection() {
  const [from,    setFrom]    = useState(daysAgo(30));
  const [to,      setTo]      = useState(today());
  const [loading, setLoading] = useState(false);
  const [pdfLoad, setPdfLoad] = useState(false);
  const [data,    setData]    = useState(null);

  async function load() {
    setLoading(true);
    try { setData(await getRiskComplianceReport({ from, to })); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handlePDF() {
    setPdfLoad(true);
    try { await downloadPDF(() => getRiskComplianceReport({ from, to, format: "pdf" }), `risk-report-${Date.now()}.pdf`); }
    catch (err) { console.error(err); }
    finally { setPdfLoad(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <LoadBtn onClick={load} loading={loading}><TrendingUp size={13} />Gerar relatório</LoadBtn>
        {data && <LoadBtn onClick={handlePDF} loading={pdfLoad} variant="blue"><Download size={13} />PDF</LoadBtn>}
      </div>

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <InfoCard label="Total verificações" value={data.summary?.totalChecks} />
            <InfoCard label="Bloqueados"          value={data.summary?.blocked}       color="#E5484D" Icon={XCircle} />
            <InfoCard label="PEP confirmados"     value={data.summary?.pepCount}      color="#E5484D" Icon={AlertTriangle} />
            <InfoCard label="Sanções confirmadas" value={data.summary?.sanctionsCount}color="#E5484D" Icon={Shield} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <InfoCard label="Score médio"    value={data.summary?.avgScore}       color="#F59E0B" />
            <InfoCard label="Alto risco AML" value={data.summary?.highRiskCount}  color="#E5484D" />
            <InfoCard label="Em revisão"     value={data.summary?.reviewed}       color="#F59E0B" />
          </div>

          {data.topRiskUsers?.length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}` }}>
                Usuários de maior risco
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Usuário", "Email", "Score máx.", "Bloqueios", "PEP", "Sanções"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.muted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topRiskUsers.map((u, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: "9px 14px", fontSize: 12, color: C.white, fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: "9px 14px", fontSize: 11, color: C.muted }}>{u.email}</td>
                      <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 800, color: u.highestScore >= 70 ? "#E5484D" : "#F59E0B" }}>{u.highestScore}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, color: u.blockCount > 0 ? "#E5484D" : C.muted }}>{u.blockCount}</td>
                      <td style={{ padding: "9px 14px" }}><StatusBadge value={u.pepStatus} /></td>
                      <td style={{ padding: "9px 14px" }}><StatusBadge value={u.sanctionsStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.ruleBreakdown?.length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}` }}>
                Breakdown de regras disparadas
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {data.ruleBreakdown.slice(0, 10).map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: "8px 14px", fontSize: 12, color: C.muted }}>{r.rule}</td>
                      <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 800, color: "#F59E0B", textAlign: "right" }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Seção 3 — Relatório Financeiro ────────────────────────────────────────────

function FinancialReportSection() {
  const [from,    setFrom]    = useState(daysAgo(30));
  const [to,      setTo]      = useState(today());
  const [loading, setLoading] = useState(false);
  const [pdfLoad, setPdfLoad] = useState(false);
  const [data,    setData]    = useState(null);

  async function load() {
    setLoading(true);
    try { setData(await getFinancialComplianceReport({ from, to })); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handlePDF() {
    setPdfLoad(true);
    try { await downloadPDF(() => getFinancialComplianceReport({ from, to, format: "pdf" }), `financial-report-${Date.now()}.pdf`); }
    catch (err) { console.error(err); }
    finally { setPdfLoad(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <LoadBtn onClick={load} loading={loading}><BarChart2 size={13} />Gerar relatório</LoadBtn>
        {data && <LoadBtn onClick={handlePDF} loading={pdfLoad} variant="blue"><Download size={13} />PDF</LoadBtn>}
      </div>

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <InfoCard label="Receita (taxas)"  value={`R$ ${fmtBRL(data.incomeStatement?.revenue)}`}   color="#34A065" Icon={TrendingUp} />
            <InfoCard label="Lucro líquido"    value={`R$ ${fmtBRL(data.incomeStatement?.netProfit)}`} color="#34A065" />
            <InfoCard label="Margem"           value={`${data.incomeStatement?.margin ?? 0}%`}         color="#F59E0B" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <InfoCard label="Entradas"     value={`R$ ${fmtBRL(data.cashFlow?.inflow)}`}  color="#34A065" />
            <InfoCard label="Saídas"       value={`R$ ${fmtBRL(data.cashFlow?.outflow)}`} color="#E5484D" />
            <InfoCard label="Taxas retidas"value={`R$ ${fmtBRL(data.cashFlow?.fees)}`}    color="#F59E0B" />
            <InfoCard label="Fluxo líquido"value={`R$ ${fmtBRL(data.cashFlow?.netFlow)}`} color={data.cashFlow?.netFlow >= 0 ? "#34A065" : "#E5484D"} />
          </div>

          {data.trialBalance?.accounts?.length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Balancete</span>
                {data.trialBalance.isBalanced
                  ? <span style={{ color: "#34A065", fontSize: 11, fontWeight: 800 }}>✓ Balanceado</span>
                  : <span style={{ color: "#E5484D", fontSize: 11, fontWeight: 800 }}>✗ Desbalanceado</span>
                }
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Conta", "Categoria", "Débito", "Crédito", "Saldo"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.muted, textAlign: h === "Conta" ? "left" : "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.trialBalance.accounts.map((acc, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 600, color: C.white }}>{acc.label}</td>
                      <td style={{ padding: "9px 14px", textAlign: "right" }}><StatusBadge value={acc.category} /></td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#E5484D", textAlign: "right" }}>R$ {fmtBRL(acc.totalDebit)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#34A065", textAlign: "right" }}>R$ {fmtBRL(acc.totalCredit)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 900, color: acc.balance >= 0 ? "#34A065" : "#E5484D", textAlign: "right" }}>R$ {fmtBRL(acc.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Seção 4 — Trilha de Auditoria ─────────────────────────────────────────────

function AuditTrailSection() {
  const [from,     setFrom]     = useState(daysAgo(7));
  const [to,       setTo]       = useState(today());
  const [entityId, setEntityId] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [pdfLoad,  setPdfLoad]  = useState(false);
  const [data,     setData]     = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = { from, to };
      if (entityId.trim()) params.entityId = entityId.trim();
      setData(await getAuditTrailReport(params));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handlePDF() {
    setPdfLoad(true);
    try {
      const params = { from, to, format: "pdf" };
      if (entityId.trim()) params.entityId = entityId.trim();
      await downloadPDF(() => getAuditTrailReport(params), `audit-trail-${Date.now()}.pdf`);
    } catch (err) { console.error(err); }
    finally { setPdfLoad(false); }
  }

  const ACTION_COLORS = {
    kyc_approved:    "#34A065",
    kyc_rejected:    "#E5484D",
    risk_sanctions_block: "#E5484D",
    risk_kyc_block:  "#E5484D",
    approval_approved: "#34A065",
    approval_rejected: "#E5484D",
    user_frozen:     "#E5484D",
    user_unfrozen:   "#34A065",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <input
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          placeholder="ID entidade (opcional)"
          style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 12, fontFamily: "monospace", outline: "none", width: 200 }}
        />
        <LoadBtn onClick={load} loading={loading}><ScrollText size={13} />Carregar</LoadBtn>
        {data && <LoadBtn onClick={handlePDF} loading={pdfLoad} variant="blue"><Download size={13} />PDF</LoadBtn>}
      </div>

      {data && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{data.totalEvents} eventos encontrados</span>
            {data.totalEvents > data.events?.length && (
              <span style={{ fontSize: 11, color: C.muted }}>(exibindo {data.events?.length})</span>
            )}
          </div>

          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Ação", "Ator", "Tipo alvo", "ID alvo", "Data/Hora"].map((h) => (
                    <th key={h} style={{ padding: "9px 14px", fontSize: 10, fontWeight: 700, color: C.muted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.events ?? []).slice(0, 100).map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: ACTION_COLORS[e.action] || C.white }}>{e.action}</span>
                    </td>
                    <td style={{ padding: "9px 14px", fontSize: 12, color: C.muted }}>{e.actorRole}</td>
                    <td style={{ padding: "9px 14px", fontSize: 11, color: C.muted }}>{e.targetType}</td>
                    <td style={{ padding: "9px 14px", fontSize: 11, fontFamily: "monospace", color: C.muted }}>{e.targetId ? `#${e.targetId.slice(-8).toUpperCase()}` : "—"}</td>
                    <td style={{ padding: "9px 14px", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{fmtDate(e.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

const TABS = [
  { key: "user",      label: "Relatório por Usuário",  Icon: User       },
  { key: "risk",      label: "Relatório de Risco",     Icon: Shield     },
  { key: "financial", label: "Relatório Financeiro",   Icon: BarChart2  },
  { key: "audit",     label: "Trilha de Auditoria",    Icon: ScrollText },
];

export default function AdminCompliance() {
  const [tab, setTab] = useState("user");

  return (
    <div style={{ color: C.white }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Compliance Documental
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          Relatórios formais com exportação PDF — nível banco/investidor.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 2 }}>
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: "8px 8px 0 0", border: "none",
              borderBottom: tab === key ? "2px solid #34A065" : "2px solid transparent",
              background: tab === key ? "rgba(45,134,89,0.07)" : "transparent",
              color: tab === key ? C.white : C.muted,
              fontSize: 13, fontWeight: tab === key ? 700 : 500,
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {tab === "user"      && <UserReportSection />}
      {tab === "risk"      && <RiskReportSection />}
      {tab === "financial" && <FinancialReportSection />}
      {tab === "audit"     && <AuditTrailSection />}
    </div>
  );
}
