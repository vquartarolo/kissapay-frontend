import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Settings, Percent, Landmark, RefreshCw } from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import { getAdminConfig, updateAdminConfig, getAdminProviders } from "../../services/admin.service";

function fmtDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const inputStyle = {
  width: "100%",
  background: "var(--c-input-deep)",
  border: "1px solid var(--c-border)",
  borderRadius: 12,
  padding: "11px 12px",
  color: "var(--c-text-primary)",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

function SplitRow({ label, accent, fixedKey, pctKey, form, onChange, isMobile }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Taxa fixa (R$)</div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form[fixedKey]}
            onChange={(e) => onChange(fixedKey, e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Taxa percentual (%)</div>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form[pctKey]}
            onChange={(e) => onChange(pctKey, e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminConfig({ isMobile }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [providers, setProviders] = useState([{ value: "", label: "Padrão do sistema" }]);

  const [form, setForm] = useState({
    pixInFixed: "0",
    pixInPct: "0",
    pixOutFixed: "0",
    pixOutPct: "0",
    cryptoInFixed: "0",
    cryptoInPct: "0",
    cryptoOutFixed: "0",
    cryptoOutPct: "0",
    retentionDays: "0",
    retentionPct: "0",
    chargeProvider: "",
    cashoutProvider: "",
  });

  function onChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function load() {
    try {
      setLoading(true);
      const [configRes, provRes] = await Promise.all([
        getAdminConfig(),
        getAdminProviders(),
      ]);

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
    const pctKeys = ["pixInPct", "pixOutPct", "cryptoInPct", "cryptoOutPct", "retentionPct"];
    for (const key of pctKeys) {
      const v = Number(form[key]);
      if (isNaN(v) || v < 0 || v > 100) return "Percentuais devem ser entre 0 e 100.";
    }
    const fixedKeys = ["pixInFixed", "pixOutFixed", "cryptoInFixed", "cryptoOutFixed"];
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
    const validationError = validateForm();
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    try {
      setSaving(true);
      setFeedback("");

      await updateAdminConfig({
        cashIn: {
          pix:    { fixed: Number(form.pixInFixed || 0),    percentage: Number(form.pixInPct || 0) },
          crypto: { fixed: Number(form.cryptoInFixed || 0), percentage: Number(form.cryptoInPct || 0) },
        },
        cashOut: {
          pix:    { fixed: Number(form.pixOutFixed || 0),    percentage: Number(form.pixOutPct || 0) },
          crypto: { fixed: Number(form.cryptoOutFixed || 0), percentage: Number(form.cryptoOutPct || 0) },
        },
        retention: {
          days:       Number(form.retentionDays || 0),
          percentage: Number(form.retentionPct || 0),
        },
        routing: {
          chargeProvider:  form.chargeProvider,
          cashoutProvider: form.cashoutProvider,
        },
      });

      setFeedback("Configuração padrão salva com sucesso.");
      await load();
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const isError = String(feedback).toLowerCase().includes("erro");

  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 12px",
          borderRadius: 999,
          marginBottom: 14,
          border: "1px solid rgba(45,134,89,0.20)",
          background: "rgba(45,134,89,0.07)",
          color: C.green,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <Settings size={12} />
        Configuração Padrão
      </div>

      <PageHeader
        title="Config. padrão"
        subtitle="Taxas e adquirentes aplicados automaticamente a novos sellers no cadastro."
        right={
          <Btn
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={load}
          >
            Atualizar
          </Btn>
        }
      />

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 13,
            color: isError ? C.error : C.green,
            background: isError ? "rgba(229,72,77,0.08)" : "rgba(45,134,89,0.08)",
            border: `1px solid ${isError ? "rgba(229,72,77,0.20)" : "rgba(45,134,89,0.20)"}`,
          }}
        >
          {feedback}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>
          Carregando...
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>

          {/* ── PIX ── */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(45,134,89,0.12)",
                  border: "1px solid rgba(45,134,89,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.green,
                }}
              >
                <Percent size={15} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>Taxas PIX</div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <SplitRow
                label="Entrada (PIX In)"
                accent={C.green}
                fixedKey="pixInFixed"
                pctKey="pixInPct"
                form={form}
                onChange={onChange}
                isMobile={isMobile}
              />
              <SplitRow
                label="Saída (PIX Out)"
                accent={C.gold}
                fixedKey="pixOutFixed"
                pctKey="pixOutPct"
                form={form}
                onChange={onChange}
                isMobile={isMobile}
              />
            </div>
          </Card>

          {/* ── CRIPTO ── */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(129,182,28,0.10)",
                  border: "1px solid rgba(129,182,28,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.gold,
                }}
              >
                <Percent size={15} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>Taxas Cripto</div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <SplitRow
                label="Entrada (Cripto In)"
                accent={C.green}
                fixedKey="cryptoInFixed"
                pctKey="cryptoInPct"
                form={form}
                onChange={onChange}
                isMobile={isMobile}
              />
              <SplitRow
                label="Saída (Cripto Out)"
                accent={C.gold}
                fixedKey="cryptoOutFixed"
                pctKey="cryptoOutPct"
                form={form}
                onChange={onChange}
                isMobile={isMobile}
              />
            </div>
          </Card>

          {/* ── RETENÇÃO ── */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(129,182,28,0.10)",
                  border: "1px solid rgba(129,182,28,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.gold,
                }}
              >
                <Percent size={15} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>Retenção padrão</div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Dias de retenção</div>
                <input
                  type="number"
                  min="0"
                  value={form.retentionDays}
                  onChange={(e) => onChange("retentionDays", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Percentual retido (%)</div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.retentionPct}
                  onChange={(e) => onChange("retentionPct", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </Card>

          {/* ── ADQUIRENTES ── */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(45,134,89,0.12)",
                  border: "1px solid rgba(45,134,89,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.green,
                }}
              >
                <Landmark size={15} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>Adquirentes padrão</div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Adquirente de cobrança</div>
                <select
                  value={form.chargeProvider}
                  onChange={(e) => onChange("chargeProvider", e.target.value)}
                  style={selectStyle}
                >
                  {providers.map((p, i) => (
                    <option key={p.value || `cp-${i}`} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Adquirente de saque</div>
                <select
                  value={form.cashoutProvider}
                  onChange={(e) => onChange("cashoutProvider", e.target.value)}
                  style={selectStyle}
                >
                  {providers.map((p, i) => (
                    <option key={p.value || `co-${i}`} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              padding: "10px 0",
            }}
          >
            {updatedAt ? (
              <div style={{ fontSize: 12, color: C.muted }}>
                Última atualização: {fmtDate(updatedAt)}
              </div>
            ) : <div />}

            <Btn
              onClick={handleSave}
              disabled={saving}
              icon={<Settings size={14} />}
              style={{ minWidth: 220 }}
            >
              {saving ? "Salvando..." : "Salvar configuração padrão"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
