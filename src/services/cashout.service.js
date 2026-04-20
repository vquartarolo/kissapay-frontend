import api from "./api";

export async function createCashoutRequest({ amount, pixKey, pixKeyType = "", receiverName = "", receiverDocument = "" }) {
  const { data } = await api.post("/cashout/create", {
    amount,
    pixKey,
    pixKeyType, // backend detecta e valida; enviamos como hint
    receiverName,
    receiverDocument,
  });
  return data;
}
