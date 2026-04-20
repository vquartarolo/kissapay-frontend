/**
 * PRODUTOS SERVICE
 * ─────────────────────────────────────────────────────────────────
 * Contrato de API para o backend.
 *
 * BASE URL: /products
 *
 * Modelo de produto:
 * {
 *   id:          string      — gerado pelo backend
 *   name:        string      — nome do produto
 *   description: string      — descrição detalhada
 *   price:       number      — valor em centavos (ex: 9700 = R$ 97,00)
 *   type:        "unique" | "recurring"
 *   images:      string[]    — array de URLs das imagens
 *   videoUrl:    string      — URL do YouTube (opcional)
 *   slug:        string      — gerado pelo backend (ex: "curso-x")
 *   status:      "active" | "inactive"
 *   createdAt:   string      — ISO date
 * }
 *
 * ENDPOINTS:
 *   GET    /products            → lista paginada { items, pagination }
 *   GET    /products/:id        → produto individual
 *   POST   /products            → criar produto
 *   PATCH  /products/:id        → editar produto
 *   DELETE /products/:id        → deletar produto
 *   GET    /products/slug/:slug → produto público por slug (checkout)
 * ─────────────────────────────────────────────────────────────────
 */

import api from "./api";

export async function getProdutos(params = {}) {
  const q = new URLSearchParams();
  if (params.page)   q.set("page", String(params.page));
  if (params.limit)  q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const { data } = await api.get(`/products?${q.toString()}`);
  return data;
}

export async function getProdutoById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function createProduto(payload) {
  const { data } = await api.post("/products", payload);
  return data;
}

export async function updateProduto(id, payload) {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data;
}

export async function deleteProduto(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

/**
 * CHECKOUT CONFIG
 * ─────────────────────────────────────────────────────────────────
 * GET    /products/:id/checkout   → retorna { config: CheckoutConfig }
 * PUT    /products/:id/checkout   → salva { config: CheckoutConfig }
 * GET    /checkout/:slug          → página pública (sem auth) { product, config }
 *
 * CheckoutConfig = {
 *   theme: {
 *     primaryColor: string,   // cor principal (botão, destaques)
 *     bgColor:      string,   // fundo da página
 *     cardColor:    string,   // fundo dos cards
 *     textColor:    string,   // texto principal
 *     mutedColor:   string,   // texto secundário
 *     borderColor:  string,   // bordas
 *     btnRadius:    string,   // border-radius do botão (px)
 *   },
 *   sections: SectionConfig[]
 * }
 *
 * SectionConfig = {
 *   id:      string,              // identificador único
 *   type:    SectionType,         // ver abaixo
 *   enabled: boolean,
 *   order:   number,
 *   config:  object               // configurações específicas por tipo
 * }
 *
 * SectionType:
 *   "header"       → { logoUrl, brandName, bgColor, textColor, showBorder }
 *   "product"      → { layout:"left"|"right"|"top"|"none", showDescription, showVideo, badge, badgeColor }
 *   "payment"      → { methods:["pix","crypto"], requireName, requireEmail, requirePhone, btnText, btnColor }
 *   "guarantee"    → { days, text, icon:"shield"|"check"|"star" }
 *   "testimonials" → { title, items:[{ name, role, text }] }
 *   "footer"       → { text, showPowered, showSecurity }
 * ─────────────────────────────────────────────────────────────────
 */

export async function getCheckoutConfig(productId) {
  const { data } = await api.get(`/products/${productId}/checkout`);
  return data;
}

export async function saveCheckoutConfig(productId, config) {
  const { data } = await api.put(`/products/${productId}/checkout`, { config });
  return data;
}

export async function getCheckoutPublic(id) {
  const { data } = await api.get(`/checkout/public`, { params: { id } });
  return data;
}
