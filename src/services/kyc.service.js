import api from "./api";

export async function submitKyc(formData) {
  const { data } = await api.post("/kyc/submit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function getMyKyc() {
  const { data } = await api.get("/kyc/me");
  return data.kyc;
}