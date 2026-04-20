import api from "./api";

/* -----------------------------------
   COBRANÇA EM CRIPTO
----------------------------------- */
export async function createCryptoCharge({
  amountBRL,
  amountCrypto,
  coin,
  network,
  quote,
  description,
}) {
  const { data } = await api.post("/transactions/create/crypto", {
    amountBRL,
    amountCrypto,
    coin,
    network,
    quote,
    description,
  });

  return data;
}

/* -----------------------------------
   SAQUE EM CRIPTO
   Mantido para não quebrar a outra tela
----------------------------------- */
export async function createPayout({
  amount,
  currency,
  network,
  address,
  reference,
}) {
  const { data } = await api.post("/crypto/payout", {
    amount,
    currency,
    network,
    address,
    reference,
  });

  return data;
}

export async function getPayout(id) {
  const { data } = await api.get(`/crypto/payout/${id}`);
  return data;
}