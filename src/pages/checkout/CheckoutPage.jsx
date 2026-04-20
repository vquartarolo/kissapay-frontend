/**
 * CheckoutPage — Página pública de checkout
 * Rota: /c/:slug
 * Sem autenticação, sem sidebar, full-screen.
 */

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Lock,
  QrCode,
  Coins,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { getCheckoutPublic } from "../../services/produtos.service";
import CheckoutRenderer from "../../components/checkout/CheckoutRenderer";
import api from "../../services/api";

// ─── Payment API helpers ────────────────────────────────────────────────────

async function createOrder(checkoutId, payload) {
  const { data } = await api.post(`/checkout/pay`, {
    checkoutId,
    ...payload,
  });

  return {
    orderId:        data?.data?.txid || null,
    pixQrCodeImage: data?.data?.pix?.qrCode      || "",
    pixKey:         data?.data?.pix?.copiaECola  || "",
    cryptoAddress:  data?.data?.crypto?.payAddress  || "",
    cryptoAmount:   data?.data?.crypto?.payAmount   || null,
    cryptoCurrency: data?.data?.crypto?.payCurrency || "USDT",
    status:         data?.data?.status    || "pending",
    expiresAt:      data?.data?.expiresAt || null,
  };
}

async function getOrderStatus(orderId) {
  const { data } = await api.get(`/checkout/order/${orderId}`);
  return data;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

function CopyBtn({ text, theme }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 8,
        border: `1px solid ${theme.borderColor}`,
        background: theme.cardColor,
        color: copied ? theme.primaryColor : theme.mutedColor,
        fontSize: 12,
        fontWeight: 700,
        cursor: text ? "pointer" : "not-allowed",
        opacity: text ? 1 : 0.6,
        fontFamily: "inherit",
        transition: "color 0.2s",
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

// ─── Payment pending screen ────────────────────────────────────────────────

function PaymentPending({ order, method, product, theme, onBack, onSuccess }) {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [status, setStatus] = useState(order?.status || "pending");
  const intervalRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (order?.expiresAt) {
      const expireTime = new Date(order.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
      setSecondsLeft(diff);
    }
  }, [order?.expiresAt]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!order?.orderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await getOrderStatus(order.orderId);
        if (res?.status === "paid" || res?.status === "confirmed") {
          clearInterval(pollRef.current);
          setStatus("paid");
          onSuccess?.();
        }
      } catch {
        // ignora erro de polling por enquanto
      }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [order?.orderId, onSuccess]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0;

  if (status === "paid") return null;

  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, padding: "24px 20px 40px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: theme.mutedColor,
            fontSize: 13,
            cursor: "pointer",
            padding: "4px 0",
            marginBottom: 24,
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        <div
          style={{
            background: theme.cardColor,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${theme.borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: theme.textColor,
                }}
              >
                {method === "pix" ? "Pagamento via PIX" : "Pagamento via Cripto"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: theme.mutedColor,
                  marginTop: 2,
                }}
              >
                {product?.name}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: theme.primaryColor,
                  letterSpacing: "-0.03em",
                }}
              >
                {fmtBRL((product?.price || 0) / 100)}
              </div>
            </div>
          </div>

          {!expired && (
            <div
              style={{
                padding: "10px 24px",
                background: `${theme.primaryColor}0D`,
                borderBottom: `1px solid ${theme.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: theme.primaryColor,
              }}
            >
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
              Aguardando pagamento — expira em {mins}:{secs}
            </div>
          )}

          {expired && (
            <div
              style={{
                padding: "10px 24px",
                background: "rgba(220,38,38,0.06)",
                borderBottom: `1px solid ${theme.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#dc2626",
              }}
            >
              <AlertCircle size={13} />
              Tempo expirado — gere um novo pedido
            </div>
          )}

          <div style={{ padding: "24px" }}>
            {method === "pix" ? (
              <>
                {order?.pixQrCodeImage ? (
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <img
                      src={order.pixQrCodeImage}
                      alt="QR Code PIX"
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 12,
                        border: `1px solid ${theme.borderColor}`,
                        background: "#fff",
                        padding: 8,
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 12,
                      border: `1px solid ${theme.borderColor}`,
                      background: theme.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                    }}
                  >
                    <QrCode size={60} color={theme.mutedColor} />
                  </div>
                )}

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: theme.textColor,
                    marginBottom: 8,
                  }}
                >
                  PIX Copia e Cola
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderColor}`,
                    background: theme.bgColor,
                    fontSize: 11,
                    color: theme.mutedColor,
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    marginBottom: 10,
                    lineHeight: 1.6,
                  }}
                >
                  {order?.pixKey || "Chave PIX indisponível"}
                </div>

                <CopyBtn text={order?.pixKey || ""} theme={theme} />

                <div
                  style={{
                    marginTop: 20,
                    fontSize: 12,
                    color: theme.mutedColor,
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: theme.textColor }}>Como pagar:</strong>
                  <ol style={{ paddingLeft: 18, marginTop: 6 }}>
                    <li>Abra o app do seu banco</li>
                    <li>Vá em PIX → "Copia e Cola" ou escaneie o QR Code</li>
                    <li>Cole o código acima e confirme o valor</li>
                    <li>O acesso será liberado automaticamente após a confirmação</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <Coins size={48} color={theme.primaryColor} />
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: theme.textColor,
                    marginBottom: 8,
                  }}
                >
                  Endereço da carteira ({order?.cryptoCurrency || "USDT"})
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderColor}`,
                    background: theme.bgColor,
                    fontSize: 11,
                    color: theme.mutedColor,
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    marginBottom: 10,
                    lineHeight: 1.6,
                  }}
                >
                  {order?.cryptoAddress || "Endereço indisponível"}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <CopyBtn text={order?.cryptoAddress || ""} theme={theme} />
                  {order?.cryptoAmount && (
                    <div style={{ fontSize: 12, color: theme.mutedColor }}>
                      Envie exatamente{" "}
                      <strong style={{ color: theme.textColor }}>
                        {order.cryptoAmount} {order.cryptoCurrency}
                      </strong>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: theme.mutedColor,
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: theme.textColor }}>Atenção:</strong>{" "}
                  Envie o valor exato para o endereço acima. O acesso será liberado após a
                  confirmação na blockchain.
                </div>
              </>
            )}
          </div>

          <div
            style={{
              borderTop: `1px solid ${theme.borderColor}`,
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 11,
              color: theme.mutedColor,
            }}
          >
            <Lock size={11} />
            Pagamento 100% seguro e criptografado
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────

function PaymentSuccess({ product, theme }) {
  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: `${theme.primaryColor}15`,
            border: `2px solid ${theme.primaryColor}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle2 size={36} color={theme.primaryColor} />
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: theme.textColor,
            letterSpacing: "-0.03em",
            marginBottom: 10,
          }}
        >
          Pagamento confirmado!
        </div>

        <div style={{ fontSize: 14, color: theme.mutedColor, lineHeight: 1.7 }}>
          Seu acesso ao <strong style={{ color: theme.textColor }}>{product?.name}</strong> foi
          liberado. Verifique seu e-mail para os próximos passos.
        </div>
      </div>
    </div>
  );
}

// ─── Real checkout form ────────────────────────────────────────────────────

function CheckoutForm({ checkoutId, config, product, theme, onOrder }) {
  const sections = [...(config?.sections || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const paymentSection = sections.find((s) => s.type === "payment");
  const cfg = paymentSection?.config || {};
  const methods = cfg.methods || ["pix"];
  const btnColor = cfg.btnColor || theme.primaryColor;
  const radius = `${theme.btnRadius || 10}px`;

  const [method, setMethod] = useState(methods[0] || "pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (cfg.requireName !== false && !name.trim()) {
      setError("Preencha seu nome completo.");
      return;
    }

    if (cfg.requireEmail !== false && !email.trim()) {
      setError("Preencha seu e-mail.");
      return;
    }

    if (cfg.requireEmail !== false && !email.includes("@")) {
      setError("E-mail inválido.");
      return;
    }

    try {
      setLoading(true);

      const order = await createOrder(checkoutId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        paymentMethod: method,
      });

      onOrder(order, method);
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "Erro ao processar pedido. Tente novamente.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: radius,
    border: `1px solid ${theme.borderColor}`,
    background: theme.cardColor,
    color: theme.textColor,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  function renderPaymentSection() {
    return (
      <div style={{ padding: "20px 24px" }}>
        <div
          style={{
            background: theme.cardColor,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: theme.mutedColor,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 12,
              }}
            >
              Seus dados
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {cfg.requireName !== false && (
                <input
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
              )}

              {cfg.requireEmail !== false && (
                <input
                  placeholder="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />
              )}

              {cfg.requirePhone && (
                <input
                  placeholder="Telefone (WhatsApp)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              )}
            </div>
          </div>

          {methods.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: theme.mutedColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 10,
                }}
              >
                Forma de pagamento
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${methods.length}, 1fr)`,
                  gap: 8,
                }}
              >
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: radius,
                      border:
                        method === m
                          ? `2px solid ${btnColor}`
                          : `1px solid ${theme.borderColor}`,
                      background: method === m ? `${btnColor}10` : theme.bgColor,
                      color: method === m ? btnColor : theme.mutedColor,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {m === "pix" ? <QrCode size={14} /> : <Coins size={14} />}
                    {m === "pix" ? "PIX" : "Cripto"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              padding: "14px",
              borderRadius: radius,
              border: `1px dashed ${theme.borderColor}`,
              background: theme.bgColor,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {method === "pix" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: theme.cardColor,
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QrCode size={40} color={theme.mutedColor} />
                </div>

                <div style={{ fontSize: 12, color: theme.mutedColor }}>
                  QR Code gerado após confirmar
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Coins size={28} color={theme.mutedColor} />
                <div style={{ fontSize: 12, color: theme.mutedColor }}>
                  Endereço de carteira gerado após confirmar
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(220,38,38,0.07)",
                border: "1px solid rgba(220,38,38,0.20)",
                color: "#dc2626",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: radius,
              border: "none",
              background: loading ? `${btnColor}80` : btnColor,
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              boxShadow: loading ? "none" : `0 4px 16px ${btnColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Lock size={14} />
            )}
            {loading ? "Processando..." : cfg.btnText || "Confirmar pagamento"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CheckoutRenderer
        config={config}
        product={product}
        preview={false}
        renderPayment={renderPaymentSection}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { slug } = useParams();
  const [state, setState] = useState("loading");
  const [product, setProduct] = useState(null);
  const [config, setConfig] = useState(null);
  const [order, setOrder] = useState(null);
  const [payMethod, setPayMethod] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getCheckoutPublic(slug);
        // backend returns { checkout: { config, ... }, product }
        const checkout = res.checkout || {};
        setProduct(res.product || null);
        setConfig(checkout.config || { theme: {}, sections: [] });
        setState("form");
      } catch {
        setState("error");
      }
    }

    load();
  }, [slug]);

  const theme = {
    primaryColor: "#2D8659",
    bgColor: "#FFFFFF",
    cardColor: "#F8FAFC",
    textColor: "#0F172A",
    mutedColor: "#64748B",
    borderColor: "#E2E8F0",
    btnRadius: "10",
    ...(config?.theme || {}),
  };

  function handleOrder(newOrder, method) {
    setOrder(newOrder);
    setPayMethod(method);
    setState("pending");
  }

  function handleSuccess() {
    setState("success");
  }

  if (state === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid #E2E8F0",
            borderTopColor: "#2D8659",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <AlertCircle size={40} color="#94A3B8" style={{ marginBottom: 16 }} />
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#0F172A",
            marginBottom: 8,
          }}
        >
          Checkout não encontrado
        </div>
        <div style={{ fontSize: 14, color: "#64748B" }}>
          O link que você acessou é inválido ou este produto não está mais disponível.
        </div>
      </div>
    );
  }

  if (state === "success") {
    return <PaymentSuccess product={product} theme={theme} />;
  }

  if (state === "pending") {
    return (
      <PaymentPending
        order={order}
        method={payMethod}
        product={product}
        theme={theme}
        onBack={() => setState("form")}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <CheckoutForm
          checkoutId={slug}
          config={config}
          product={product}
          theme={theme}
          onOrder={handleOrder}
        />
      </div>
    </div>
  );
}