import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  QrCode, Zap, Clock, Copy, Check, CheckCircle2, AlertCircle,
  Shield, Info, ArrowRight, Link, ExternalLink,
} from "lucide-react";
import C from "../constants/colors";
import api from "../services/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Btn from "../components/ui/Btn";
import PageHeader from "../components/ui/PageHeader";

const expOptions = [
  { value: "15",   label: "15 minutos" },
  { value: "30",   label: "30 minutos" },
  { value: "60",   label: "1 hora"     },
  { value: "1440", label: "24 horas"   },
];

const PRESETS = ["50", "100", "500", "1000", "5000"];

function fmtBRL(value = 0) {
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function formatCountdown(expiresAt) {
  if (!expiresAt) return "—";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function InfoStep({ n, text }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: "rgba(45,134,89,0.12)",
        border: "1px solid rgba(45,134,89,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, color: C.green,
      }}>{n}</div>
      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, paddingTop: 1 }}>{text}</span>
    </div>
  );
}

// Right-side contextual panel — always visible regardless of step
function InfoPanel({ step, valor, fee, netAmount, exp, txId, txStatus }) {
  const valorNum = parseFloat(valor || 0);
  const estimatedFee = valorNum > 0 ? (valorNum * 0.012).toFixed(2) : null;
  const estimatedNet = valorNum > 0 ? (valorNum - valorNum * 0.012).toFixed(2) : null;
  const isApproved = txStatus === "approved";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {step === 2 && (
        <Card style={{ padding: "16px 18px" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
            textTransform: "uppercase", color: C.dim, marginBottom: 12,
          }}>
            Resumo financeiro
          </div>
          {[
            { k: "Valor bruto",   v: `R$ ${fmtBRL(step === 2 ? valorNum : valorNum)}` },
            { k: "Taxa (~1,2%)",  v: step === 2 ? `R$ ${fmtBRL(fee)}` : `≈ R$ ${fmtBRL(estimatedFee)}` },
            { k: "Valor líquido", v: step === 2 ? `R$ ${fmtBRL(netAmount)}` : `≈ R$ ${fmtBRL(estimatedNet)}`, highlight: true },
          ].map((r, i, arr) => (
            <div key={r.k} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0",
              borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ fontSize: 12, color: C.muted }}>{r.k}</span>
              <span style={{
                fontSize: 12, fontWeight: r.highlight ? 800 : 600,
                color: r.highlight ? C.green : C.white,
              }}>{r.v}</span>
            </div>
          ))}
        </Card>
      )}

      {/* How it works */}
      <Card style={{ padding: "16px 18px" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
          textTransform: "uppercase", color: C.dim, marginBottom: 12,
        }}>
          Como funciona
        </div>
        <InfoStep n={1} text="Informe o valor e configure o QR Code" />
        <InfoStep n={2} text="Compartilhe o código ou QR Code com o pagador" />
        <InfoStep n={3} text="O pagamento é confirmado em segundos via Pix" />
        <InfoStep n={4} text="O saldo é creditado automaticamente na sua conta" />
      </Card>

      {/* Timing */}
      <Card style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Clock size={14} color={C.muted} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 4 }}>
              Confirmação instantânea
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Pagamentos PIX são processados 24h por dia, 7 dias por semana, incluindo feriados.
              Tempo médio: menos de 5 segundos.
            </div>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Shield size={14} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 4 }}>
              Segurança garantida
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Transações criptografadas pelo Banco Central. Cada QR Code é de uso único e expira automaticamente.
            </div>
          </div>
        </div>
      </Card>

      {/* Status indicator (step 2 only) */}
      {step === 2 && (
        <Card style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isApproved ? (
              <>
                <CheckCircle2 size={16} color={C.green} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Pagamento aprovado</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    Saldo creditado na conta
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.warn,
                  flexShrink: 0, animation: "pulse 1.5s infinite",
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>Aguardando pagamento</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    Monitorando em tempo real
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}

const ADMIN_ROLES = new Set(["admin", "master", "moderator", "super_moderator"]);

export default function CriarPixPage({ onBack, isMobile }) {
  const { user, refreshWallet, refreshProfile } = useAuth();
  const isAdmin = ADMIN_ROLES.has(String(user?.role || ""));
  const [step, setStep] = useState(1);
  const [valor, setValor] = useState("");
  const [desc, setDesc]   = useState("");
  const [exp, setExp]     = useState("30");

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  const [pixCode,   setPixCode]   = useState("");
  const [txId,      setTxId]      = useState("");
  const [txStatus,  setTxStatus]  = useState("pending");
  const [expiresAt, setExpiresAt] = useState("");
  const [netAmount, setNetAmount] = useState(0);
  const [fee,       setFee]       = useState(0);
  const [countdown, setCountdown] = useState("");

  const valorNum = parseFloat(valor || 0);
  const valorFormatado = fmtBRL(valorNum);
  const isApproved = txStatus === "approved";

  async function handleGerarQR() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/transactions/create/pix", {
        amount: valorNum,
        description: desc,
        expiresInMinutes: parseInt(exp, 10),
        customer: { name: "Cliente", email: "cliente@email.com", phone: "11999999999", document: "00000000000" },
        postback: `${window.location.origin}/webhook`,
      });
      if (data.status && data.transaction) {
        setPixCode(data.transaction?.pix?.qrCodeText || data.pix || "");
        setTxId(data.transaction?.id || data.transactionId || "");
        setTxStatus(data.transaction?.status || "pending");
        setExpiresAt(data.transaction?.pix?.expiresAt || "");
        setNetAmount(data.transaction?.netAmount || 0);
        setFee(data.transaction?.fee || 0);
        setStep(2);
      } else {
        setError(data.msg || "Erro ao gerar cobrança PIX.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimularPagamento() {
    if (!txId) return;
    setError("");
    setPaymentLoading(true);
    try {
      const { data } = await api.post(`/transactions/${txId}/pix/simulate-payment`);
      if (data.status) {
        const newStatus = data.transaction?.status || "approved";
        setTxStatus(newStatus);
        if (newStatus === "approved") {
          await Promise.all([refreshWallet(), refreshProfile()]).catch(() => {});
        }
      } else {
        setError(data.msg || "Erro ao simular pagamento.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao simular pagamento.");
    } finally {
      setPaymentLoading(false);
    }
  }

  useEffect(() => {
    if (!txId || step !== 2) return;
    let id;
    async function consultar() {
      try {
        const { data } = await api.get(`/transactions/consult?id=${txId}`);
        if (data?.status) setTxStatus(data.status);
        if (data?.expiresAt) setExpiresAt(data.expiresAt);
        if (data?.pix?.qrCodeText) setPixCode(data.pix.qrCodeText);
        if (data?.status && data.status !== "pending") {
          clearInterval(id);
          if (data.status === "approved") {
            refreshWallet();
            refreshProfile();
          }
        }
      } catch {}
    }
    consultar();
    id = setInterval(consultar, 5000);
    return () => clearInterval(id);
  }, [txId, step]);

  useEffect(() => {
    if (!expiresAt || step !== 2 || txStatus !== "pending") { setCountdown(""); return; }
    const id = setInterval(() => setCountdown(formatCountdown(expiresAt)), 1000);
    setCountdown(formatCountdown(expiresAt));
    return () => clearInterval(id);
  }, [expiresAt, step, txStatus]);

  function resetForm() {
    setStep(1); setPixCode(""); setTxId(""); setTxStatus("pending");
    setExpiresAt(""); setNetAmount(0); setFee(0);
    setValor(""); setDesc(""); setError(""); setCountdown("");
  }

  const sharedInfoPanelProps = { step, valor, fee, netAmount, exp, txId, txStatus };

  // ── 2-column layout wrapper ───────────────────────────────────
  const twoCol = (leftContent) => (
    <div>
      <PageHeader
        title={step === 1 ? "Criar Cobrança PIX" : "Cobrança PIX gerada"}
        subtitle={step === 1
          ? "Gere um QR Code para receber pagamentos instantâneos"
          : isApproved ? "Pagamento confirmado" : "Aguardando confirmação de pagamento"
        }
        back={step === 2}
        onBack={resetForm}
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(340px, 560px) 280px",
        gap: isMobile ? 20 : 28,
        alignItems: "start",
      }}>
        <div style={{ minWidth: 0 }}>{leftContent}</div>

        {/* Right column — always visible */}
        {!isMobile && (
          <InfoPanel {...sharedInfoPanelProps} />
        )}
      </div>

      {/* Mobile: info panel below form */}
      {isMobile && <InfoPanel {...sharedInfoPanelProps} />}
    </div>
  );

  // ── STEP 2: QR + details ──────────────────────────────────────
  if (step === 2) return twoCol(
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 16,
        alignItems: "start",
        marginBottom: 16,
      }}>
        {/* QR card */}
        <Card style={{ textAlign: "center", padding: "20px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 3, letterSpacing: "-0.025em" }}>
            R$ {valorFormatado}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
            {isApproved ? "Pago" : `Expira em ${countdown || `${exp} min`}`}
          </div>

          <div style={{
            width: 156, height: 156, margin: "0 auto 14px",
            background: "#fff", borderRadius: 10, padding: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pixCode)}`}
              alt="QR Code PIX"
              style={{ width: 140, height: 140, borderRadius: 5 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isApproved ? (
              <>
                <CheckCircle2 size={12} color={C.green} />
                <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Aprovado</span>
              </>
            ) : (
              <>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: C.warn,
                  animation: "pulse 1.5s infinite",
                }} />
                <span style={{ fontSize: 11, color: C.muted }}>Aguardando</span>
              </>
            )}
          </div>
        </Card>

        <div style={{ minWidth: 0 }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(pixCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              width: "100%", background: C.card,
              border: `1px solid ${copied ? C.green : C.border}`,
              borderRadius: 10, padding: "11px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14, transition: "border-color 0.2s",
            }}
          >
            <span style={{
              fontSize: 11, color: C.muted,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: "72%", fontFamily: "monospace",
            }}>
              {pixCode ? `${pixCode.slice(0, 48)}...` : "Código indisponível"}
            </span>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              color: copied ? C.green : C.muted, fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar"}
            </div>
          </button>

          {!isApproved && isAdmin && (
            <Btn fullWidth onClick={handleSimularPagamento} disabled={paymentLoading} style={{ marginBottom: 8 }}>
              {paymentLoading ? "Processando..." : "Simular pagamento"}
            </Btn>
          )}
          <Btn variant="outline" fullWidth onClick={resetForm}>
            Nova cobrança
          </Btn>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pay/${txId}`);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              style={{
                flex: 1, background: C.card,
                border: `1px solid ${linkCopied ? C.green : C.border}`,
                borderRadius: 9, padding: "9px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                color: linkCopied ? C.green : C.muted, fontSize: 12, fontWeight: 600,
                transition: "border-color 0.2s",
              }}
            >
              {linkCopied ? <Check size={13} /> : <Link size={13} />}
              {linkCopied ? "Copiado!" : "Copiar link"}
            </button>

            <button
              onClick={() => window.open(`${window.location.origin}/pay/${txId}`, "_blank")}
              style={{
                flex: 1, background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9, padding: "9px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                color: C.muted, fontSize: 12, fontWeight: 600,
              }}
            >
              <ExternalLink size={13} />
              Abrir cobrança
            </button>
          </div>
        </div>
      </div>

      {/* Details row */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Detalhes da transação
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {[
            { k: "Valor bruto",   v: `R$ ${valorFormatado}` },
            { k: "Taxa",          v: `R$ ${fmtBRL(fee)}` },
            { k: "Valor líquido", v: `R$ ${fmtBRL(netAmount)}` },
            { k: "Descrição",     v: desc || "—" },
            { k: "Expiração",     v: `${exp} min` },
            { k: "TX ID",         v: txId || "—" },
          ].map((r, i, arr) => (
            <div key={r.k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 12, color: C.muted }}>{r.k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.white, wordBreak: "break-all", textAlign: "right", maxWidth: "55%" }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div style={{
          background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)",
          borderRadius: 9, padding: "10px 14px", marginTop: 14,
          fontSize: 13, color: C.error, display: "flex", gap: 8,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );

  // ── STEP 1: Form ──────────────────────────────────────────────
  return twoCol(
    <div>
      {/* amount */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Valor</div>
        <div style={{
          display: "flex", alignItems: "center",
          background: C.inputDeep, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px",
        }}>
          <span style={{ color: C.muted, fontSize: 15, marginRight: 8, fontWeight: 600 }}>R$</span>
          <input
            type="number" value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0,00"
            style={{
              background: "none", border: "none", color: C.white,
              fontSize: 26, fontWeight: 800, outline: "none",
              width: "100%", fontFamily: "inherit",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {PRESETS.map(v => (
            <button key={v} onClick={() => setValor(v)} style={{
              padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
              background: valor === v ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${valor === v ? C.green : C.border}`,
              color: valor === v ? C.green : C.muted,
              fontSize: 12, fontWeight: 600,
            }}>R$ {v}</button>
          ))}
        </div>
      </Card>

      <Input
        label="Descrição (opcional)"
        placeholder="Ex: Pedido #1234, serviço prestado..."
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />

      <Select
        label="Expiração do QR Code"
        value={exp}
        onChange={e => setExp(e.target.value)}
        options={expOptions}
      />

      <div style={{
        display: "flex", gap: 8, alignItems: "flex-start",
        background: "rgba(45,134,89,0.05)", border: "1px solid rgba(45,134,89,0.12)",
        borderRadius: 10, padding: "11px 14px", marginBottom: 20,
      }}>
        <Zap size={13} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          O saldo é creditado automaticamente após a confirmação do pagamento.
          Disponível 24h, todos os dias.
        </span>
      </div>

      {error && (
        <div style={{
          background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)",
          borderRadius: 9, padding: "10px 14px", marginBottom: 16,
          fontSize: 13, color: C.error, display: "flex", gap: 8,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      <Btn
        fullWidth
        onClick={handleGerarQR}
        disabled={!valor || valorNum <= 0 || loading}
        icon={<QrCode size={16} />}
      >
        {loading ? "Gerando..." : "Gerar QR Code PIX"}
      </Btn>
    </div>
  );
}
