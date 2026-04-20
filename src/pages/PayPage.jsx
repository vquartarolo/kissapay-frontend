import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Copy, Check, CheckCircle2, Shield, AlertCircle } from "lucide-react";
import C from "../constants/colors";
import Card from "../components/ui/Card";

const API_URL = import.meta.env.VITE_API_URL || "";

function fmtBRL(value = 0) {
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function formatCountdown(expiresAt) {
  if (!expiresAt) return "–";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function PayPage() {
  const { id } = useParams();
  const [tx, setTx]           = useState(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [countdown, setCountdown] = useState("");

  async function fetchTx() {
    try {
      const { data } = await axios.get(`${API_URL}/api/transactions/public/${id}`);
      setTx(data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.msg || "Cobrança não encontrada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    fetchTx();
  }, [id]);

  useEffect(() => {
    if (!tx || tx.status !== "pending") return;
    const interval = setInterval(fetchTx, 5000);
    return () => clearInterval(interval);
  }, [tx?.status]);

  useEffect(() => {
    const expiresAt = tx?.crypto?.expiresAt || tx?.pix?.expiresAt || tx?.expiresAt;
    if (!expiresAt || !tx || tx.status !== "pending") { setCountdown(""); return; }
    const timer = setInterval(() => setCountdown(formatCountdown(expiresAt)), 1000);
    setCountdown(formatCountdown(expiresAt));
    return () => clearInterval(timer);
  }, [tx?.expiresAt, tx?.crypto?.expiresAt, tx?.status]);

  const isApproved = tx?.status === "approved";
  const isExpired  = tx?.status === "expired" || tx?.status === "cancelled";
  const address    = tx?.crypto?.payAddress || "";
  const payAmount  = tx?.crypto?.payAmount  || 0;
  const payCurrency = (tx?.crypto?.payCurrency || "").toUpperCase();
  const network    = tx?.crypto?.network    || "";
  const pixCode    = tx?.pix?.qrCodeText   || "";
  const isPix      = tx?.method === "pix";
  const qrData     = isPix ? pixCode : address;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px 60px",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: C.white,
    }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: "-0.025em" }}>
          OrionPay
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          {isApproved ? "Pagamento confirmado" : isExpired ? "Cobrança expirada" : "Aguardando pagamento"}
        </div>
      </div>

      {loading && (
        <div style={{ color: C.muted, fontSize: 14 }}>Carregando cobrança...</div>
      )}

      {error && !loading && (
        <Card style={{ padding: "20px 24px", maxWidth: 420, width: "100%" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <AlertCircle size={16} color="#e5484d" />
            <span style={{ fontSize: 14, color: C.white }}>{error}</span>
          </div>
        </Card>
      )}

      {tx && !loading && (
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* QR + valor */}
          <Card style={{ textAlign: "center", padding: "24px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 4, letterSpacing: "-0.025em" }}>
              R$ {fmtBRL(tx.amount)}
            </div>

            {payAmount > 0 && (
              <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 4 }}>
                {payAmount} {payCurrency}
              </div>
            )}

            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>
              {isApproved ? "Pago" : isExpired ? "Expirado" : `Expira em ${countdown || "24h"}`}
            </div>

            {qrData && !isExpired && (
              <div style={{
                width: 176, height: 176, margin: "0 auto 20px",
                background: "#fff", borderRadius: 12, padding: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`}
                  alt="QR Code"
                  style={{ width: 160, height: 160, borderRadius: 6 }}
                />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {isApproved ? (
                <>
                  <CheckCircle2 size={14} color={C.green} />
                  <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>Aprovado</span>
                </>
              ) : isExpired ? (
                <span style={{ fontSize: 12, color: C.muted }}>Esta cobrança expirou</span>
              ) : (
                <>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.warn,
                    animation: "pulse 1.5s infinite",
                  }} />
                  <span style={{ fontSize: 12, color: C.muted }}>Aguardando</span>
                </>
              )}
            </div>
          </Card>

          {/* PIX: bloco premium código + botão */}
          {isPix && qrData && !isExpired && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: C.dim,
                  letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8,
                }}>
                  Código PIX Copia e Cola
                </div>
                <div style={{
                  fontSize: 12, color: C.muted,
                  fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.7,
                  userSelect: "all",
                }}>
                  {qrData}
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrData);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  width: "100%",
                  background: copied ? "rgba(45,134,89,0.12)" : C.card,
                  border: `1px solid ${copied ? C.green : C.border}`,
                  borderRadius: 10, padding: "13px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  color: copied ? C.green : C.white,
                  fontSize: 14, fontWeight: 700,
                  transition: "all 0.2s", fontFamily: "inherit",
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copiado!" : "Copiar código PIX"}
              </button>
            </div>
          )}

          {/* Cripto: bloco premium endereço + botão */}
          {!isPix && qrData && !isExpired && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: C.dim,
                  letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8,
                }}>
                  Endereço de Pagamento
                </div>
                <div style={{
                  fontSize: 12, color: C.muted,
                  fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.7,
                  userSelect: "all",
                }}>
                  {qrData}
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrData);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  width: "100%",
                  background: copied ? "rgba(45,134,89,0.12)" : C.card,
                  border: `1px solid ${copied ? C.green : C.border}`,
                  borderRadius: 10, padding: "13px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  color: copied ? C.green : C.white,
                  fontSize: 14, fontWeight: 700,
                  transition: "all 0.2s", fontFamily: "inherit",
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copiado!" : "Copiar endereço"}
              </button>
            </div>
          )}

          {/* Detalhes */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.muted,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
            }}>
              Detalhes da cobrança
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              {[
                { k: "Valor BRL",    v: `R$ ${fmtBRL(tx.amount)}` },
                ...(payAmount > 0   ? [{ k: "Valor cripto", v: `${payAmount} ${payCurrency}` }] : []),
                ...(payCurrency     ? [{ k: "Moeda",        v: payCurrency }]                  : []),
                ...(network         ? [{ k: "Rede",         v: network }]                       : []),
                ...(tx.description  ? [{ k: "Descrição",    v: tx.description }]                : []),
                { k: "Status",       v: tx.status },
              ].map((r) => (
                <div key={r.k} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "7px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{r.k}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: C.white,
                    wordBreak: "break-all", textAlign: "right", maxWidth: "55%",
                  }}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Info */}
          <Card style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Shield size={14} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 4 }}>
                  Pagamento seguro
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                  {isPix
                    ? "Escaneie o QR Code ou copie o código PIX para pagar. Disponível 24h, processamento em segundos."
                    : "Envie o valor exato indicado para o endereço acima. Transações blockchain são irreversíveis."}
                </div>
              </div>
            </div>
          </Card>

        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  );
}
