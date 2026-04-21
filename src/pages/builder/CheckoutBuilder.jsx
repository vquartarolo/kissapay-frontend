import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Smartphone, Monitor, Eye, RefreshCw,
  Layout, Package, CreditCard, ShieldCheck, MessageSquare,
  ToggleLeft, ToggleRight, GripVertical, Palette,
  Plus, Trash2, Pencil, Check, HelpCircle,
  Star, Timer, ShoppingCart, Video, Gift, AlignLeft,
  AlignCenter, AlignRight, ChevronRight, X, Sun, Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import CheckoutRenderer from "../../components/checkout/CheckoutRenderer";
import ImageUpload from "../../components/ui/ImageUpload";
import { getCheckoutById, createCheckout, updateCheckout } from "../../services/checkouts.service";
import { getProdutos, getProdutoById } from "../../services/produtos.service";
import { getDomains } from "../../services/domains.service";

// ─── Design tokens (CSS vars — respondem ao tema claro/escuro do app) ─────────
const C = {
  bg:          "var(--c-bg)",
  sidebar:     "var(--c-sidebar)",
  card:        "var(--c-card)",
  cardSoft:    "var(--c-card-soft)",
  input:       "var(--c-input-deep)",
  border:      "var(--c-border)",
  borderStrong:"var(--c-border-strong)",
  white:       "var(--c-text-primary)",
  light:       "var(--c-text-secondary)",
  muted:       "var(--c-text-muted)",
  dim:         "var(--c-text-dim)",
  // Accent colors — não dependem do tema
  green:       "#2D8659",
  greenBright: "#34A065",
  gold:        "#D4AF37",
  error:       "#E5484D",
};

const FIELD = {
  width: "100%", background: C.input, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "8px 10px", color: C.white, fontFamily: "inherit",
  fontSize: 12, outline: "none", boxSizing: "border-box",
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_THEME = {
  primaryColor: "#2D8659", bgColor: "#FFFFFF", cardColor: "#F8FAFC",
  textColor: "#0F172A", mutedColor: "#64748B", borderColor: "#E2E8F0", btnRadius: "10",
};

const DEFAULT_SECTIONS = [
  { id: "header",       type: "header",       enabled: true,  order: 0,  config: { logoUrl: "", logoPosition: "left", brandName: "", bgColor: "#FFFFFF", textColor: "#0F172A", showBorder: true } },
  { id: "product",      type: "product",      enabled: true,  order: 1,  config: { productId: "", layout: "left", showDescription: true, showVideo: true, badge: "", badgeColor: "#2D8659" } },
  { id: "benefits",     type: "benefits",     enabled: false, order: 2,  config: { title: "Por que escolher?", items: [] } },
  { id: "video",        type: "video",        enabled: false, order: 3,  config: { title: "", videoUrl: "" } },
  { id: "payment",      type: "payment",      enabled: true,  order: 4,  config: { methods: ["pix", "crypto"], requireName: true, requireEmail: true, requirePhone: false, btnText: "Confirmar pagamento", btnColor: "#2D8659" } },
  { id: "orderbump",    type: "orderbump",    enabled: false, order: 5,  config: { productName: "", price: 0, description: "", imageUrl: "", btnText: "Sim, quero adicionar!" } },
  { id: "guarantee",    type: "guarantee",    enabled: false, order: 6,  config: { days: 7, text: "Satisfação garantida ou seu dinheiro de volta, sem perguntas.", icon: "shield" } },
  { id: "countdown",    type: "countdown",    enabled: false, order: 7,  config: { title: "Oferta por tempo limitado!", targetDate: "", expiredText: "Esta oferta foi encerrada." } },
  { id: "bonus",        type: "bonus",        enabled: false, order: 8,  config: { title: "Bônus inclusos", items: [] } },
  { id: "testimonials", type: "testimonials", enabled: false, order: 9,  config: { title: "O que dizem nossos clientes", items: [] } },
  { id: "faq",          type: "faq",          enabled: false, order: 10, config: { title: "Perguntas Frequentes", items: [] } },
  { id: "footer",       type: "footer",       enabled: true,  order: 11, config: { text: "© 2025. Todos os direitos reservados.", showPowered: true, showSecurity: true } },
];

const FALLBACK_PREVIEW_PRODUCT = {
  name: "Produto de Exemplo", description: "Esta é a descrição do produto.",
  price: 9700, type: "unique", images: [], videoUrl: "", slug: "preview",
};

const SECTION_META = {
  header:       { label: "Cabeçalho",       icon: Layout },
  product:      { label: "Produto",          icon: Package },
  benefits:     { label: "Benefícios",       icon: Star },
  video:        { label: "Vídeo",            icon: Video },
  payment:      { label: "Pagamento",        icon: CreditCard },
  orderbump:    { label: "Order Bump",       icon: ShoppingCart },
  guarantee:    { label: "Garantia",         icon: ShieldCheck },
  countdown:    { label: "Contador",         icon: Timer },
  bonus:        { label: "Bônus",            icon: Gift },
  testimonials: { label: "Depoimentos",      icon: MessageSquare },
  faq:          { label: "FAQ",              icon: HelpCircle },
  footer:       { label: "Rodapé",           icon: AlignLeft },
};

// ─── Reusable field controls ──────────────────────────────────────────────────
const ColorRow = ({ label, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
    <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 22, height: 22, borderRadius: 5, background: value, border: `1px solid ${C.border}`, overflow: "hidden", cursor: "pointer", position: "relative" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...FIELD, width: 80, fontFamily: "monospace", fontSize: 11 }} />
    </div>
  </div>
);

const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
    <button type="button" onClick={() => onChange(!value)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
      {value ? <ToggleRight size={22} color={C.green} /> : <ToggleLeft size={22} color={C.muted} />}
    </button>
  </div>
);

const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>{children}</div>
);

// ─── Product picker ───────────────────────────────────────────────────────────
function ProductPicker({ value, onChange }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    getProdutos({ limit: 50, status: "active" })
      .then((d) => setProducts(d?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = products.find((p) => p._id === value || p.id === value);

  return (
    <div>
      <FieldLabel>Produto vinculado</FieldLabel>
      {selected ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.cardSoft, border: `1px solid ${C.green}30`, borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {Number(selected.price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
          <button type="button" onClick={() => onChange("")}
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..." style={{ ...FIELD, marginBottom: 6 }} />
          <div style={{ maxHeight: 160, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8, background: C.card }}>
            {loading ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: 11, color: C.muted }}>Carregando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: 11, color: C.dim }}>Nenhum produto encontrado</div>
            ) : filtered.map((p) => (
              <button key={p._id || p.id} type="button"
                onClick={() => onChange(p._id || p.id)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, padding: "8px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {Number(p.price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Domain picker ────────────────────────────────────────────────────────────
function DomainPicker({ value, onChange }) {
  const [domains, setDomains]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getDomains()
      .then((d) => {
        // Apenas domínios com verificação DNS completa (TXT + CNAME)
        const verified = (d?.domains ?? []).filter(
          (dom) => dom.status === "verified" && dom.checks?.txt && dom.checks?.cname
        );
        setDomains(verified);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <FieldLabel>Domínio personalizado</FieldLabel>

      {loading ? (
        <div style={{ fontSize: 11, color: C.muted }}>Carregando domínios…</div>
      ) : (
        <>
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            style={{ ...FIELD }}
          >
            <option value="">Sem domínio personalizado</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.domain}</option>
            ))}
          </select>

          {domains.length === 0 && (
            <div style={{ fontSize: 11, color: C.dim, marginTop: 5, lineHeight: 1.5 }}>
              Nenhum domínio verificado. Adicione e verifique em{" "}
              <strong style={{ color: C.green }}>Domínios</strong>.
            </div>
          )}

          {value && domains.find((d) => d.id === value) && (
            <div style={{ marginTop: 5, fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: C.green }}>✓</span>
              Associação preparatória — checkout white-label ficará ativo quando a infra estiver configurada.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Section config panels ────────────────────────────────────────────────────
function ConfigHeader({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <ImageUpload
        label="Logo"
        value={cfg.logoUrl || ""}
        onChange={(v) => onChange({ ...cfg, logoUrl: v })}
        aspect="free"
        maxWidth={400}
        hint="PNG ou SVG transparente recomendado"
      />
      <div>
        <FieldLabel>Posição do logo</FieldLabel>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { k: "left",   icon: <AlignLeft size={13} />,   l: "Esquerda" },
            { k: "center", icon: <AlignCenter size={13} />,  l: "Centro" },
            { k: "right",  icon: <AlignRight size={13} />,   l: "Direita" },
          ].map(({ k, icon, l }) => (
            <button key={k} type="button" onClick={() => onChange({ ...cfg, logoPosition: k })}
              style={{ flex: 1, padding: "7px 4px", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                border: cfg.logoPosition === k ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                background: cfg.logoPosition === k ? "rgba(45,134,89,0.12)" : C.input,
                color: cfg.logoPosition === k ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {icon} {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Nome da marca (se sem logo)</FieldLabel>
        <input value={cfg.brandName || ""} onChange={(e) => onChange({ ...cfg, brandName: e.target.value })}
          placeholder="OrionPay" style={FIELD} />
      </div>
      <ColorRow label="Fundo do header" value={cfg.bgColor || "#FFFFFF"} onChange={(v) => onChange({ ...cfg, bgColor: v })} />
      <ColorRow label="Cor do texto"    value={cfg.textColor || "#0F172A"} onChange={(v) => onChange({ ...cfg, textColor: v })} />
      <Toggle label="Linha separadora" value={cfg.showBorder !== false} onChange={(v) => onChange({ ...cfg, showBorder: v })} />
    </div>
  );
}

function ConfigProduct({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <ProductPicker value={cfg.productId || ""} onChange={(v) => onChange({ ...cfg, productId: v })} />
      <div>
        <FieldLabel>Layout da imagem</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[{ k: "left", l: "Esquerda" }, { k: "right", l: "Direita" }, { k: "top", l: "Topo" }, { k: "none", l: "Sem imagem" }].map(({ k, l }) => (
            <button key={k} type="button" onClick={() => onChange({ ...cfg, layout: k })}
              style={{ padding: "7px 4px", borderRadius: 7,
                border: cfg.layout === k ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                background: cfg.layout === k ? "rgba(45,134,89,0.12)" : C.input,
                color: cfg.layout === k ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <Toggle label="Mostrar descrição" value={cfg.showDescription !== false} onChange={(v) => onChange({ ...cfg, showDescription: v })} />
      <Toggle label="Mostrar vídeo" value={cfg.showVideo !== false} onChange={(v) => onChange({ ...cfg, showVideo: v })} />
      <div>
        <FieldLabel>Badge (opcional)</FieldLabel>
        <input value={cfg.badge || ""} onChange={(e) => onChange({ ...cfg, badge: e.target.value })} placeholder="Ex: MAIS VENDIDO" style={FIELD} />
      </div>
      {cfg.badge && <ColorRow label="Cor do badge" value={cfg.badgeColor || "#2D8659"} onChange={(v) => onChange({ ...cfg, badgeColor: v })} />}
    </div>
  );
}

function ConfigBenefits({ cfg, onChange }) {
  const items = cfg.items || [];
  const update = (idx, field, val) => onChange({ ...cfg, items: items.map((it, i) => i === idx ? { ...it, [field]: val } : it) });
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <input value={cfg.title || ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} style={FIELD} />
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Benefício {idx + 1}</span>
            <button type="button" onClick={() => onChange({ ...cfg, items: items.filter((_, i) => i !== idx) })}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 0 }}>
              <Trash2 size={13} />
            </button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <input placeholder="Título" value={item.title || ""} onChange={(e) => update(idx, "title", e.target.value)} style={{ ...FIELD, fontSize: 11 }} />
            <input placeholder="Descrição (opcional)" value={item.desc || ""} onChange={(e) => update(idx, "desc", e.target.value)} style={{ ...FIELD, fontSize: 11 }} />
          </div>
        </div>
      ))}
      {items.length < 8 && (
        <button type="button" onClick={() => onChange({ ...cfg, items: [...items, { title: "", desc: "" }] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={12} /> Adicionar benefício
        </button>
      )}
    </div>
  );
}

function ConfigVideo({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Título (opcional)</FieldLabel>
        <input value={cfg.title || ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} placeholder="Assista antes de comprar" style={FIELD} />
      </div>
      <div>
        <FieldLabel>URL do YouTube</FieldLabel>
        <input value={cfg.videoUrl || ""} onChange={(e) => onChange({ ...cfg, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." style={FIELD} />
      </div>
    </div>
  );
}

function ConfigPayment({ cfg, onChange }) {
  const methods = cfg.methods || ["pix"];
  const toggleMethod = (m) => {
    const next = methods.includes(m) ? methods.filter((x) => x !== m) : [...methods, m];
    if (next.length > 0) onChange({ ...cfg, methods: next });
  };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Métodos aceitos</FieldLabel>
        <div style={{ display: "flex", gap: 6 }}>
          {["pix", "crypto"].map((m) => (
            <button key={m} type="button" onClick={() => toggleMethod(m)}
              style={{ flex: 1, padding: "7px 4px", borderRadius: 7,
                border: methods.includes(m) ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                background: methods.includes(m) ? "rgba(45,134,89,0.12)" : C.input,
                color: methods.includes(m) ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {m === "pix" ? "PIX" : "Cripto"}
            </button>
          ))}
        </div>
      </div>
      <Toggle label="Pedir nome" value={cfg.requireName !== false} onChange={(v) => onChange({ ...cfg, requireName: v })} />
      <Toggle label="Pedir e-mail" value={cfg.requireEmail !== false} onChange={(v) => onChange({ ...cfg, requireEmail: v })} />
      <Toggle label="Pedir telefone" value={!!cfg.requirePhone} onChange={(v) => onChange({ ...cfg, requirePhone: v })} />
      <div>
        <FieldLabel>Texto do botão</FieldLabel>
        <input value={cfg.btnText || "Confirmar pagamento"} onChange={(e) => onChange({ ...cfg, btnText: e.target.value })} style={FIELD} />
      </div>
      <ColorRow label="Cor do botão" value={cfg.btnColor || "#2D8659"} onChange={(v) => onChange({ ...cfg, btnColor: v })} />
    </div>
  );
}

function ConfigOrderBump({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <ImageUpload label="Imagem do produto" value={cfg.imageUrl || ""} onChange={(v) => onChange({ ...cfg, imageUrl: v })} aspect="square" />
      <div>
        <FieldLabel>Nome do produto</FieldLabel>
        <input value={cfg.productName || ""} onChange={(e) => onChange({ ...cfg, productName: e.target.value })} placeholder="Ex: Planilha de controle" style={FIELD} />
      </div>
      <div>
        <FieldLabel>Preço (centavos)</FieldLabel>
        <input type="number" min={0} value={cfg.price || 0} onChange={(e) => onChange({ ...cfg, price: Number(e.target.value) })} style={{ ...FIELD, width: 120 }} />
      </div>
      <div>
        <FieldLabel>Descrição</FieldLabel>
        <textarea value={cfg.description || ""} onChange={(e) => onChange({ ...cfg, description: e.target.value })} rows={2} style={{ ...FIELD, resize: "vertical" }} />
      </div>
      <div>
        <FieldLabel>Texto do botão</FieldLabel>
        <input value={cfg.btnText || "Sim, quero adicionar!"} onChange={(e) => onChange({ ...cfg, btnText: e.target.value })} style={FIELD} />
      </div>
    </div>
  );
}

function ConfigGuarantee({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Dias de garantia</FieldLabel>
        <input type="number" min={1} value={cfg.days || 7} onChange={(e) => onChange({ ...cfg, days: Number(e.target.value) })} style={{ ...FIELD, width: 80 }} />
      </div>
      <div>
        <FieldLabel>Texto</FieldLabel>
        <textarea value={cfg.text || ""} onChange={(e) => onChange({ ...cfg, text: e.target.value })} rows={3} style={{ ...FIELD, resize: "vertical" }} />
      </div>
      <div>
        <FieldLabel>Ícone</FieldLabel>
        <div style={{ display: "flex", gap: 6 }}>
          {["shield", "check", "star"].map((ic) => (
            <button key={ic} type="button" onClick={() => onChange({ ...cfg, icon: ic })}
              style={{ flex: 1, padding: "6px", borderRadius: 7,
                border: cfg.icon === ic ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                background: cfg.icon === ic ? "rgba(45,134,89,0.12)" : C.input,
                color: cfg.icon === ic ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {ic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfigCountdown({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Título</FieldLabel>
        <input value={cfg.title || ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} placeholder="Oferta por tempo limitado!" style={FIELD} />
      </div>
      <div>
        <FieldLabel>Data e hora de encerramento</FieldLabel>
        <input type="datetime-local" value={cfg.targetDate || ""} onChange={(e) => onChange({ ...cfg, targetDate: e.target.value })}
          style={{ ...FIELD, colorScheme: "dark" }} />
      </div>
      <div>
        <FieldLabel>Texto pós-encerramento</FieldLabel>
        <input value={cfg.expiredText || ""} onChange={(e) => onChange({ ...cfg, expiredText: e.target.value })} placeholder="Oferta encerrada." style={FIELD} />
      </div>
    </div>
  );
}

function ConfigBonus({ cfg, onChange }) {
  const items = cfg.items || [];
  const update = (idx, field, val) => onChange({ ...cfg, items: items.map((it, i) => i === idx ? { ...it, [field]: val } : it) });
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <input value={cfg.title || ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} style={FIELD} />
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Bônus {idx + 1}</span>
            <button type="button" onClick={() => onChange({ ...cfg, items: items.filter((_, i) => i !== idx) })}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 0 }}><Trash2 size={13} /></button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <input placeholder="Título do bônus" value={item.title || ""} onChange={(e) => update(idx, "title", e.target.value)} style={{ ...FIELD, fontSize: 11 }} />
            <input placeholder="Descrição (opcional)" value={item.description || ""} onChange={(e) => update(idx, "description", e.target.value)} style={{ ...FIELD, fontSize: 11 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>Valor (R$)</span>
              <input type="number" min={0} value={item.value || 0} onChange={(e) => update(idx, "value", Number(e.target.value))} style={{ ...FIELD, width: 80 }} />
            </div>
          </div>
        </div>
      ))}
      {items.length < 6 && (
        <button type="button" onClick={() => onChange({ ...cfg, items: [...items, { title: "", description: "", value: 0 }] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={12} /> Adicionar bônus
        </button>
      )}
    </div>
  );
}

function ConfigTestimonials({ cfg, onChange }) {
  const items = cfg.items || [];
  const update = (idx, field, val) => onChange({ ...cfg, items: items.map((it, i) => i === idx ? { ...it, [field]: val } : it) });
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <input value={cfg.title || ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} style={FIELD} />
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Depoimento {idx + 1}</span>
            <button type="button" onClick={() => onChange({ ...cfg, items: items.filter((_, i) => i !== idx) })}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 0 }}><Trash2 size={13} /></button>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <ImageUpload
              label="Imagem do depoimento"
              value={item.imageUrl || ""}
              onChange={(v) => update(idx, "imageUrl", v)}
              aspect="free"
              hint="Screenshot de avaliação ou foto do cliente"
            />
            <input placeholder="Nome do cliente (opcional)" value={item.name || ""} onChange={(e) => update(idx, "name", e.target.value)} style={{ ...FIELD, fontSize: 11 }} />
          </div>
        </div>
      ))}
      {items.length < 6 && (
        <button type="button" onClick={() => onChange({ ...cfg, items: [...items, { imageUrl: "", name: "" }] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={12} /> Adicionar depoimento
        </button>
      )}
    </div>
  );
}

function ConfigFaq({ cfg, onChange }) {
  const items = cfg.items || [];
  const update = (idx, field, val) => onChange({ ...cfg, items: items.map((it, i) => i === idx ? { ...it, [field]: val } : it) });
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <input value={cfg.title || ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} style={FIELD} />
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Pergunta {idx + 1}</span>
            <button type="button" onClick={() => onChange({ ...cfg, items: items.filter((_, i) => i !== idx) })}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 0 }}><Trash2 size={13} /></button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <input placeholder="Pergunta" value={item.q || ""} onChange={(e) => update(idx, "q", e.target.value)} style={{ ...FIELD, fontSize: 11 }} />
            <textarea placeholder="Resposta" value={item.a || ""} onChange={(e) => update(idx, "a", e.target.value)} rows={2} style={{ ...FIELD, fontSize: 11, resize: "vertical" }} />
          </div>
        </div>
      ))}
      {items.length < 10 && (
        <button type="button" onClick={() => onChange({ ...cfg, items: [...items, { q: "", a: "" }] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={12} /> Adicionar pergunta
        </button>
      )}
    </div>
  );
}

function ConfigFooter({ cfg, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <FieldLabel>Texto do rodapé</FieldLabel>
        <input value={cfg.text || ""} onChange={(e) => onChange({ ...cfg, text: e.target.value })} style={FIELD} />
      </div>
      <Toggle label="Mostrar 'Processado por OrionPay'" value={cfg.showPowered !== false} onChange={(v) => onChange({ ...cfg, showPowered: v })} />
      <Toggle label="Mostrar badge de segurança" value={cfg.showSecurity !== false} onChange={(v) => onChange({ ...cfg, showSecurity: v })} />
    </div>
  );
}

const CONFIG_PANELS = {
  header: ConfigHeader, product: ConfigProduct, benefits: ConfigBenefits,
  video: ConfigVideo, payment: ConfigPayment, orderbump: ConfigOrderBump,
  guarantee: ConfigGuarantee, countdown: ConfigCountdown, bonus: ConfigBonus,
  testimonials: ConfigTestimonials, faq: ConfigFaq, footer: ConfigFooter,
};

// ─── Inline name editor ───────────────────────────────────────────────────────
function NameEditor({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    const trimmed = draft.trim() || "Checkout sem título";
    setDraft(trimmed); onChange(trimmed); setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          style={{ ...FIELD, fontSize: 13, fontWeight: 800, padding: "4px 8px", flex: 1, minWidth: 0 }} autoFocus />
        <button type="button" onClick={commit} style={{ background: "none", border: "none", color: C.green, cursor: "pointer", padding: 2 }}>
          <Check size={13} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value || "Checkout sem título"}
      </div>
      <Pencil size={11} color={C.dim} style={{ flexShrink: 0 }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CheckoutBuilder() {
  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const { theme: appTheme, toggleTheme: toggleAppTheme } = useTheme();
  const isNew = !checkoutId || checkoutId === "new";

  const [name,     setName]     = useState("Novo Checkout");
  const [theme,    setTheme]    = useState(DEFAULT_THEME);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [loading,  setLoading]  = useState(!isNew);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [savedId,  setSavedId]  = useState(isNew ? null : checkoutId);
  const [selectedSection, setSelectedSection] = useState(null);
  const [hoveredSection,  setHoveredSection]  = useState(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [dragSrc,  setDragSrc]  = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [productsCache, setProductsCache] = useState([]);
  const [linkedProduct, setLinkedProduct] = useState(null);
  const [customDomainId, setCustomDomainId] = useState(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const data = await getCheckoutById(checkoutId);
        setName(data.name || "Checkout sem título");
        if (data.config?.theme)    setTheme({ ...DEFAULT_THEME, ...data.config.theme });
        if (data.config?.sections?.length) {
          // merge any new section types not yet in saved data
          const savedTypes = new Set(data.config.sections.map((s) => s.type));
          const newDefaults = DEFAULT_SECTIONS.filter((s) => !savedTypes.has(s.type));
          const merged = [...data.config.sections, ...newDefaults.map((s, i) => ({ ...s, order: data.config.sections.length + i }))];
          setSections(merged);
        }
        if (data.customDomainId) setCustomDomainId(data.customDomainId);
        setSavedId(checkoutId);
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, [checkoutId, isNew]);

  useEffect(() => {
    getProdutos({ limit: 100, status: "active" })
      .then((d) => setProductsCache(d?.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const productSection = sections.find((s) => s.type === "product");
    const productId = productSection?.config?.productId;

    if (!productId) {
      setLinkedProduct(null);
      return;
    }

    const cached =
      productsCache.find((p) => p.id === productId || p._id === productId) || null;

    if (cached) {
      setLinkedProduct(cached);
      return;
    }

    getProdutoById(productId)
      .then((d) => {
        setLinkedProduct(d?.product || d || null);
      })
      .catch(() => {
        setLinkedProduct(null);
      });
  }, [sections, productsCache]);

  const updateSectionConfig = useCallback((id, newCfg) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, config: newCfg } : s));
  }, []);

  const toggleSection = useCallback((id) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const reorderSections = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    setSections((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const fromIdx = sorted.findIndex((s) => s.id === fromId);
      const toIdx   = sorted.findIndex((s) => s.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const moved = sorted.splice(fromIdx, 1)[0];
      sorted.splice(toIdx, 0, moved);
      return sorted.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      const payload = { name, config: { theme, sections }, customDomainId: customDomainId || null };
      let result;
      if (savedId) {
        result = await updateCheckout(savedId, payload);
      } else {
        result = await createCheckout(payload);
        setSavedId(result.id);
        window.history.replaceState({}, "", `/builder/${result.id}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const activeSectionData = selectedSection ? sections.find((s) => s.id === selectedSection) : null;
  const ActiveConfigPanel = activeSectionData ? CONFIG_PANELS[activeSectionData.type] : null;

  const previewProduct = linkedProduct
    ? {
        ...linkedProduct,
        type: linkedProduct.type || "unique",
        images: linkedProduct.images || [],
        videoUrl: linkedProduct.videoUrl || "",
        slug: linkedProduct.slug || "",
      }
    : FALLBACK_PREVIEW_PRODUCT;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: C.green, animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── LEFT: Sections list (260px) ── */}
      <div style={{ width: 260, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "12px 12px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <button onClick={() => navigate("/checkouts")}
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={13} />
            </button>
            <NameEditor value={name} onChange={setName} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "8px", borderRadius: 8,
              background: saved ? "rgba(45,134,89,0.15)" : C.green,
              color: saved ? C.green : "#fff",
              border: saved ? `1px solid ${C.green}` : "none",
              fontSize: 12, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
            {saving ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={12} />}
            {saving ? "Salvando..." : saved ? "Salvo!" : isNew && !savedId ? "Criar checkout" : "Salvar"}
          </button>
        </div>

        {/* Section list label */}
        <div style={{ padding: "8px 12px 4px", fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
          Seções
        </div>

        {/* Scrollable sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
          {sortedSections.map((section) => {
            const meta = SECTION_META[section.type];
            if (!meta) return null;
            const Icon = meta.icon;
            const isSelected = selectedSection === section.id;
            const isDragging = dragSrc === section.id;
            const isDropTarget = dragOver === section.id && dragSrc !== section.id;

            const isHovered = hoveredSection === section.id;
            const labelColor = isSelected || isHovered
              ? C.white
              : section.enabled ? C.light : C.muted;
            const iconColor = isSelected
              ? C.greenBright
              : section.enabled ? C.green : C.muted;

            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => {
                  setDragSrc(section.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOver(section.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  reorderSections(dragSrc, section.id);
                  setDragSrc(null);
                  setDragOver(null);
                }}
                onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                onClick={() => setSelectedSection(isSelected ? null : section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 8px", marginBottom: 2, borderRadius: 8,
                  cursor: "grab",
                  background: isDropTarget
                    ? `${C.green}22`
                    : isSelected ? `${C.green}14`
                    : isHovered ? "rgba(255,255,255,0.05)"
                    : "transparent",
                  border: `1px solid ${isDropTarget ? C.green : isSelected ? `${C.green}40` : "transparent"}`,
                  opacity: isDragging ? 0.4 : 1,
                  transition: "opacity 0.12s, background 0.12s, border-color 0.12s",
                  userSelect: "none",
                }}
              >
                {/* Drag handle */}
                <GripVertical size={12} color={C.muted} style={{ flexShrink: 0, cursor: "grab" }} />

                <Icon size={12} color={iconColor} style={{ flexShrink: 0 }} />

                <span style={{ flex: 1, fontSize: 12, fontWeight: isSelected || isHovered ? 700 : 500, color: labelColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.1s" }}>
                  {meta.label}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {isSelected && <ChevronRight size={10} color={C.green} />}
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    {section.enabled ? <ToggleRight size={16} color={C.green} /> : <ToggleLeft size={16} color={C.muted} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTER: Live preview ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Preview toolbar */}
        <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.sidebar, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.10em" }}>
            Preview ao vivo
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMobilePreview(false)}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${!mobilePreview ? C.green : C.border}`, background: !mobilePreview ? "rgba(45,134,89,0.12)" : "transparent", color: !mobilePreview ? C.green : C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Monitor size={13} />
            </button>
            <button onClick={() => setMobilePreview(true)}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${mobilePreview ? C.green : C.border}`, background: mobilePreview ? "rgba(45,134,89,0.12)" : "transparent", color: mobilePreview ? C.green : C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Smartphone size={13} />
            </button>
            {savedId && (
              <button onClick={() => window.open(`/c/preview-${savedId}`, "_blank")}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 10px", height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <Eye size={12} /> Abrir
              </button>
            )}
            {/* Theme toggle */}
            <button
              onClick={toggleAppTheme}
              title={appTheme === "dark" ? "Modo claro" : "Modo escuro"}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {appTheme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: "auto", background: "#e5e7eb", padding: mobilePreview ? "20px 0" : "20px" }}>
          <div style={{
            maxWidth: mobilePreview ? 390 : "100%",
            margin: "0 auto",
            borderRadius: mobilePreview ? 24 : 12,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            border: mobilePreview ? "8px solid #1a1a1a" : "none",
            minHeight: mobilePreview ? 680 : undefined,
          }}>
            <CheckoutRenderer config={{ theme, sections }} product={previewProduct} preview />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Theme / Section config (260px) ── */}
      <div style={{ width: 260, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Panel header */}
        <div style={{ padding: "12px 12px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {activeSectionData ? (
            <>
              <button type="button" onClick={() => setSelectedSection(null)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                <ArrowLeft size={13} />
              </button>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.white }}>
                  {SECTION_META[activeSectionData.type]?.label}
                </div>
                <div style={{ fontSize: 10, color: C.dim }}>configurações da seção</div>
              </div>
            </>
          ) : (
            <>
              <Palette size={13} color={C.muted} />
              <div style={{ fontSize: 12, fontWeight: 800, color: C.white }}>Tema</div>
            </>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>

          {/* Section config */}
          {activeSectionData && ActiveConfigPanel && (
            <ActiveConfigPanel
              cfg={activeSectionData.config || {}}
              onChange={(newCfg) => updateSectionConfig(activeSectionData.id, newCfg)}
            />
          )}

          {/* Theme panel (when no section selected) */}
          {!activeSectionData && (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                Cores globais
              </div>
              <ColorRow label="Cor principal"    value={theme.primaryColor} onChange={(v) => setTheme((t) => ({ ...t, primaryColor: v }))} />
              <ColorRow label="Fundo da página"  value={theme.bgColor}      onChange={(v) => setTheme((t) => ({ ...t, bgColor: v }))} />
              <ColorRow label="Fundo dos cards"  value={theme.cardColor}    onChange={(v) => setTheme((t) => ({ ...t, cardColor: v }))} />
              <ColorRow label="Texto principal"  value={theme.textColor}    onChange={(v) => setTheme((t) => ({ ...t, textColor: v }))} />
              <ColorRow label="Texto secundário" value={theme.mutedColor}   onChange={(v) => setTheme((t) => ({ ...t, mutedColor: v }))} />
              <ColorRow label="Bordas"           value={theme.borderColor}  onChange={(v) => setTheme((t) => ({ ...t, borderColor: v }))} />
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Raio dos botões</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="range" min={0} max={30} value={theme.btnRadius}
                    onChange={(e) => setTheme((t) => ({ ...t, btnRadius: e.target.value }))}
                    style={{ flex: 1, accentColor: C.green }} />
                  <span style={{ fontSize: 12, color: C.white, width: 32, textAlign: "right" }}>{theme.btnRadius}px</span>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                  Domínio
                </div>
                <DomainPicker value={customDomainId} onChange={setCustomDomainId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
