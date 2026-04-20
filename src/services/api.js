import axios from "axios";

const API_BASE_URL = (() => {
  const env = import.meta.env.VITE_API_URL;
  if (env) return env;
  if (import.meta.env.PROD) {
    throw new Error(
      "[OrionPay] VITE_API_URL não configurado no build de produção. " +
      "Defina esta variável de ambiente antes de fazer o build do frontend."
    );
  }
  return "http://localhost:3000";
})();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    // 🔥 só desloga se for 401 REAL
    if (status === 401) {
      console.warn("Token inválido, fazendo logout...");

      localStorage.removeItem("token");

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);

export default api;