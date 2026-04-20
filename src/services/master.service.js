import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const LEGACY_BASE = `${API_BASE_URL}/api/master`;
const API_BASE = `${API_BASE_URL}/api`;

function masterToken() {
  return localStorage.getItem("masterToken");
}

function siteToken() {
  return localStorage.getItem("token");
}

const master = axios.create({
  baseURL: LEGACY_BASE,
  headers: { "Content-Type": "application/json" },
});

master.interceptors.request.use((config) => {
  const t = masterToken();
  if (t) {
    config.data = { ...config.data, masterToken: t };
  }
  return config;
});

const adminApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const t = siteToken();

  if (t) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${t}`,
    };
  }

  return config;
});

export async function masterLogin(password) {
  const { data } = await master.post("/auth", { auth: password });
  return data;
}

export async function masterValidate(token) {
  const { data } = await master.post("/validate", { token });
  return data.status;
}

export async function getKpas() {
  const { data } = await master.post("/kpas", {});
  return data.data;
}

export async function getUsers(params = {}) {
  const { data } = await master.post("/users", params);
  return data;
}

export async function updateUser(payload) {
  const { data } = await master.post("/user/update", payload);
  return data;
}

export async function getTransactions(params = {}) {
  const { data } = await master.post("/transactions", params);
  return data;
}

export async function getLastTransactions() {
  const { data } = await master.post("/last-transactions", {});
  return data.data;
}

export async function acceptWithdrawal(withdrawalId) {
  const { data } = await master.post("/withdrawal/accept", { withdrawalId });
  return data;
}

export async function refuseWithdrawal(withdrawalId) {
  const { data } = await master.post("/withdrawal/decline", { withdrawalId });
  return data;
}

export async function getKycQueue(status = "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const { data } = await adminApi.get(`/kyc/admin/list${query}`);
  return data;
}

export async function getKycById(id) {
  const { data } = await adminApi.get(`/kyc/admin/${id}`);
  return data;
}

export async function reviewKycRequest(id, payload) {
  const { data } = await adminApi.patch(`/kyc/admin/${id}/review`, payload);
  return data;
}