import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  QrCode, Zap, Clock, Copy, Check, CheckCircle2, AlertCircle, Shield, Link, ExternalLink,
} from "lucide-react";
import C from "../constants/colors";
import api from "../services/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Btn from "../components/ui/Btn";
import PageHeader from "../components/ui/PageHeader";

const coinOptions = [
  { value: "USDT_TRC20", label: "USDT / TRC-20" },
  { value: "USDT_ERC20", label: "USDT / ERC-20" },
  { value: "USDT_BEP20", label: "USDT / BEP-20" },
  { value: "BTC",        label: "Bitcoin (BTC)"  },
  { value: "ETH",        label: "Ethereum (ETH)" },
];

const PRESETS = ["50", "100", "500", "1000", "5000"];

function resolveCoin(value) {
  const map = {
    USDT_TRC20: { coin: "USDT", network: "TRC20" },
    USDT_ERC20: { coin: "USDT", network: "ERC20" },
    USDT_BEP20: { coin: "USDT", network: "BEP20" },
    BTC:        { coin: "BTC",  network: ""       },
    ETH:        { coin: "ETH",  network: ""       },
  };
  return map[value] || { coin: "", network: "" };
}

function fmtBRL(value = 0) {
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function formatCountdown(expiresAt) {
  if (!expiresAt) return "–";
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

function InfoPanel({ step, valor, amountCrypto, payCurrency, network, txStatus }) {
  const valorNum      = parseFloat(valor || 0);
  const isApproved    = txStatus === "approved";
  const isExpiredInfo = txStatus === "expired" || txStatus === "cancelled";
  const isFailedInfo  = txStatus === "failed";
  const currencyLabel = payCurrency ? payCurrency.toUpperCase() : "–";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {step === 2 && (
        <Card style={{ padding: "16px 18px" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
            textTransform: "uppercase", color: C.dim, marginBottom: 12,
          }}>
            Resumo da cobrança
          </div>
          {[
            { k: "Valor em BRL",    v: `R$ ${fmtBRL(valorNum)}` },
            { k: "Valor em cripto", v: amountCrypto ? `${amountCrypto} ${currencyLabel}` : "–", highlight: true },
            { k: "Rede",            v: network || "–" },
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

      <Card style={{ padding: "16px 18px" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
          textTransform: "uppercase", color: C.dim, marginBottom: 12,
        }}>
          Como funciona
        </div>
        <InfoStep n={1} text="Selecione o valor e a moeda/rede desejada" />
        <InfoStep n={2} text="Compartilhe o endereço ou QR Code com o pagador" />
        <InfoStep n={3} text="O pagador envia o valor exato em cripto" />
        <InfoStep n={4} text="Após confirmação na rede, o saldo é creditado" />
      </Card>

      <Card style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Clock size={14} color={C.muted} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 4 }}>
              Confirmação em minutos
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Pagamentos cripto dependem de confirmações na blockchain.
              Tempo médio: 1 a 30 minutos conforme a rede.
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Shield size={14} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 4 }}>
              Pagamento imutável
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Transações em blockchain são irreversíveis. Cada cobrança gera um endereço único com validade de 24h.
            </div>
          </div>
        </div>
      </Card>

      {step === 2 && (
        <Card style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isApproved ? (
              <>
                <CheckCircle2 size={16} color={C.green} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Pagamento aprovado</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Saldo creditado na conta</div>
                </div>
              </>
            ) : isExpiredInfo ? (
              <>
                <AlertCircle size={16} color={C.muted} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Cobrança expirada</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Gere uma nova cobrança</div>
                </div>
              </>
            ) : isFailedInfo ? (
              <>
                <AlertCircle size={16} color={C.error} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.error }}>Pagamento falhou</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Tente gerar uma nova cobrança</div>
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
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Monitorando em tempo real</div>
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

export default function CriarCriptoPage({ onBack, isMobile }) {
  const { refreshWallet, refreshProfile } = useAuth();
  const [step, setStep]             = useState(1);
  const [valor, setValor]           = useState("");
  const [desc, setDesc]             = useState("");
  const [coinOption, setCoinOption] = useState("USDT_TRC20");

  const [copied,     setCopied]     = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const [address,      setAddress]      = useState("");
  const [txId,         setTxId]         = useState("");
  const [txStatus,     setTxStatus]     = useState("pending");
  const [expiresAt,    setExpiresAt]    = useState("");
  const [amountCrypto, setAmountCrypto] = useState(0);
  const [payCurrency,  setPayCurrency]  = useState("");
  const [network,      setNetwork]      = useState("");
  const [countdown,    setCountdown]    = useState("");

  const valorNum       = parseFloat(valor || 0);
  const valorFormatado = fmtBRL(valorNum);
  const isApproved     = txStatus === "approved";
  const isExpired      = txStatus === "expired" || txStatus === "cancelled";
  const isFailed       = txStatus === "failed";

  async function handleGerarCobranca() {
    setError("");
    setLoading(true);
    try {
      const { coin, network: net } = resolveCoin(coinOption);
      const { data } = await api.post("/transactions/create/crypto", {
        amount: valorNum,
        coin,
        network: net,
        description: desc,
        customer: { name: "Cliente", email: "cliente@email.com", phone: "11999999999", document: "00000000000" },
        postback: `${window.location.origin}/webhook`,
      });
      if (data.status && data.transaction) {
        setAddress(data.charge?.address || "");
        setTxId(data.transaction?.id || data.transactionId || "");
        setTxStatus(data.transaction?.status || "pending");
        setExpiresAt(data.transaction?.crypto?.expiresAt || data.transaction?.expiresAt || "");
        setAmountCrypto(data.charge?.amountCrypto || 0);
        setPayCurrency(data.charge?.payCurrency || "");
        setNetwork(data.charge?.network || net || "");
        setStep(2);
      } else {
        setError(data.msg || "Erro ao gerar cobrança cripto.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
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
        if (data?.crypto?.payAddress) setAddress(data.crypto.payAddress);
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
    setStep(1); setAddress(""); setTxId(""); setTxStatus("pending");
    setExpiresAt(""); setAmountCrypto(0); setPayCurrency(""); setNetwork("");
    setValor(""); setDesc(""); setError(""); setCountdown("");
  }

  const sharedInfoPanelProps = { step, valor, amountCrypto, payCurrency, network, txStatus };

  const twoCol = (leftContent) => (
    <div>
      <PageHeader
        title={step === 1 ? "Criar Cobrança Cripto" : "Cobrança Cripto gerada"}
        subtitle={step === 1
          ? "Gere um endereço para receber pagamentos em criptomoeda"
          : isApproved ? "Pagamento confirmado"
          : isExpired ? "Cobrança expirada"
          : isFailed ? "Pagamento não concluído"
          : "Aguardando confirmação na blockchain"
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
        <div>{leftContent}</div>
        {!isMobile && <InfoPanel {...sharedInfoPanelProps} />}
      </div>

      {isMobile && <InfoPanel {...sharedInfoPanelProps} />}
    </div>
  );

  // ── STEP 2: endereço + detalhes ──────────────────────────────────────────────
  if (step === 2) return twoCol(
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 16,
        alignItems: "start",
        marginBottom: 16,
      }}>
        <Card style={{ textAlign: "center", padding: "20px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 3, letterSpacing: "-0.025em" }}>
            R$ {valorFormatado}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
            {isApproved ? "Pago" : isExpired ? "Expirada" : isFailed ? "Falhou" : `Expira em ${countdown || "24h"}`}
          </div>

          <div style={{
            width: 156, height: 156, margin: "0 auto 14px",
            background: "#fff", borderRadius: 10, padding: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(address)}`}
              alt="QR Code Cripto"
              style={{ width: 140, height: 140, borderRadius: 5 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isApproved ? (
              <>
                <CheckCircle2 size={12} color={C.green} />
                <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Aprovado</span>
              </>
            ) : isExpired ? (
              <>
                <AlertCircle size={12} color={C.muted} />
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Expirada</span>
              </>
            ) : isFailed ? (
              <>
                <AlertCircle size={12} color={C.error} />
                <span style={{ fontSize: 11, color: C.error, fontWeight: 600 }}>Falhou</span>
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

        <div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(address);
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
              {address ? `${address.slice(0, 48)}...` : "Endereço indisponível"}
            </span>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              color: copied ? C.green : C.muted, fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar"}
            </div>
          </button>

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

      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Detalhes da transação
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {[
            { k: "Valor BRL",    v: `R$ ${valorFormatado}` },
            { k: "Valor cripto", v: amountCrypto ? `${amountCrypto} ${payCurrency?.toUpperCase() || ""}` : "–" },
            { k: "Moeda",        v: payCurrency?.toUpperCase() || "–" },
            { k: "Rede",         v: network || "–" },
            { k: "Descrição",    v: desc || "–" },
            { k: "TX ID",        v: txId || "–" },
          ].map((r) => (
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

  // ── STEP 1: form ─────────────────────────────────────────────────────────────
  return twoCol(
    <div>
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

      <Select
        label="Moeda / Rede"
        value={coinOption}
        onChange={e => setCoinOption(e.target.value)}
        options={coinOptions}
      />

      <Input
        label="Descrição (opcional)"
        placeholder="Ex: Pedido #1234, serviço prestado..."
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />

      <div style={{
        display: "flex", gap: 8, alignItems: "flex-start",
        background: "rgba(45,134,89,0.05)", border: "1px solid rgba(45,134,89,0.12)",
        borderRadius: 10, padding: "11px 14px", marginBottom: 20,
      }}>
        <Zap size={13} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Envie o valor exato indicado. A cobrança expira em 24h após a geração do endereço.
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
        onClick={handleGerarCobranca}
        disabled={!valor || valorNum <= 0 || loading}
        icon={<QrCode size={16} />}
      >
        {loading ? "Gerando..." : "Gerar Cobrança Cripto"}
      </Btn>
    </div>
  );
}
