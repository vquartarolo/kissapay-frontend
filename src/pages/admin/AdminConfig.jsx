import { useEffect, useState } from "react";
import { Settings, Percent, Landmark, RefreshCw, Save, Clock } from "lucide-react";
import { getAdminConfig, updateAdminConfig, getAdminProviders } from "../../services/admin.service";
import { A, ADMIN_CSS, APanel, ABtn } from "../../components/admin/AdminDS";

const STYLES = `${ADMIN_CSS}
  .cfg-tab-content { animation: a-up 0.22s cubic-bezier(.16,1,.3,1) both; }

  .cfg-field-label {
    font-size: 11px;
    font-weight: 700;
    color: #5C6E82;
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }
  .cfg-split-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .cfg-save-bar {
    position: sticky;
    bottom: 0;
    background: rgba(7,8,10,0.94);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid rgba(255,255,255,0.07);
    padding: 14px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 24px;
    z-index: 10;
  }
`;

const TABS = [
  { id: "pix",        label: "Taxas PIX",    icon: Percent,  color: "#39D98A" },
  { id: "crypto",     label: "Taxas Cripto", icon: Percent,  color: "#D6A84F" },
  { id: "retention",  label: "Retenção",     icon: Clock,    color: "#8B5CF6" },
  { id: "providers",  label: "Adquirentes",  icon: Landmark, color: "#3B82F6" },
];

function fmtDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function FieldRow({ label, sublabel, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <div className="cfg-field-label">{label}</div>}
      {sublabel && <div style={{ fontSize: 10, color: A.dim, marginBottom: 6 }}>{sublabel}</div>}
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = "0.01", min = "0", max }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="a-input"
    />
  );
}

function SplitFields({ label, accent, fixedKey, pctKey, form, onChange, isMobile }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="cfg-split-label" style={{ color: accent }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <FieldRow label="Taxa fixa (R$)">
          <NumInput value={form[fixedKey]} onChange={(v) => onChange(fixedKey, v)} />
        </FieldRow>
        <FieldRow label="Taxa percentual (%)">
          <NumInput value={form[pctKey]} onChange={(v) => onChange(pctKey, v)} max="100" />
        </FieldRow>
      </div>
    </div>
  );
}

export default function AdminConfig({ isMobile }) {
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [feedback,  setFeedback]  = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [providers, setProviders] = useState([{ value: "", label: "Padrão do sistema" }]);
  const [tab,       setTab]       = useState("pix");

  const [form, setForm] = useState({
    pixInFixed:      "0",
    pixInPct:        "0",
    pixOutFixed:     "0",
    pixOutPct:       "0",
    cryptoInFixed:   "0",
    cryptoInPct:     "0",
    cryptoOutFixed:  "0",
    cryptoOutPct:    "0",
    retentionDays:   "0",
    retentionPct:    "0",
    chargeProvider:  "",
    cashoutProvider: "",
  });

  function onChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFeedback("");
  }

  async function load() {
    try {
      setLoading(true);
      const [configRes, provRes] = await Promise.all([getAdminConfig(), getAdminProviders()]);
      const cfg = configRes?.config;
      if (cfg) {
        setForm({
          pixInFixed:      String(cfg.split?.cashIn?.pix?.fixed ?? 0),
          pixInPct:        String(cfg.split?.cashIn?.pix?.percentage ?? 0),
          pixOutFixed:     String(cfg.split?.cashOut?.pix?.fixed ?? 0),
          pixOutPct:       String(cfg.split?.cashOut?.pix?.percentage ?? 0),
          cryptoInFixed:   String(cfg.split?.cashIn?.crypto?.fixed ?? 0),
          cryptoInPct:     String(cfg.split?.cashIn?.crypto?.percentage ?? 0),
          cryptoOutFixed:  String(cfg.split?.cashOut?.crypto?.fixed ?? 0),
          cryptoOutPct:    String(cfg.split?.cashOut?.crypto?.percentage ?? 0),
          retentionDays:   String(cfg.retention?.days ?? 0),
          retentionPct:    String(cfg.retention?.percentage ?? 0),
          chargeProvider:  cfg.routing?.chargeProvider || "",
          cashoutProvider: cfg.routing?.cashoutProvider || "",
        });
        setUpdatedAt(cfg.updatedAt || null);
      }
      const items = Array.isArray(provRes?.items) ? provRes.items : [];
      setProviders(items.length > 0 ? items : [{ value: "", label: "Padrão do sistema" }]);
    } catch (err) {
      console.error("Erro ao carregar config:", err);
      setFeedback("Erro ao carregar configuração.");
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const pctKeys   = ["pixInPct", "pixOutPct", "cryptoInPct", "cryptoOutPct", "retentionPct"];
    const fixedKeys = ["pixInFixed", "pixOutFixed", "cryptoInFixed", "cryptoOutFixed"];
    for (const key of pctKeys) {
      const v = Number(form[key]);
      if (isNaN(v) || v < 0 || v > 100) return "Percentuais devem ser entre 0 e 100.";
    }
    for (const key of fixedKeys) {
      const v = Number(form[key]);
      if (isNaN(v) || v < 0) return "Taxas fixas não podem ser negativas.";
    }
    if (Number(form.retentionDays) < 0 || isNaN(Number(form.retentionDays))) {
      return "Dias de retenção não podem ser negativos.";
    }
    return null;
  }

  async function handleSave() {
    const err = validateForm();
    if (err) { setFeedback(err); return; }
    try {
      setSaving(true);
      setFeedback("");
      await updateAdminConfig({
        cashIn: {
          pix:    { fixed: Number(form.pixInFixed    || 0), percentage: Number(form.pixInPct    || 0) },
          crypto: { fixed: Number(form.cryptoInFixed || 0), percentage: Number(form.cryptoInPct || 0) },
        },
        cashOut: {
          pix:    { fixed: Number(form.pixOutFixed    || 0), percentage: Number(form.pixOutPct    || 0) },
          crypto: { fixed: Number(form.cryptoOutFixed || 0), percentage: Number(form.cryptoOutPct || 0) },
        },
        retention: {
          days:       Number(form.retentionDays || 0),
          percentage: Number(form.retentionPct  || 0),
        },
        routing: {
          chargeProvider:  form.chargeProvider,
          cashoutProvider: form.cashoutProvider,
        },
      });
      setFeedback("ok");
      await load();
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  const isError = feedback && feedback !== "ok" && String(feedback).toLowerCase().includes("erro");
  const isOk    = feedback === "ok";

  const currentTab = TABS.find((t) => t.id === tab);

  return (
    <div className="page a-up" style={{ maxWidth: 1280 }}>
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: A.white, margin: 0, letterSpacing: "-0.02em" }}>
            Configuração padrão
          </h1>
          <p style={{ fontSize: 12, color: A.muted, margin: "4px 0 0" }}>
            Taxas e adquirentes aplicados automaticamente a novos sellers no cadastro
          </p>
        </div>
        <ABtn onClick={load} disabled={loading}>
          <RefreshCw size={11} className={loading ? "a-spin" : ""} />
          Recarregar
        </ABtn>
      </div>

      {/* Feedback banner */}
      {(isError || isOk) && (
        <div style={{
          marginBottom: 16, borderRadius: 12, padding: "12px 16px", fontSize: 13,
          color:      isOk ? A.green : A.red,
          background: isOk ? "rgba(57,217,138,0.06)" : "rgba(239,68,68,0.06)",
          border:     `1px solid ${isOk ? "rgba(57,217,138,0.20)" : "rgba(239,68,68,0.20)"}`,
        }}>
          {isOk ? "✓ Configuração salva com sucesso." : feedback}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <div className="a-spin" style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.08)`, borderTopColor: A.green }} />
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "8px 16px", borderRadius: 10,
                    border: active ? `1px solid ${t.color}38` : "1px solid rgba(255,255,255,0.07)",
                    background: active ? t.color + "12" : "rgba(255,255,255,0.02)",
                    color: active ? t.color : A.muted,
                    fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                    transition: "all 0.14s",
                  }}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <APanel key={tab} className="cfg-tab-content" style={{ maxWidth: 720 }}>
            {/* Tab header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: currentTab.color + "16", border: `1px solid ${currentTab.color}28`, display: "flex", alignItems: "center", justifyContent: "center", color: currentTab.color, flexShrink: 0 }}>
                <currentTab.icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: A.white }}>{currentTab.label}</div>
                <div style={{ fontSize: 11, color: A.muted }}>
                  {tab === "pix"       && "Taxas cobradas em transações PIX — entrada e saída"}
                  {tab === "crypto"    && "Taxas cobradas em transações com criptomoedas"}
                  {tab === "retention" && "Retenção automática de saldo em novos sellers"}
                  {tab === "providers" && "Adquirentes padrão para cobrança e saque"}
                </div>
              </div>
            </div>

            {/* ── PIX ─────────────────────────────────── */}
            {tab === "pix" && (
              <div>
                <SplitFields label="Entrada (PIX In)" accent={A.green} fixedKey="pixInFixed" pctKey="pixInPct" form={form} onChange={onChange} isMobile={isMobile} />
                <SplitFields label="Saída (PIX Out)"  accent={A.gold}  fixedKey="pixOutFixed" pctKey="pixOutPct" form={form} onChange={onChange} isMobile={isMobile} />
              </div>
            )}

            {/* ── CRIPTO ──────────────────────────────── */}
            {tab === "crypto" && (
              <div>
                <SplitFields label="Entrada (Cripto In)" accent={A.green} fixedKey="cryptoInFixed"  pctKey="cryptoInPct"  form={form} onChange={onChange} isMobile={isMobile} />
                <SplitFields label="Saída (Cripto Out)"  accent={A.gold}  fixedKey="cryptoOutFixed" pctKey="cryptoOutPct" form={form} onChange={onChange} isMobile={isMobile} />
              </div>
            )}

            {/* ── RETENÇÃO ────────────────────────────── */}
            {tab === "retention" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <FieldRow label="Dias de retenção" sublabel="Número de dias que o saldo fica retido após o depósito">
                  <NumInput value={form.retentionDays} onChange={(v) => onChange("retentionDays", v)} step="1" />
                </FieldRow>
                <FieldRow label="Percentual retido (%)" sublabel="Percentual do depósito que entra em retenção">
                  <NumInput value={form.retentionPct} onChange={(v) => onChange("retentionPct", v)} max="100" />
                </FieldRow>
              </div>
            )}

            {/* ── ADQUIRENTES ─────────────────────────── */}
            {tab === "providers" && (
              <div style={{ display: "grid", gap: 14 }}>
                <FieldRow label="Adquirente de cobrança" sublabel="Usado para processar pagamentos de entrada">
                  <select
                    value={form.chargeProvider}
                    onChange={(e) => onChange("chargeProvider", e.target.value)}
                    className="a-select"
                  >
                    {providers.map((p, i) => (
                      <option key={p.value || `cp-${i}`} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </FieldRow>
                <FieldRow label="Adquirente de saque" sublabel="Usado para processar saques e pagamentos de saída">
                  <select
                    value={form.cashoutProvider}
                    onChange={(e) => onChange("cashoutProvider", e.target.value)}
                    className="a-select"
                  >
                    {providers.map((p, i) => (
                      <option key={p.value || `co-${i}`} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </FieldRow>
              </div>
            )}
          </APanel>

          {/* Sticky save bar */}
          <div className="cfg-save-bar">
            <div style={{ fontSize: 11, color: A.dim }}>
              {updatedAt ? (
                <>
                  <Clock size={10} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Última atualização: {fmtDate(updatedAt)}
                </>
              ) : (
                <span>Nenhuma configuração salva ainda</span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 10,
                background: saving ? "rgba(57,217,138,0.08)" : "rgba(57,217,138,0.12)",
                border: "1px solid rgba(57,217,138,0.32)",
                color: A.green, fontSize: 13, fontWeight: 800, fontFamily: "inherit",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                transition: "all 0.14s",
              }}
            >
              {saving ? (
                <div className="a-spin" style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid rgba(57,217,138,0.3)`, borderTopColor: A.green }} />
              ) : (
                <Save size={13} />
              )}
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
