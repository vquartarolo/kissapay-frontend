import { useState, useCallback } from "react";
import {
  Globe, Plus, Copy, Check, RefreshCw, Trash2,
  CheckCircle2, Clock3, AlertCircle, X, ExternalLink,
  ChevronDown, ChevronUp, ShieldCheck,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import C from "../../constants/colors";

const STORAGE_KEY = "orionpay_domains";

function loadDomains() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDomains(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateVerifyToken(domain) {
  // deterministic token from domain for demo purposes
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return `orion-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pendente", color: "#F5C542", icon: Clock3 },
    verifying: { label: "Verificando", color: "#60A5FA", icon: RefreshCw },
    verified: { label: "Ativo", color: C.green, icon: CheckCircle2 },
    failed: { label: "Falhou", color: "#EF4444", icon: AlertCircle },
  };
  const m = map[status] || map.pending;
  const Icon = m.icon;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        background: `${m.color}14`,
        border: `1px solid ${m.color}28`,
        color: m.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {m.label}
    </div>
  );
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: C.cardSoft,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "8px 10px",
        }}
      >
        <code
          style={{
            flex: 1,
            fontSize: 12,
            color: C.white,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordBreak: "break-all",
            lineHeight: 1.4,
          }}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "none",
            background: copied ? `${C.green}20` : C.cardSoft,
            color: copied ? C.green : C.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

function DnsRecordsPanel({ domain, token }) {
  const subdomain = domain.split(".")[0];
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        padding: "16px",
        background: C.cardSoft,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        marginTop: 12,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: -4 }}>
        Configure os seguintes registros DNS no painel do seu provedor de domínio:
      </div>

      {/* CNAME */}
      <div
        style={{
          padding: "12px 14px",
          background: C.card,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: `${C.green}18`,
              color: C.green,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.06em",
            }}
          >
            CNAME
          </div>
          <span style={{ fontSize: 11, color: C.muted }}>Redireciona o domínio para nossa infraestrutura</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CopyField label="Nome / Host" value={subdomain} />
          <CopyField label="Destino / Valor" value="checkout.orionpay.com" />
        </div>
      </div>

      {/* TXT verificação */}
      <div
        style={{
          padding: "12px 14px",
          background: C.card,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: `#60A5FA18`,
              color: "#60A5FA",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.06em",
            }}
          >
            TXT
          </div>
          <span style={{ fontSize: 11, color: C.muted }}>Verificação de propriedade do domínio</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CopyField label="Nome / Host" value={`_orion-verify.${subdomain}`} />
          <CopyField label="Valor" value={`orion-verify=${token}`} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "10px 12px",
          background: `#F5C54210`,
          border: `1px solid #F5C54228`,
          borderRadius: 8,
          fontSize: 11,
          color: "#F5C542",
          lineHeight: 1.5,
        }}
      >
        <Clock3 size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          A propagação DNS pode levar de <strong>1 minuto a 48 horas</strong> dependendo do provedor.
          Após configurar, clique em "Verificar" para checar o status.
        </span>
      </div>
    </div>
  );
}

function DomainCard({ domain: d, onDelete, onVerify }) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    // Simulate async DNS check (backend will do real lookup)
    await new Promise((r) => setTimeout(r, 1800));
    onVerify(d.id);
    setVerifying(false);
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${d.status === "verified" ? `${C.green}30` : C.border}`,
        borderRadius: 14,
        padding: "16px 20px",
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: d.status === "verified" ? `${C.green}15` : C.cardSoft,
            border: `1px solid ${d.status === "verified" ? `${C.green}28` : C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: d.status === "verified" ? C.green : C.muted,
            flexShrink: 0,
          }}
        >
          {d.status === "verified" ? <ShieldCheck size={16} /> : <Globe size={16} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.white, letterSpacing: "-0.01em" }}>
            {d.domain}
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
            Adicionado em {new Date(d.createdAt).toLocaleDateString("pt-BR")}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <StatusBadge status={d.status} />

          {d.status === "verified" && (
            <a
              href={`https://${d.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir domínio"
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              <ExternalLink size={13} />
            </a>
          )}

          {d.status !== "verified" && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: verifying ? C.dim : C.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: verifying ? "wait" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <RefreshCw size={11} style={{ animation: verifying ? "spin 0.8s linear infinite" : "none" }} />
              {verifying ? "Verificando…" : "Verificar"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Fechar DNS" : "Ver registros DNS"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            onClick={() => onDelete(d.id)}
            title="Remover domínio"
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <DnsRecordsPanel domain={d.domain} token={d.verifyToken} />
      )}
    </div>
  );
}

function AddDomainModal({ onAdd, onClose }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

  function validate(v) {
    if (!v.trim()) return "Informe um domínio";
    if (v.startsWith("http")) return "Não inclua http:// ou https://";
    if (!DOMAIN_RE.test(v.trim())) return "Domínio inválido — ex: pay.meusite.com";
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate(value);
    if (err) { setError(err); return; }
    onAdd(value.trim().toLowerCase());
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.white }}>Adicionar domínio</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              Ex: pay.meuloja.com ou checkout.minhaempresa.com.br
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "none", background: C.cardSoft,
              color: C.muted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 7, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Domínio personalizado
            </div>
            <input
              autoFocus
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              placeholder="pay.meuloja.com.br"
              style={{
                width: "100%",
                padding: "11px 13px",
                borderRadius: 9,
                border: `1px solid ${error ? "#EF4444" : C.border}`,
                background: C.cardSoft,
                color: C.white,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <div style={{ fontSize: 11, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={11} /> {error}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px 14px",
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              borderRadius: 9,
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Após adicionar, você receberá os registros <strong style={{ color: C.white }}>CNAME</strong> e{" "}
            <strong style={{ color: C.white }}>TXT</strong> para configurar no seu provedor de DNS
            (Cloudflare, GoDaddy, Registro.br, etc.).
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: "9px 22px",
                borderRadius: 8,
                border: "none",
                background: C.green,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Adicionar domínio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DominiosPage({ isMobile }) {
  const [domains, setDomains] = useState(() => loadDomains());
  const [showModal, setShowModal] = useState(false);

  const persist = useCallback((list) => {
    setDomains(list);
    saveDomains(list);
  }, []);

  function handleAdd(domain) {
    const newEntry = {
      id: `dom_${Date.now()}`,
      domain,
      status: "pending",
      verifyToken: generateVerifyToken(domain),
      createdAt: new Date().toISOString(),
    };
    const next = [...domains, newEntry];
    persist(next);
    setShowModal(false);
  }

  function handleDelete(id) {
    if (!window.confirm("Remover este domínio?")) return;
    persist(domains.filter((d) => d.id !== id));
  }

  function handleVerify(id) {
    // In production the backend does a real DNS lookup.
    // For now, simulate: toggle between verifying→verified (demo).
    persist(
      domains.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "verified" ? "pending" : "verified" }
          : d
      )
    );
  }

  const verifiedCount = domains.filter((d) => d.status === "verified").length;

  return (
    <div>
      <PageHeader
        title="Domínios"
        subtitle="Conecte domínios personalizados aos seus checkouts"
        action={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 9,
              border: "none",
              background: C.green,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={15} />
            Adicionar domínio
          </button>
        }
      />

      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Total de domínios", value: domains.length },
          { label: "Ativos", value: verifiedCount, color: C.green },
          { label: "Pendentes", value: domains.length - verifiedCount, color: "#F5C542" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "14px 18px",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color || C.white, letterSpacing: "-0.03em" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Domain list */}
      {domains.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: C.dim,
            }}
          >
            <Globe size={24} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 6 }}>
            Nenhum domínio configurado
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Adicione um domínio personalizado para usar nos seus checkouts.
            <br />
            Ex: <code style={{ color: C.green, fontSize: 12 }}>pay.meusite.com.br</code>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 22px",
              borderRadius: 9,
              border: "none",
              background: C.green,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={14} />
            Adicionar primeiro domínio
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {domains.map((d) => (
            <DomainCard
              key={d.id}
              domain={d}
              onDelete={handleDelete}
              onVerify={handleVerify}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      {domains.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: "16px 18px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 800, color: C.white, marginBottom: 6, fontSize: 13 }}>
            Como funciona?
          </div>
          <ol style={{ paddingLeft: 18, display: "grid", gap: 4 }}>
            <li>Adicione o domínio ou subdomínio que deseja usar (ex: <code style={{ color: C.green }}>pay.meusite.com</code>)</li>
            <li>Configure os registros <strong>CNAME</strong> e <strong>TXT</strong> no painel do seu provedor de DNS</li>
            <li>Clique em <strong>Verificar</strong> após a propagação (pode levar até 48h)</li>
            <li>Após verificado, selecione o domínio nas configurações do seu checkout</li>
          </ol>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showModal && (
        <AddDomainModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
