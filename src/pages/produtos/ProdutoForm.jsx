import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save, X, Youtube, ImageIcon, Tag, FileText,
  DollarSign, RefreshCw, ExternalLink, ToggleLeft,
  ToggleRight, Layers, Package, Truck, Download,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import { MultiImageUpload } from "../../components/ui/ImageUpload";
import { getProdutoById, createProduto, updateProduto } from "../../services/produtos.service";

const FIELD = {
  width: "100%", background: C.inputDeep, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: "11px 13px", color: C.white, fontFamily: "inherit",
  fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
};

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 7, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 }}>
      {children}
      {required && <span style={{ color: C.green, fontSize: 10 }}>*</span>}
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.green }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: C.white }}>{children}</span>
    </div>
  );
}

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const EMPTY_FORM = {
  name: "", description: "", price: "",
  type: "unique", deliveryType: "digital",
  images: [], videoUrl: "", status: "active",
  checkoutId: null, checkoutPublicId: null,
};

export default function ProdutoForm({ isMobile }) {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id && id !== "novo");

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState({ msg: "", type: "" });
  const priceRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await getProdutoById(id);
        const p = data?.product || data;
        setForm({
          name:         p.name        || "",
          description:  p.description || "",
          price:        p.price ? String((p.price / 100).toFixed(2)).replace(".", ",") : "",
          type:         p.type         || "unique",
          deliveryType: p.deliveryType || "digital",
          images:       p.images?.length ? p.images : [],
          videoUrl:     p.videoUrl    || "",
          status:       p.status      || "active",
          checkoutId:   p.checkoutId || null,
          checkoutPublicId: p.checkoutPublicId || null,
        });
      } catch {
        setFeedback({ msg: "Erro ao carregar produto.", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function handlePriceInput(e) {
    let raw = e.target.value.replace(/\D/g, "");
    if (!raw.length) { set("price", ""); return; }
    raw = raw.padStart(3, "0");
    const intPart = raw.slice(0, -2).replace(/^0+/, "") || "0";
    set("price", `${intPart},${raw.slice(-2)}`);
  }

  function priceToCents() {
    return Math.round(parseFloat(String(form.price || "0").replace(/\./g, "").replace(",", ".") || "0") * 100);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFeedback({ msg: "O nome do produto é obrigatório.", type: "error" }); return; }
    if (!form.price || priceToCents() === 0) { setFeedback({ msg: "Informe um preço válido.", type: "error" }); return; }
    try {
      setSaving(true); setFeedback({ msg: "", type: "" });
      const payload = {
        name:         form.name.trim(),
        description:  form.description.trim(),
        price:        priceToCents(),
        type:         form.type,
        deliveryType: form.deliveryType,
        images:       form.images.filter(Boolean),
        videoUrl:     form.videoUrl.trim(),
        status:       form.status,
      };
      if (isEdit) {
        await updateProduto(id, payload);
        setFeedback({ msg: "Produto atualizado com sucesso.", type: "success" });
      } else {
        await createProduto(payload);
        setFeedback({ msg: "Produto criado com sucesso.", type: "success" });
        setTimeout(() => navigate("/produtos"), 1200);
      }
    } catch (err) {
      setFeedback({ msg: err?.response?.data?.msg || "Erro ao salvar o produto.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const youtubeId = getYoutubeId(form.videoUrl);

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.green, animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontSize: 13, color: C.muted }}>Carregando produto...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={isEdit ? "Editar produto" : "Novo produto"}
        subtitle={isEdit ? "Atualize as informações do produto e salve." : "Preencha as informações do produto."}
        back
        right={
          <div style={{ display: "flex", gap: 8 }}>
            {isEdit && (
              <Btn variant="secondary" size="sm" icon={<ExternalLink size={13} />} onClick={() => form.checkoutPublicId && window.open(`/c/${form.checkoutPublicId}`, "_blank")} disabled={!form.checkoutPublicId}>
                Ver checkout
              </Btn>
            )}
            <Btn icon={saving ? <RefreshCw size={14} /> : <Save size={14} />} onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar produto"}
            </Btn>
          </div>
        }
      />

      {feedback.msg && (
        <div style={{
          marginBottom: 20, padding: "12px 14px", borderRadius: 12, fontSize: 13,
          color: feedback.type === "error" ? C.error : C.green,
          background: feedback.type === "error" ? "rgba(229,72,77,0.08)" : "rgba(45,134,89,0.08)",
          border: `1px solid ${feedback.type === "error" ? "rgba(229,72,77,0.20)" : "rgba(45,134,89,0.20)"}`,
        }}>
          {feedback.msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 16, alignItems: "start" }}>

        {/* ── Coluna principal ── */}
        <div style={{ display: "grid", gap: 16 }}>

          {/* Informações básicas */}
          <Card>
            <SectionTitle icon={<Tag size={15} />}>Informações básicas</SectionTitle>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <Label required>Nome do produto</Label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Curso de Finanças Pessoais" maxLength={120} style={FIELD}
                  onFocus={(e) => (e.target.style.borderColor = C.green)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)} />
                <div style={{ fontSize: 11, color: C.dim, marginTop: 5, textAlign: "right" }}>{form.name.length}/120</div>
              </div>
              <div>
                <Label required>Descrição</Label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Descreva o produto: o que o comprador vai receber, benefícios, diferenciais..."
                  rows={5} maxLength={2000}
                  style={{ ...FIELD, resize: "vertical", minHeight: 110, lineHeight: 1.6 }}
                  onFocus={(e) => (e.target.style.borderColor = C.green)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)} />
                <div style={{ fontSize: 11, color: C.dim, marginTop: 5, textAlign: "right" }}>{form.description.length}/2000</div>
              </div>
            </div>
          </Card>

          {/* Precificação e entrega */}
          <Card>
            <SectionTitle icon={<DollarSign size={15} />}>Precificação e entrega</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {/* Preço */}
              <div>
                <Label required>Preço</Label>
                <div style={{ display: "flex", alignItems: "center", background: C.inputDeep, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <span style={{ padding: "11px 13px", fontSize: 13, fontWeight: 800, color: C.muted, borderRight: `1px solid ${C.border}`, background: C.cardSoft, whiteSpace: "nowrap" }}>R$</span>
                  <input ref={priceRef} value={form.price} onChange={handlePriceInput}
                    inputMode="numeric" placeholder="0,00"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "11px 13px", color: C.white, fontSize: 16, fontWeight: 800, fontFamily: "inherit", letterSpacing: "-0.02em" }} />
                </div>
              </div>

              {/* Tipo de cobrança */}
              <div>
                <Label>Tipo de cobrança</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ key: "unique", label: "Pagamento único" }, { key: "recurring", label: "Recorrente" }].map((opt) => (
                    <button key={opt.key} type="button" onClick={() => set("type", opt.key)}
                      style={{ padding: "11px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        border: form.type === opt.key ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                        background: form.type === opt.key ? "rgba(45,134,89,0.10)" : C.inputDeep,
                        color: form.type === opt.key ? C.green : C.muted, fontSize: 12, fontWeight: 700, transition: "all 0.12s" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tipo de entrega */}
            <div>
              <Label>Tipo de produto</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { key: "digital",  label: "Digital",  icon: <Download size={14} />,  desc: "E-book, curso, software..." },
                  { key: "physical", label: "Físico",   icon: <Truck size={14} />,     desc: "Produto com entrega física" },
                ].map((opt) => (
                  <button key={opt.key} type="button" onClick={() => set("deliveryType", opt.key)}
                    style={{ padding: "14px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      border: form.deliveryType === opt.key ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                      background: form.deliveryType === opt.key ? "rgba(45,134,89,0.10)" : C.inputDeep,
                      transition: "all 0.12s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: form.deliveryType === opt.key ? C.green : C.muted }}>
                      {opt.icon}
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{opt.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.dim }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Mídia */}
          <Card>
            <SectionTitle icon={<ImageIcon size={15} />}>Mídia</SectionTitle>

            <div style={{ marginBottom: 24 }}>
              <MultiImageUpload
                label="Imagens do produto"
                values={form.images}
                onChange={(imgs) => set("images", imgs)}
                max={5}
                crop
                cropAspect={4 / 3}
              />
            </div>

            {/* Vídeo YouTube */}
            <div>
              <Label>URL do vídeo (YouTube) — opcional</Label>
              <div style={{ display: "flex", alignItems: "center", background: C.inputDeep, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <span style={{ padding: "11px 13px", borderRight: `1px solid ${C.border}`, background: C.cardSoft, color: "#FF0000", display: "flex", alignItems: "center" }}>
                  <Youtube size={15} />
                </span>
                <input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "11px 13px", color: C.white, fontSize: 13, fontFamily: "inherit" }} />
                {form.videoUrl && (
                  <button type="button" onClick={() => set("videoUrl", "")}
                    style={{ padding: "0 12px", background: "none", border: "none", color: C.muted, cursor: "pointer" }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              {youtubeId && (
                <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "16/9" }}>
                  <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="Preview"
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }} allowFullScreen />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: "grid", gap: 16 }}>

          {/* Publicação */}
          <Card>
            <SectionTitle icon={<FileText size={15} />}>Publicação</SectionTitle>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.cardSoft, border: `1px solid ${C.border}`, cursor: "pointer" }}
                onClick={() => set("status", form.status === "active" ? "inactive" : "active")}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                    {form.status === "active" ? "Produto ativo" : "Produto inativo"}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {form.status === "active" ? "Checkout acessível publicamente" : "Checkout oculto / sem vendas"}
                  </div>
                </div>
                {form.status === "active" ? <ToggleRight size={28} color={C.green} /> : <ToggleLeft size={28} color={C.muted} />}
              </div>

              <Btn fullWidth icon={saving ? <RefreshCw size={14} /> : <Save size={14} />} onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar produto"}
              </Btn>

              {isEdit && (
                <button type="button" onClick={() => form.checkoutId ? navigate(`/builder/${form.checkoutId}`) : navigate("/checkouts")}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, border: `1px solid rgba(45,134,89,0.30)`, background: "rgba(45,134,89,0.07)", color: C.green, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  <Layers size={15} />
                  Editar checkout
                </button>
              )}

              <Btn fullWidth variant="secondary" onClick={() => navigate("/produtos")}>
                Cancelar
              </Btn>
            </div>
          </Card>

          {/* Preview da imagem de capa */}
          {form.images[0] && (
            <Card style={{ padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Capa
              </div>
              <div style={{ borderRadius: 10, overflow: "hidden", background: C.cardSoft, aspectRatio: "4/3", border: `1px solid ${C.border}` }}>
                <img src={form.images[0]} alt={form.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </Card>
          )}

          {/* Resumo */}
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Resumo</div>
            <div style={{ display: "grid", gap: 0 }}>
              {[
                { label: "Preço",    value: form.price ? `R$ ${form.price}` : "—",            accent: form.price ? C.green : C.dim },
                { label: "Cobrança", value: form.type === "recurring" ? "Recorrente" : "Único" },
                { label: "Entrega",  value: form.deliveryType === "physical" ? "Físico" : "Digital", accent: form.deliveryType === "physical" ? C.gold : undefined },
                { label: "Imagens",  value: `${form.images.filter(Boolean).length}/5` },
                { label: "Vídeo",    value: youtubeId ? "YouTube ✓" : "—",                   accent: youtubeId ? C.green : C.dim },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.accent || C.white }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
