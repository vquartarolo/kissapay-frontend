import { useState, useEffect } from "react";
import {
  Globe, Plus, Copy, Check, RefreshCw, Trash2,
  CheckCircle2, Clock3, AlertCircle, X, ExternalLink,
  ChevronDown, ChevronUp, ShieldCheck,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import C from "../../constants/colors";
import {
  getDomains,
  createDomain,
  verifyDomain as verifyDomainApi,
  deleteDomain as deleteDomainApi,
} from "../../services/domains.service";

/* -------------------------------------------------------
🏷️ Badge de status
-------------------------------------------------------- */
function StatusBadge({ status }) {
  const map = {
    pending:   { label: "Pendente",    color: "#F5C542", icon: Clock3       },
    verifying: { label: "Verificando", color: "#60A5FA", icon: RefreshCw    },
    verified:  { label: "Ativo",       color: C.green,   icon: CheckCircle2 },
    failed:    { label: "Falhou",      color: "#EF4444", icon: AlertCircle  },
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

/* -------------------------------------------------------
📋 Campo com botão de copiar
-------------------------------------------------------- */
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

/* -------------------------------------------------------
✅ Indicador de check DNS inline
Exibe "OK" ou "Falhou" ao lado do tipo de registro.
Só aparece quando checks está disponível (após verificação).
-------------------------------------------------------- */
function CheckIndicator({ ok }) {
  return (
    <div
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        color: ok ? C.green : "#EF4444",
        background: ok ? `${C.green}12` : "#EF444412",
        border: `1px solid ${ok ? C.green : "#EF4444"}28`,
        borderRadius: 4,
        padding: "2px 7px",
      }}
    >
      {ok ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
      {ok ? "OK" : "Falhou"}
    </div>
  );
}

/* -------------------------------------------------------
🌐 Painel de instruções DNS
Recebe campos pré-computados pelo backend.
checks (opcional): { txt, cname } — só presente após verificação.
-------------------------------------------------------- */
function DnsRecordsPanel({ cnameName, cnameTarget, txtName, txtValue, checks }) {
  const hasChecks = checks != null;

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
          border: `1px solid ${hasChecks ? (checks.cname ? `${C.green}40` : "#EF444440") : C.border}`,
          transition: "border-color 0.2s",
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
          {hasChecks && <CheckIndicator ok={checks.cname} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CopyField label="Nome / Host" value={cnameName} />
          <CopyField label="Destino / Valor" value={cnameTarget} />
        </div>
      </div>

      {/* TXT */}
      <div
        style={{
          padding: "12px 14px",
          background: C.card,
          borderRadius: 8,
          border: `1px solid ${hasChecks ? (checks.txt ? `${C.green}40` : "#EF444440") : C.border}`,
          transition: "border-color 0.2s",
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
          {hasChecks && <CheckIndicator ok={checks.txt} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CopyField label="Nome / Host" value={txtName} />
          <CopyField label="Valor" value={txtValue} />
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

/* -------------------------------------------------------
🃏 Card de domínio individual
onVerify(id): async, retorna domínio atualizado via parent
-------------------------------------------------------- */
function DomainCard({ domain: d, onDelete, onVerify }) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null); // erro transiente (rede, cooldown)

  async function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    try {
      await onVerify(d.id);
      // Sucesso: parent atualiza o domínio no state — este componente re-renderiza
    } catch (err) {
      const msg =
        err?.response?.data?.msg ?? "Erro ao verificar domínio. Tente novamente.";
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
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
      {/* Linha principal */}
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
              title="Verificar registros DNS"
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
                opacity: verifying ? 0.65 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <RefreshCw
                size={11}
                style={{ animation: verifying ? "spin 0.8s linear infinite" : "none" }}
              />
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

      {/* Erro transiente (cooldown, rede) — amarelo, não é falha DNS */}
      {verifyError && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "#F5C54210",
            border: "1px solid #F5C54228",
            borderRadius: 8,
            fontSize: 11,
            color: "#F5C542",
            display: "flex",
            alignItems: "center",
            gap: 6,
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={11} style={{ flexShrink: 0 }} />
          {verifyError}
        </div>
      )}

      {/* Erro DNS persistido (status failed) — vermelho, vem do banco */}
      {d.status === "failed" && d.lastVerificationError && !verifyError && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "#EF444410",
            border: "1px solid #EF444428",
            borderRadius: 8,
            fontSize: 11,
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            gap: 6,
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={11} style={{ flexShrink: 0 }} />
          {d.lastVerificationError}
        </div>
      )}

      {expanded && (
        <DnsRecordsPanel
          cnameName={d.cnameName}
          cnameTarget={d.cnameTarget}
          txtName={d.txtName}
          txtValue={d.txtValue}
          checks={d.checks?.txt != null ? d.checks : null}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------
➕ Modal de adição de domínio
-------------------------------------------------------- */
function AddDomainModal({ onAdd, onClose }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

  function validate(v) {
    if (!v.trim()) return "Informe um domínio";
    if (v.startsWith("http")) return "Não inclua http:// ou https://";
    if (!DOMAIN_RE.test(v.trim())) return "Domínio inválido — ex: pay.meusite.com";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate(value);
    if (err) { setError(err); return; }
    setSubmitting(true);
    try {
      await onAdd(value.trim().toLowerCase());
    } catch (apiErr) {
      const msg = apiErr?.response?.data?.msg ?? "Erro ao adicionar domínio. Tente novamente.";
      setError(msg);
      setSubmitting(false);
    }
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
      onClick={(e) => !submitting && e.target === e.currentTarget && onClose()}
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
            disabled={submitting}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "none", background: C.cardSoft,
              color: C.muted, cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: submitting ? 0.5 : 1,
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
              disabled={submitting}
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
                opacity: submitting ? 0.6 : 1,
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
              disabled={submitting}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 22px",
                borderRadius: 8,
                border: "none",
                background: C.green,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 7,
                opacity: submitting ? 0.75 : 1,
              }}
            >
              {submitting && <RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} />}
              {submitting ? "Salvando…" : "Adicionar domínio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
🌐 Página principal de Domínios
-------------------------------------------------------- */
export default function DominiosPage({ isMobile }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    getDomains()
      .then((data) => {
        if (!cancelled) setDomains(data.domains ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Não foi possível carregar os domínios. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function handleAdd(domain) {
    const data = await createDomain(domain);
    setDomains((prev) => [data.domain, ...prev]);
    setShowModal(false);
  }

  async function handleVerify(id) {
    const data = await verifyDomainApi(id); // lança em erro (capturado pelo DomainCard)
    setDomains((prev) =>
      prev.map((d) => (d.id === id ? data.domain : d))
    );
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover este domínio?")) return;
    try {
      await deleteDomainApi(id);
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      const msg = err?.response?.data?.msg ?? "Erro ao remover domínio.";
      alert(msg);
    }
  }

  const verifiedCount = domains.filter((d) => d.status === "verified").length;

  return (
    <div>
      <PageHeader
        title="Domínios"
        subtitle="Conecte domínios personalizados aos seus checkouts"
        right={
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
            {isMobile ? "Adicionar" : "Adicionar domínio"}
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
          { label: "Ativos",    value: verifiedCount,                  color: C.green   },
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
              {loading ? "—" : s.value}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
          <RefreshCw size={22} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>Carregando domínios…</div>
        </div>
      )}

      {/* Erro de carga */}
      {!loading && loadError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            background: C.card,
            border: `1px solid #EF444430`,
            borderRadius: 12,
            color: "#EF4444",
            fontSize: 13,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {loadError}
        </div>
      )}

      {/* Lista ou empty state */}
      {!loading && !loadError && (
        domains.length === 0 ? (
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
        )
      )}

      {/* Info box */}
      {!loading && !loadError && domains.length > 0 && (
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
