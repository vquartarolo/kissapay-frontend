import api from "./api";

export async function getDashboard() {
  const { data } = await api.get("/transactions/dashboard");
  return data.dashboard;
}