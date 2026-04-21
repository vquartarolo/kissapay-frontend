/**
 * DOMAINS SERVICE
 * ─────────────────────────────────────────────────────────────────
 * Contrato de API para o módulo de Domínios Personalizados.
 *
 * BASE URL: /domains
 *
 * Modelo de domínio retornado pela API:
 * {
 *   id:                    string   — ObjectId do MongoDB
 *   domain:                string   — ex: pay.minhaloja.com.br
 *   status:                "pending" | "verified" | "failed"
 *   verificationToken:     string   — token gerado no backend (hex 48 chars)
 *   cnameName:             string   — primeiro label do domínio (ex: "pay")
 *   cnameTarget:           string   — destino DNS da OrionPay
 *   txtName:               string   — nome do registro TXT para verificação
 *   txtValue:              string   — valor do registro TXT para verificação
 *   createdAt:             string   — ISO date
 *   verifiedAt:            string | null
 *   checks:                { txt: boolean, cname: boolean }
 *   lastVerificationError: string | null
 * }
 *
 * ENDPOINTS:
 *   GET    /domains          → lista domínios do usuário autenticado
 *   POST   /domains          → adicionar domínio { domain }
 *   POST   /domains/:id/verify → verificação DNS real (TXT + CNAME)
 *   DELETE /domains/:id      → remover domínio (apenas pending ou failed)
 * ─────────────────────────────────────────────────────────────────
 */

import api from "./api";

export async function getDomains() {
  const { data } = await api.get("/domains");
  return data;
}

export async function createDomain(domain) {
  const { data } = await api.post("/domains", { domain });
  return data;
}

export async function verifyDomain(id) {
  const { data } = await api.post(`/domains/${id}/verify`);
  return data;
}

export async function deleteDomain(id) {
  const { data } = await api.delete(`/domains/${id}`);
  return data;
}
