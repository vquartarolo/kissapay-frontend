import api from "./api";

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function getWallet() {
  const { data } = await api.get("/wallet/me");
  return data.wallet;
}

export async function getTransactions() {
  const { data } = await api.get("/transactions/history?page=1&limit=10");
  return data;
}

export async function updateMySettings(payload) {
  const { data } = await api.patch("/users/me/settings", payload);
  return data;
}

export async function changeMyPassword(payload) {
  const { data } = await api.patch("/users/me/password", payload);
  return data;
}

export async function getTransactionsHistory(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.method) searchParams.set("method", params.method);
  if (params.search) searchParams.set("search", params.search);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  const { data } = await api.get(
    `/transactions/history?${searchParams.toString()}`
  );
  return data;
}