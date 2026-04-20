import api from "./api";

export async function setup2FA() {
  const { data } = await api.post("/2fa/setup");

  return {
    ...data,
    manualKey: data?.secret || "",
  };
}

export async function enable2FA(code) {
  const normalizedCode = String(code || "").replace(/\D/g, "").slice(0, 6);

  const { data } = await api.post("/2fa/enable", {
    code: normalizedCode,
  });

  return data;
}

export async function disable2FA(code) {
  const normalizedCode = String(code || "").replace(/\D/g, "").slice(0, 6);

  const { data } = await api.post("/2fa/disable", {
    code: normalizedCode,
  });

  return data;
}