import api from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function verify2FALogin(token, code) {
  const { data } = await api.post("/2fa/verify-login", { token, code });
  return data;
}

export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data;
}

export async function verifyEmailToken(token) {
  const { data } = await api.post("/auth/verify-email", { token });
  return data;
}

export async function resendVerificationEmail(email) {
  const { data } = await api.post("/auth/resend-verification", { email });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, newPassword) {
  const { data } = await api.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return data;
}

export async function getMySessions() {
  const { data } = await api.get("/sessions");
  return data;
}

export async function logoutOtherSessions() {
  const { data } = await api.post("/sessions/logout-others");
  return data;
}

export async function getMySessionsGrouped() {
  const { data } = await api.get("/sessions/grouped");
  return data;
}

export async function revokeSession(sessionId) {
  const { data } = await api.delete(`/sessions/${sessionId}`);
  return data;
}