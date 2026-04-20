import api from "./api";

/* =========================
   SAQUES / APROVAÇÕES
========================= */
export async function getPendingCashouts() {
  const { data } = await api.get("/cashout/admin/list");
  return data;
}

export async function reviewCashoutRequest(id, payload) {
  const { data } = await api.patch(`/cashout/admin/${id}/status`, payload);
  return data;
}

/* =========================
   GERENCIAR CONTAS
========================= */
export async function getAdminAccounts(params = {}) {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await api.get(`/admin/accounts${suffix}`);
  return data;
}

export async function getAdminAccountById(id) {
  const { data } = await api.get(`/admin/accounts/${id}`);
  return data;
}

export async function updateAdminAccountStatus(id, status) {
  const { data } = await api.patch(`/admin/accounts/${id}/status`, { status });
  return data;
}

export async function getAdminAccountSplit(id) {
  const { data } = await api.get(`/users/${id}/split`);
  return data;
}

export async function updateAdminAccountSplit(id, payload) {
  const { data } = await api.patch(`/users/${id}/split`, payload);
  return data;
}

export async function getAdminAccountTransactions(id, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await api.get(`/admin/accounts/${id}/transactions${suffix}`);
  return data;
}

export async function getAdminAccountKyc(id) {
  const { data } = await api.get(`/admin/accounts/${id}/kyc`);
  return data;
}

export async function getAdminProviders() {
  const { data } = await api.get(`/admin/providers`);
  return data;
}

export async function updateAdminAccountRouting(id, payload) {
  const { data } = await api.patch(`/admin/accounts/${id}/routing`, payload);
  return data;
}
