/**
 * CheckoutRenderer
 * Componente compartilhado entre o Builder (preview) e a página pública.
 * Recebe `config` (checkout config) e `product` (dados do produto).
 */

import { useState } from "react";
import {
  ShieldCheck, Star, CheckCircle2, Lock, QrCode, Coins, ChevronDown,
  Gift, Clock,
} from "lucide-react";

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─── Section renderers ──────────────────────────────────────────

function SectionHeader({ cfg, theme }) {
  const justifyMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };
  const justify = justifyMap[cfg.logoPosition] || "flex-start";

  return (
    <header
      style={{
        background: cfg.bgColor || theme.bgColor,
        borderBottom: cfg.showBorder !== false ? `1px solid ${theme.borderColor}` : "none",
        padding: "14px 24px",
        display: "flex",
        justifyContent: justify,
        alignItems: "center",
        gap: 12,
      }}
    >
      {cfg.logoUrl ? (
        <img
          src={cfg.logoUrl}
          alt={cfg.brandName || "Logo"}
          style={{ height: 36, objectFit: "contain", maxWidth: 140 }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: cfg.textColor || theme.primaryColor,
            letterSpacing: "-0.03em",
          }}
        >
          {cfg.brandName || "Minha Empresa"}
        </div>
      )}
    </header>
  );
}

function SectionProduct({ cfg, product, theme }) {
  const layout = cfg.layout || "left";
  const youtubeId = cfg.showVideo !== false ? getYoutubeId(product?.videoUrl) : null;
  const image = product?.images?.[0];
  const showMedia = layout !== "none" && (image || youtubeId);

  const mediaEl = showMedia && (
    <div
      style={{
        flex: layout === "top" ? undefined : "0 0 45%",
        width: layout === "top" ? "100%" : undefined,
        borderRadius: 12,
        overflow: "hidden",
        background: theme.cardColor,
        border: `1px solid ${theme.borderColor}`,
        aspectRatio: youtubeId ? "16/9" : "4/3",
      }}
    >
      {youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allowFullScreen
        />
      ) : image ? (
        <img
          src={image}
          alt={product?.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
    </div>
  );

  const textEl = (
    <div style={{ flex: 1, minWidth: 0 }}>
      {cfg.badge && (
        <div
          style={{
            display: "inline-block",
            marginBottom: 10,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: `${cfg.badgeColor || theme.primaryColor}18`,
            color: cfg.badgeColor || theme.primaryColor,
            border: `1px solid ${cfg.badgeColor || theme.primaryColor}30`,
          }}
        >
          {cfg.badge}
        </div>
      )}
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: theme.textColor,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          marginBottom: 10,
        }}
      >
        {product?.name || "Nome do Produto"}
      </div>
      {cfg.showDescription !== false && product?.description && (
        <div
          style={{
            fontSize: 14,
            color: theme.mutedColor,
            lineHeight: 1.7,
          }}
        >
          {product.description}
        </div>
      )}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: theme.primaryColor,
            letterSpacing: "-0.04em",
          }}
        >
          {fmtBRL((product?.price || 0) / 100)}
        </span>
        {product?.type === "recurring" && (
          <span style={{ fontSize: 13, color: theme.mutedColor }}>/ mês</span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 24px 0" }}>
      {layout === "top" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mediaEl}
          {textEl}
        </div>
      ) : layout === "right" ? (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {textEl}
          {mediaEl}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {mediaEl}
          {textEl}
        </div>
      )}
    </div>
  );
}

function SectionBenefits({ cfg, theme }) {
  const items = cfg.items || [];
  if (items.length === 0) return null;
  return (
    <div style={{ padding: "20px 24px" }}>
      {cfg.title && (
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.textColor, marginBottom: 14, textAlign: "center" }}>
          {cfg.title}
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: theme.cardColor,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${theme.primaryColor}15`,
                color: theme.primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {item.icon || "✓"}
            </div>
            <div style={{ flex: 1 }}>
              {item.title && (
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.textColor, marginBottom: 2 }}>
                  {item.title}
                </div>
              )}
              {item.desc && (
                <div style={{ fontSize: 12, color: theme.mutedColor, lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionVideo({ cfg, theme }) {
  const url = cfg.videoUrl || cfg.url || "";
  const youtubeId = getYoutubeId(url);
  return (
    <div style={{ padding: "0 24px 20px" }}>
      {cfg.title && (
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.textColor, marginBottom: 10, textAlign: "center" }}>
          {cfg.title}
        </div>
      )}
      {cfg.desc && (
        <div style={{ fontSize: 13, color: theme.mutedColor, marginBottom: 12, textAlign: "center", lineHeight: 1.6 }}>
          {cfg.desc}
        </div>
      )}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${theme.borderColor}`,
          aspectRatio: "16/9",
          background: theme.cardColor,
        }}
      >
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allowFullScreen
            title={cfg.title || "Vídeo"}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 8,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `${theme.primaryColor}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: theme.primaryColor,
            }}>
              ▶
            </div>
            <div style={{ fontSize: 12, color: theme.mutedColor }}>Vídeo</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionOrderBump({ cfg, theme }) {
  const [checked, setChecked] = useState(false);
  const accentColor = cfg.accentColor || "#F59E0B";
  return (
    <div style={{ padding: "0 24px 20px" }}>
      <div
        style={{
          borderRadius: 12,
          border: `2px solid ${accentColor}`,
          background: `${accentColor}08`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: accentColor,
            padding: "8px 16px",
            fontSize: 11,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {cfg.label || "⚡ Oferta especial — adicione ao pedido"}
        </div>
        <div style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          {cfg.image && (
            <img
              src={cfg.image}
              alt={cfg.title}
              style={{
                width: 64, height: 64, objectFit: "cover",
                borderRadius: 8, border: `1px solid ${theme.borderColor}`, flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.textColor, marginBottom: 4 }}>
              {cfg.title || "Produto Complementar"}
            </div>
            {cfg.desc && (
              <div style={{ fontSize: 12, color: theme.mutedColor, lineHeight: 1.5, marginBottom: 8 }}>
                {cfg.desc}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: accentColor }}>
                + {fmtBRL((cfg.price || 0) / 100)}
              </span>
              {cfg.originalPrice > 0 && (
                <span style={{ fontSize: 12, color: theme.mutedColor, textDecoration: "line-through" }}>
                  {fmtBRL(cfg.originalPrice / 100)}
                </span>
              )}
            </div>
          </div>
          <label
            style={{
              display: "flex", alignItems: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: accentColor, cursor: "pointer" }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function SectionCountdown({ cfg, theme }) {
  const timeLeft = calcTimeLeft(cfg.deadline);

  function calcTimeLeft(deadline) {
    if (!deadline) return { h: "00", m: "10", s: "00" };
    const diff = Math.max(0, new Date(deadline) - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return {
      h: String(h).padStart(2, "0"),
      m: String(m).padStart(2, "0"),
      s: String(s).padStart(2, "0"),
    };
  }

  // Use effect only at runtime, skip in preview
  const accentColor = cfg.accentColor || theme.primaryColor;

  return (
    <div style={{ padding: "0 24px 20px" }}>
      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${accentColor}30`,
          background: `${accentColor}08`,
          padding: "18px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
          <Clock size={14} color={accentColor} />
          <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {cfg.title || "Oferta por tempo limitado"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {[
            { val: timeLeft.h, label: "horas" },
            { val: timeLeft.m, label: "min" },
            { val: timeLeft.s, label: "seg" },
          ].map(({ val, label }, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <span style={{ fontSize: 22, fontWeight: 900, color: accentColor }}>:</span>}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: accentColor,
                    letterSpacing: "-0.04em",
                    background: `${accentColor}15`,
                    borderRadius: 8,
                    padding: "4px 12px",
                    minWidth: 56,
                    lineHeight: 1.2,
                  }}
                >
                  {val}
                </div>
                <div style={{ fontSize: 10, color: theme.mutedColor, marginTop: 4, fontWeight: 600 }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
        {cfg.label && (
          <div style={{ fontSize: 12, color: theme.mutedColor, marginTop: 10 }}>
            {cfg.label}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBonus({ cfg, theme }) {
  const items = cfg.items || [];
  if (items.length === 0) return null;
  return (
    <div style={{ padding: "0 24px 20px" }}>
      {cfg.title && (
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.textColor, marginBottom: 14, textAlign: "center" }}>
          {cfg.title}
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: theme.cardColor,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 48, height: 48, borderRadius: 8,
                  background: `${theme.primaryColor}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: theme.primaryColor, flexShrink: 0,
                }}
              >
                <Gift size={20} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.textColor }}>
                {item.title || `Bônus ${i + 1}`}
              </div>
              {item.value > 0 && (
                <div style={{ fontSize: 11, color: theme.mutedColor, marginTop: 2 }}>
                  Valor: <span style={{ textDecoration: "line-through" }}>{fmtBRL(item.value / 100)}</span>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                background: `${theme.primaryColor}15`,
                color: theme.primaryColor,
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              GRÁTIS
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionFaq({ cfg, theme }) {
  const items = cfg.items || [];
  const [openIdx, setOpenIdx] = useState(null);
  if (items.length === 0) return null;
  return (
    <div style={{ padding: "0 24px 20px" }}>
      {cfg.title && (
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.textColor, marginBottom: 14, textAlign: "center" }}>
          {cfg.title}
        </div>
      )}
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              style={{
                borderRadius: 10,
                border: `1px solid ${isOpen ? theme.primaryColor + "40" : theme.borderColor}`,
                background: theme.cardColor,
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "transparent",
                  border: "none",
                  color: theme.textColor,
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "inherit",
                }}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={14}
                  color={theme.mutedColor}
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                />
              </button>
              {isOpen && item.a && (
                <div
                  style={{
                    padding: "0 16px 14px",
                    fontSize: 13,
                    color: theme.mutedColor,
                    lineHeight: 1.65,
                    borderTop: `1px solid ${theme.borderColor}`,
                    paddingTop: 12,
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionPayment({ cfg, theme, preview }) {
  const [method, setMethod] = useState(cfg.methods?.[0] || "pix");
  const methods = cfg.methods || ["pix"];
  const btnColor = cfg.btnColor || theme.primaryColor;
  const radius = `${theme.btnRadius || 10}px`;

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
        {/* Dados do comprador */}
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
              <input placeholder="Nome completo" style={inputStyle} readOnly={preview} />
            )}
            {cfg.requireEmail !== false && (
              <input placeholder="E-mail" type="email" style={inputStyle} readOnly={preview} />
            )}
            {cfg.requirePhone && (
              <input placeholder="Telefone (WhatsApp)" style={inputStyle} readOnly={preview} />
            )}
          </div>
        </div>

        {/* Método de pagamento */}
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
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${methods.length}, 1fr)`, gap: 8 }}>
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => !preview && setMethod(m)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: radius,
                    border: method === m
                      ? `2px solid ${btnColor}`
                      : `1px solid ${theme.borderColor}`,
                    background: method === m ? `${btnColor}10` : theme.bgColor,
                    color: method === m ? btnColor : theme.mutedColor,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: preview ? "default" : "pointer",
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

        {/* Preview do método */}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 80, height: 80,
                  background: theme.cardColor,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <QrCode size={40} color={theme.mutedColor} />
              </div>
              <div style={{ fontSize: 12, color: theme.mutedColor }}>
                QR Code gerado após confirmar
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Coins size={28} color={theme.mutedColor} />
              <div style={{ fontSize: 12, color: theme.mutedColor }}>
                Endereço de carteira gerado após confirmar
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: radius,
            border: "none",
            background: btnColor,
            color: "#fff",
            fontSize: 15,
            fontWeight: 800,
            cursor: preview ? "default" : "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
            boxShadow: `0 4px 16px ${btnColor}40`,
          }}
        >
          <Lock
            size={14}
            style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }}
          />
          {cfg.btnText || "Confirmar pagamento"}
        </button>
      </div>
    </div>
  );
}

function SectionGuarantee({ cfg, theme }) {
  const icons = {
    shield: <ShieldCheck size={28} />,
    check: <CheckCircle2 size={28} />,
    star: <Star size={28} />,
  };
  return (
    <div style={{ padding: "0 24px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          borderRadius: 12,
          border: `1px solid ${theme.borderColor}`,
          background: theme.cardColor,
        }}
      >
        <div style={{ color: theme.primaryColor, flexShrink: 0 }}>
          {icons[cfg.icon || "shield"]}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.textColor, marginBottom: 3 }}>
            Garantia de {cfg.days || 7} dias
          </div>
          <div style={{ fontSize: 12, color: theme.mutedColor, lineHeight: 1.5 }}>
            {cfg.text || "Satisfação garantida ou seu dinheiro de volta, sem perguntas."}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTestimonials({ cfg, theme }) {
  const items = cfg.items || [];
  if (items.length === 0) return null;
  return (
    <div style={{ padding: "0 24px 20px" }}>
      {cfg.title && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: theme.textColor,
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          {cfg.title}
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((t, i) => (
          <div
            key={i}
            style={{
              borderRadius: 12,
              overflow: "hidden",
              background: theme.cardColor,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            {t.image ? (
              <img
                src={t.image}
                alt={t.name || `Depoimento ${i + 1}`}
                style={{ width: "100%", display: "block", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  padding: "14px 16px",
                  fontSize: 13,
                  color: theme.mutedColor,
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                Imagem do depoimento não configurada
              </div>
            )}
            {t.name && (
              <div
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.mutedColor,
                  borderTop: `1px solid ${theme.borderColor}`,
                }}
              >
                {t.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionFooter({ cfg, theme }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${theme.borderColor}`,
        padding: "16px 24px",
        textAlign: "center",
      }}
    >
      {cfg.showSecurity !== false && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginBottom: 8,
            fontSize: 11,
            color: theme.mutedColor,
            fontWeight: 700,
          }}
        >
          <Lock size={11} />
          Pagamento seguro e criptografado
        </div>
      )}
      <div style={{ fontSize: 11, color: theme.mutedColor }}>
        {cfg.text || "© 2025. Todos os direitos reservados."}
      </div>
      {cfg.showPowered !== false && (
        <div style={{ fontSize: 10, color: theme.mutedColor, marginTop: 4, opacity: 0.6 }}>
          Processado por OrionPay
        </div>
      )}
    </footer>
  );
}

// ─── Main renderer ──────────────────────────────────────────────

const SECTION_MAP = {
  header: SectionHeader,
  product: SectionProduct,
  benefits: SectionBenefits,
  video: SectionVideo,
  orderbump: SectionOrderBump,
  countdown: SectionCountdown,
  bonus: SectionBonus,
  faq: SectionFaq,
  payment: SectionPayment,
  guarantee: SectionGuarantee,
  testimonials: SectionTestimonials,
  footer: SectionFooter,
};

export default function CheckoutRenderer({ config, product, preview = false, renderPayment }) {
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

  const sections = [...(config?.sections || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100%",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {sections.map((section) => {
          if (section.type === "payment" && renderPayment) {
            return <span key={section.id}>{renderPayment(section.config || {}, theme)}</span>;
          }
          const Comp = SECTION_MAP[section.type];
          if (!Comp) return null;
          return (
            <Comp
              key={section.id}
              cfg={section.config || {}}
              theme={theme}
              product={product}
              preview={preview}
            />
          );
        })}
      </div>
    </div>
  );
}
