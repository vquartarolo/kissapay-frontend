import { useState } from "react";
import {
  AlertCircle, Eye, EyeOff, Copy, RefreshCw, Check,
  Terminal, Webhook, ShieldAlert, Plus,
} from "lucide-react";
import C from "../constants/colors";
import { apiKeys } from "../constants/mockData";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Btn from "../components/ui/Btn";
import PageHeader from "../components/ui/PageHeader";

// ── Status pill ───────────────────────────────────────────────────
function StatusPill({ active }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: active ? "rgba(45,134,89,0.10)" : "rgba(229,72,77,0.10)",
      border: `1px solid ${active ? "rgba(45,134,89,0.2)" : "rgba(229,72,77,0.2)"}`,
      borderRadius: 999, padding: "3px 9px",
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
        background: active ? C.green : C.error,
        boxShadow: active ? `0 0 6px ${C.green}` : "none",
      }} />
      <span style={{ fontSize: 11, color: active ? C.green : C.error, fontWeight: 700 }}>
        {active ? "Ativo" : "Inativo"}
      </span>
    </div>
  );
}

// ── API Key card ──────────────────────────────────────────────────
function ApiKeyCard({ ak }) {
  const [visible, setVisible] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [rotated, setRotated] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(visible ? "pk_live_a8b3f92c1d4e5a6b7c8d9e0f1a2b3c" : ak.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card style={{ padding: "18px 20px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 3 }}>{ak.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>Criado em {ak.created}</div>
        </div>
        <StatusPill active={ak.active} />
      </div>

      {/* key display */}
      <div style={{
        background: C.inputDeep, borderRadius: 9,
        padding: "10px 14px", marginBottom: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
        border: `1px solid rgba(255,255,255,0.04)`,
      }}>
        <span style={{
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 12,
          color: visible ? C.light : C.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          flex: 1,
          letterSpacing: visible ? "0" : "0.12em",
        }}>
          {visible ? "pk_live_a8b3f92c1d4e5a6b7c8d9e0f1a2b3c" : ak.key}
        </span>
        <button
          onClick={() => setVisible(v => !v)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.muted, display: "flex", flexShrink: 0 }}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* actions */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={handleCopy} style={{
          flex: 1, padding: "8px 6px", borderRadius: 8,
          background: copied ? "rgba(45,134,89,0.10)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${copied ? C.green : C.border}`,
          color: copied ? C.green : C.muted,
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          transition: "all 0.15s",
        }}>
          {copied ? <Check size={12}/> : <Copy size={12}/>}
          {copied ? "Copiado" : "Copiar"}
        </button>

        <button onClick={() => { setRotated(true); setTimeout(() => setRotated(false), 800); }} style={{
          flex: 1, padding: "8px 6px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
          color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <RefreshCw size={12} style={{ transform: rotated ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.4s" }} />
          Rotacionar
        </button>

        <button style={{
          flex: 1, padding: "8px 6px", borderRadius: 8,
          background: "rgba(229,72,77,0.05)", border: "1px solid rgba(229,72,77,0.18)",
          color: C.error, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <EyeOff size={12}/>
          Revogar
        </button>
      </div>
    </Card>
  );
}

// ── Webhook event toggle ──────────────────────────────────────────
function EventToggle({ event, enabled, onToggle }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 0", borderBottom: `1px solid ${C.border}`, gap: 16,
    }}>
      <div>
        <div style={{
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 12, color: C.light, marginBottom: 2,
        }}>
          {event.key}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>{event.desc}</div>
      </div>

      {/* toggle */}
      <button
        onClick={onToggle}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: enabled ? C.green : "rgba(255,255,255,0.08)",
          border: "none", cursor: "pointer", position: "relative",
          flexShrink: 0, transition: "background 0.2s",
        }}
      >
        <div style={{
          position: "absolute",
          top: 2, left: enabled ? 20 : 2,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

const WEBHOOK_EVENTS = [
  { key: "payment.confirmed",      desc: "Pagamento confirmado e creditado"           },
  { key: "payment.pending",        desc: "Pagamento aguardando confirmação"           },
  { key: "payment.expired",        desc: "Cobrança expirou sem pagamento"            },
  { key: "withdrawal.completed",   desc: "Saque processado com sucesso"              },
  { key: "withdrawal.failed",      desc: "Saque falhou ou foi rejeitado"             },
];

export default function ApiKeysPage({ isMobile }) {
  const [webhook, setWebhook] = useState("https://meusite.com/webhook/orionpay");
  const [events, setEvents]   = useState({ "payment.confirmed": true, "payment.pending": true, "withdrawal.completed": true, "withdrawal.failed": false, "payment.expired": false });

  function toggleEvent(key) {
    setEvents(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle="Gerencie suas chaves de acesso e webhooks para integração"
        right={
          <Btn size="sm" icon={<Plus size={14}/>} onClick={() => {}}>
            Nova chave
          </Btn>
        }
      />

      {/* ── security warning ──────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.18)",
        borderRadius: 12, padding: "12px 16px", marginBottom: 24,
      }}>
        <ShieldAlert size={15} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.warn, marginBottom: 3 }}>Segurança das chaves</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Nunca compartilhe suas chaves de API. Trate-as como senhas de alto privilégio. Em caso de comprometimento, revogue imediatamente.
          </div>
        </div>
      </div>

      {/* ── keys section ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Terminal size={14} color={C.muted} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Chaves de acesso</span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: C.muted,
            background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
            borderRadius: 999, padding: "2px 8px",
          }}>{apiKeys.length} ativas</span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 14, marginBottom: 24,
        }}>
          {apiKeys.map(ak => <ApiKeyCard key={ak.id} ak={ak} />)}
        </div>
      </div>

      {/* ── webhook section ───────────────────────────────────────── */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Webhook size={14} color={C.muted} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Webhook</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          Receba notificações em tempo real para eventos de pagamento e saque.
        </div>

        <Input
          label="URL do endpoint"
          value={webhook}
          onChange={e => setWebhook(e.target.value)}
          hint="O endpoint deve aceitar requisições POST com payload JSON e responder com HTTP 200."
        />

        <div style={{ marginBottom: 6, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Eventos
          </div>
          {WEBHOOK_EVENTS.map((ev, i) => (
            <EventToggle
              key={ev.key}
              event={ev}
              enabled={!!events[ev.key]}
              onToggle={() => toggleEvent(ev.key)}
            />
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Btn fullWidth onClick={() => {}}>Salvar configurações</Btn>
        </div>
      </Card>

      {/* ── docs hint ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, marginTop: 16,
        background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "12px 16px",
      }}>
        <AlertCircle size={13} color={C.dim} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
          Consulte a documentação da API OrionPay para guias de integração, exemplos de payload e referências de autenticação.
        </span>
      </div>
    </div>
  );
}
