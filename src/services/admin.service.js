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

/* =========================
   SPLIT / TAXAS POR SELLER
========================= */
export async function getAdminAccountSplit(id) {
  const { data } = await api.get(`/admin/accounts/${id}/split`);
  return data;
}

/**
 * payload: {
 *   cashIn:    { pix?: { fixed, percentage }, crypto?: { fixed, percentage } },
 *   cashOut:   { pix?: { fixed, percentage }, crypto?: { fixed, percentage } },
 *   retention: { days, percentage }
 * }
 */
export async function updateAdminAccountSplit(id, payload) {
  const { data } = await api.patch(`/admin/accounts/${id}/split`, payload);
  return data;
}

/* =========================
   ROTEAMENTO DE ADQUIRENTE
========================= */
export async function updateAdminAccountRouting(id, payload) {
  const { data } = await api.patch(`/admin/accounts/${id}/routing`, payload);
  return data;
}

/* =========================
   TRANSAÇÕES E KYC
========================= */
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

/* =========================
   PROVEDORES / ADQUIRENTES
========================= */
export async function getAdminProviders() {
  const { data } = await api.get(`/admin/providers`);
  return data;
}

/* =========================
   CONFIGURAÇÃO PADRÃO
========================= */
export async function getAdminConfig() {
  const { data } = await api.get(`/admin/config`);
  return data;
}

export async function updateAdminConfig(payload) {
  const { data } = await api.patch(`/admin/config`, payload);
  return data;
}

/* =========================
   KYC ADMIN
========================= */
export async function getAdminKycList(status = "") {
  const suffix = status && status !== "all" ? `?status=${status}` : "";
  const { data } = await api.get(`/kyc/admin/list${suffix}`);
  return data;
}

export async function getAdminKycDetail(id) {
  const { data } = await api.get(`/kyc/admin/${id}`);
  return data;
}

export async function reviewAdminKyc(id, payload) {
  const { data } = await api.patch(`/kyc/admin/${id}/review`, payload);
  return data;
}

export async function updateAdminKycCompliance(id, payload) {
  const { data } = await api.patch(`/kyc/admin/${id}/compliance`, payload);
  return data;
}

/* =========================
   COMPLIANCE — RELATÓRIOS
========================= */
export async function getUserComplianceReport(userId, format = "json") {
  const { data } = await api.get(`/admin/compliance/user/${userId}/report?format=${format}`, {
    responseType: format === "pdf" ? "blob" : "json",
  });
  return data;
}

export async function getRiskComplianceReport(params = {}) {
  const q = new URLSearchParams();
  if (params.from)   q.set("from",   params.from);
  if (params.to)     q.set("to",     params.to);
  if (params.format) q.set("format", params.format);
  const { data } = await api.get(`/admin/compliance/risk/report${q.toString() ? `?${q}` : ""}`, {
    responseType: params.format === "pdf" ? "blob" : "json",
  });
  return data;
}

export async function getFinancialComplianceReport(params = {}) {
  const q = new URLSearchParams();
  if (params.from)   q.set("from",   params.from);
  if (params.to)     q.set("to",     params.to);
  if (params.format) q.set("format", params.format);
  const { data } = await api.get(`/admin/compliance/financial/report${q.toString() ? `?${q}` : ""}`, {
    responseType: params.format === "pdf" ? "blob" : "json",
  });
  return data;
}

export async function getAuditTrailReport(params = {}) {
  const q = new URLSearchParams();
  if (params.from)     q.set("from",      params.from);
  if (params.to)       q.set("to",        params.to);
  if (params.entityId) q.set("entityId",  params.entityId);
  if (params.format)   q.set("format",    params.format);
  const { data } = await api.get(`/admin/compliance/audit/report${q.toString() ? `?${q}` : ""}`, {
    responseType: params.format === "pdf" ? "blob" : "json",
  });
  return data;
}

/* =========================
   APROVAÇÕES (MAKER-CHECKER)
========================= */
export async function createApprovalRequest(payload) {
  const { data } = await api.post("/admin/approvals", payload);
  return data;
}

export async function listApprovals(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.actionType) query.set("actionType", params.actionType);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await api.get(`/admin/approvals${suffix}`);
  return data;
}

export async function getApprovalRequest(id) {
  const { data } = await api.get(`/admin/approvals/${id}`);
  return data;
}

export async function approveApprovalRequest(id) {
  const { data } = await api.post(`/admin/approvals/${id}/approve`);
  return data;
}

export async function rejectApprovalRequest(id, reason = "") {
  const { data } = await api.post(`/admin/approvals/${id}/reject`, { reason });
  return data;
}

/* =========================
   CONTABILIDADE
========================= */
export async function getTrialBalance(params = {}) {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to)   q.set("to",   params.to);
  const { data } = await api.get(`/admin/accounting/trial-balance${q.toString() ? `?${q}` : ""}`);
  return data;
}

export async function getIncomeStatement(params = {}) {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to)   q.set("to",   params.to);
  const { data } = await api.get(`/admin/accounting/income-statement${q.toString() ? `?${q}` : ""}`);
  return data;
}

export async function getAccountingCashFlow(params = {}) {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to)   q.set("to",   params.to);
  const { data } = await api.get(`/admin/accounting/cash-flow${q.toString() ? `?${q}` : ""}`);
  return data;
}

export async function getLedgerSummary(params = {}) {
  const q = new URLSearchParams();
  if (params.from)   q.set("from",   params.from);
  if (params.to)     q.set("to",     params.to);
  if (params.period) q.set("period", params.period);
  const { data } = await api.get(`/admin/accounting/summary${q.toString() ? `?${q}` : ""}`);
  return data;
}

export async function getLedgerIntegrity() {
  const { data } = await api.get("/admin/accounting/integrity");
  return data;
}

export function getAccountingExportUrl(params = {}) {
  const q = new URLSearchParams();
  if (params.format) q.set("format", params.format);
  if (params.from)   q.set("from",   params.from);
  if (params.to)     q.set("to",     params.to);
  return `/admin/accounting/export${q.toString() ? `?${q}` : ""}`;
}

/* =========================
   DASHBOARD FINANCEIRO
========================= */
export async function getDashboardOverview(days = 30) {
  const { data } = await api.get(`/admin/dashboard/overview?days=${days}`);
  return data;
}

export async function getDashboardVolumeSeries(days = 30) {
  const { data } = await api.get(`/admin/dashboard/volume?days=${days}`);
  return data;
}

export async function getDashboardRevenueSeries(days = 30) {
  const { data } = await api.get(`/admin/dashboard/revenue?days=${days}`);
  return data;
}

export async function getDashboardTopSellers(days = 30, limit = 8) {
  const { data } = await api.get(`/admin/dashboard/top-sellers?days=${days}&limit=${limit}`);
  return data;
}

export async function getDashboardAttention() {
  const { data } = await api.get(`/admin/dashboard/attention`);
  return data;
}
