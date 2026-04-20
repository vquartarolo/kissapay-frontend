/**
 * CHECKOUTS SERVICE — Templates de checkout (independentes de produto)
 * ─────────────────────────────────────────────────────────────────────
 * BASE URL: /checkouts
 *
 * Modelo:
 * {
 *   id:        string
 *   name:      string       — ex: "Template Premium"
 *   config:    CheckoutConfig  — { theme, sections }
 *   createdAt: string
 *   updatedAt: string
 * }
 *
 * ENDPOINTS:
 *   GET    /checkouts          → { items: CheckoutTemplate[] }
 *   POST   /checkouts          → cria template → CheckoutTemplate
 *   GET    /checkouts/:id      → CheckoutTemplate
 *   PUT    /checkouts/:id      → atualiza → CheckoutTemplate
 *   DELETE /checkouts/:id      → { ok: true }
 * ─────────────────────────────────────────────────────────────────────
 */

import api from "./api";

export async function getCheckouts() {
  const { data } = await api.get("/checkouts");
  return data; // { items: [] }
}

export async function getCheckoutById(id) {
  const { data } = await api.get(`/checkouts/${id}`);
  return data; // CheckoutTemplate
}

export async function createCheckout(payload) {
  // payload: { name, config }
  const { data } = await api.post("/checkouts", payload);
  return data;
}

export async function updateCheckout(id, payload) {
  // payload: { name?, config? }
  const { data } = await api.put(`/checkouts/${id}`, payload);
  return data;
}

export async function deleteCheckout(id) {
  const { data } = await api.delete(`/checkouts/${id}`);
  return data;
}
