import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, CheckCircle2,
  AlertCircle, Eye, EyeOff, Copy, Check,
} from "lucide-react";
import C from "../../../constants/colors";
import useIntegrations from "../../../hooks/useIntegrations";
import { INTEGRATIONS, getCategoryLabel } from "./integrationsData";

// ─── Toggle switch ─────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 44, height: 24,
        borderRadius: 99,
        background: value ? C.green : "rgba(255,255,255,0.1)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: "absolute",
        top: 3, left: value ? 23 : 3,
        width: 18, height: 18,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ─── Campo de integração ───────────────────────────────────────────────────
function IntegrationField({ field, value, onChange, saved }) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isSecret = field.key.toLowerCase().includes("token") ||
                   field.key.toLowerCase().includes("secret") ||
                   field.key.toLowerCase().includes("apikey") ||
                   field.key.toLowerCase().includes("api_key");

  const inputType = isSecret && !showPass ? "password" : "text";

  // Validação em tempo real
  const isInvalid = field.pattern && value && !field.pattern.test(value);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
      }}>
        <label style={{
          fontSize: 12,
          fontWeight: 700,
          color: focused ? C.light : C.muted,
          letterSpacing: "0.01em",
          transition: "color 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}>
          {field.label}
          {field.required === false && (
            <span style={{
              fontSize: 10, color: C.dim,
              background: "rgba(255,255,255,0.05)",
              padding: "1px 6px", borderRadius: 99,
              fontWeight: 500,
            }}>
              opcional
            </span>
          )}
        </label>
        {saved && value && !isInvalid && (
          <CheckCircle2 size={13} color={C.green} />
        )}
      </div>

      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: C.card,
            border: `1px solid ${
              isInvalid
                ? C.error + "80"
                : focused
                  ? C.borderStrong
                  : C.border
            }`,
            borderRadius: 10,
            padding: isSecret ? "11px 40px 11px 14px" : "11px 14px",
            color: C.white,
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
            boxShadow: focused && !isInvalid
              ? "0 0 0 3px rgba(45,134,89,0.10)"
              : isInvalid
                ? "0 0 0 3px rgba(229,72,77,0.10)"
                : "none",
          }}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: "absolute",
              right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              padding: 0,
            }}
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>

      {isInvalid && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          marginTop: 5, color: C.error, fontSize: 11,
        }}>
          <AlertCircle size={11} /> {field.patternHint}
        </div>
      )}

      {field.hint && !isInvalid && (
        <div style={{ fontSize: 11, color: C.dim, marginTop: 5, lineHeight: 1.5 }}>
          {field.hint}
        </div>
      )}
    </div>
  );
}

// ─── Passo numerado ────────────────────────────────────────────────────────
function Step({ number, text }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 24, height: 24, flexShrink: 0,
        borderRadius: "50%",
        background: C.cardSoft,
        border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: C.muted,
      }}>
        {number}
      </div>
      <div style={{ fontSize: 13, color: C.light, lineHeight: 1.6, paddingTop: 3 }}>
        {text}
      </div>
    </div>
  );
}

// ─── Seção com título ──────────────────────────────────────────────────────
function Section({ title, children, style: extraStyle }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "20px 22px",
      marginBottom: 14,
      ...extraStyle,
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 800,
        color: C.muted,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── CopyBox ───────────────────────────────────────────────────────────────
function CopyBox({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>
          {label}
        </div>
      )}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        background: C.cardSoft,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: "hidden",
      }}>
        <code style={{
          flex: 1,
          fontSize: 11,
          color: C.light,
          padding: "9px 12px",
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {value}
        </code>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "none",
            borderLeft: `1px solid ${C.border}`,
            cursor: "pointer",
            padding: "9px 12px",
            color: copied ? C.green : C.muted,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontFamily: "inherit",
            fontWeight: 600,
            transition: "color 0.15s",
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

// ─── Eventos enviados (informativo) ───────────────────────────────────────
const EVENT_MAP = {
  gtm:          ["page_view", "checkout_started", "purchase", "payment_pending", "payment_failed"],
  ga4:          ["page_view", "begin_checkout", "purchase", "add_payment_info"],
  clarity:      ["page_view", "session_start"],
  hotjar:       ["page_view", "checkout_started", "purchase"],
  meta:         ["PageView", "InitiateCheckout", "AddPaymentInfo", "Purchase"],
  google_ads:   ["conversion — purchase"],
  tiktok:       ["PageView", "InitiateCheckout", "AddPaymentInfo", "CompletePayment"],
  pinterest:    ["pagevisit", "checkout", "custom — purchase"],
  merchant:     ["product_sync"],
  search_console: ["sitemap_ping"],
  n8n:          ["order.created", "order.paid", "order.refunded", "order.expired"],
  zapier:       ["order.created", "order.paid", "order.refunded", "order.expired"],
  make:         ["order.created", "order.paid", "order.refunded", "order.expired"],
  stape:        ["todos os eventos via server-side container"],
  utmfy:        ["order.created com UTM params"],
};

// ─── Página de detalhe ─────────────────────────────────────────────────────
export default function IntegracaoDetalhe({ isMobile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getIntegration, saveIntegration } = useIntegrations();

  const integration = INTEGRATIONS.find((i) => i.id === id);

  const stored = getIntegration(id);
  const [fields, setFields]   = useState(stored.fields ?? {});
  const [enabled, setEnabled] = useState(stored.enabled ?? false);
  const [saved, setSaved]     = useState(false);
  const [dirty, setDirty]     = useState(false);

  useEffect(() => {
    if (!integration) navigate("/configuracoes/integracoes");
  }, [integration, navigate]);

  if (!integration) return null;

  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setDirty(true);
  };

  const hasRequiredFields = integration.fields
    .filter((f) => f.required !== false)
    .every((f) => String(fields[f.key] ?? "").trim() !== "");

  const hasInvalidField = integration.fields.some(
    (f) => fields[f.key] && f.pattern && !f.pattern.test(fields[f.key])
  );

  const handleSave = () => {
    if (!hasRequiredFields || hasInvalidField) return;
    saveIntegration(id, fields, enabled);
    setSaved(true);
    setDirty(false);
  };

  const handleToggle = (val) => {
    setEnabled(val);
    setSaved(false);
    setDirty(true);
  };

  const events = EVENT_MAP[id] ?? [];

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Cabeçalho com back */}
      <div style={{ marginBottom: 22 }}>
        <button
          onClick={() => navigate("/integracoes")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontSize: 13,
            fontFamily: "inherit",
            padding: 0,
            marginBottom: 16,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          <ArrowLeft size={14} />
          Voltar para Integrações
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            {/* Dot colorido com nome */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: integration.color,
                boxShadow: `0 0 8px ${integration.color}60`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                {getCategoryLabel(integration.category)}
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: "-0.02em", margin: 0 }}>
              {integration.name}
            </h1>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6, maxWidth: 480 }}>
              {integration.description}
            </p>
          </div>

          {/* Toggle ativar / desativar */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}>
            <Toggle
              value={enabled}
              onChange={handleToggle}
            />
            <span style={{ fontSize: 10, color: enabled ? C.greenBright : C.dim, fontWeight: 600 }}>
              {enabled ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
      </div>

      {/* Campos de configuração */}
      <Section title="Configuração">
        {integration.fields.map((field) => (
          <IntegrationField
            key={field.key}
            field={field}
            value={fields[field.key] ?? ""}
            onChange={(v) => handleFieldChange(field.key, v)}
            saved={saved}
          />
        ))}

        {/* Botão salvar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={!dirty || !hasRequiredFields || hasInvalidField}
            style={{
              background: dirty && hasRequiredFields && !hasInvalidField
                ? `linear-gradient(135deg, ${C.green}, ${C.greenBright})`
                : C.cardSoft,
              color: dirty && hasRequiredFields && !hasInvalidField ? "#fff" : C.dim,
              border: "none",
              borderRadius: 10,
              padding: "11px 22px",
              fontSize: 13,
              fontWeight: 700,
              cursor: dirty && hasRequiredFields && !hasInvalidField ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            Salvar configuração
          </button>

          {saved && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.green, fontSize: 12, fontWeight: 600 }}>
              <CheckCircle2 size={13} />
              Salvo
            </div>
          )}
        </div>
      </Section>

      {/* Passos de configuração */}
      <Section title="Como configurar">
        {integration.steps.map((step, i) => (
          <Step key={i} number={i + 1} text={step} />
        ))}
      </Section>

      {/* Eventos enviados */}
      {events.length > 0 && (
        <Section title="Eventos enviados pela plataforma">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {events.map((ev) => (
              <code key={ev} style={{
                fontSize: 11,
                background: C.cardSoft,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "4px 9px",
                color: C.light,
                fontFamily: "monospace",
              }}>
                {ev}
              </code>
            ))}
          </div>
          <p style={{ fontSize: 11, color: C.dim, marginTop: 10, lineHeight: 1.5 }}>
            Estes eventos são disparados automaticamente nas páginas de checkout quando a integração está ativa.
          </p>
        </Section>
      )}

      {/* Webhook info para automações */}
      {["n8n", "zapier", "make"].includes(id) && (
        <Section title="Payload enviado (exemplo)">
          <CopyBox
            label="Evento: order.paid"
            value={JSON.stringify({
              event: "order.paid",
              orderId: "ord_xxxxxxxxxxxx",
              productName: "Produto Exemplo",
              amount: 9700,
              currency: "BRL",
              customer: { name: "João Silva", email: "joao@email.com" },
              paidAt: new Date().toISOString(),
              utms: { source: "google", medium: "cpc", campaign: "black-friday" },
            }, null, 2)}
          />
          <p style={{ fontSize: 11, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>
            O payload completo inclui todos os campos de UTM capturados no checkout.
          </p>
        </Section>
      )}

      {/* Documentação */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.light, marginBottom: 2 }}>
            Documentação oficial
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {integration.docsLabel}
          </div>
        </div>
        <a
          href={integration.docs}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: C.greenBright,
            textDecoration: "none",
            padding: "8px 14px",
            background: C.green + "14",
            borderRadius: 8,
            border: `1px solid ${C.green}22`,
            transition: "background 0.15s",
          }}
        >
          Abrir <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
