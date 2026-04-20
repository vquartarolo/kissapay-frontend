// ─── ORIONPAY MOCK DATA ────────────────────────────────────────────

// ── Shared 90-day chart data generator ───────────────────────────
// Used by Dashboard, Recebimentos, Historico
export function buildVolumeData(seed = 1) {
  const result = [];
  const start  = new Date("2026-01-06");

  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);

    const t       = i / 89;
    const base    = 100 + t * 890_000;
    // Different seeds create different but realistic curves
    const wave    = Math.sin(i * 0.45 * seed) * base * 0.22;
    const noise   = (Math.sin(i * 17.3 + seed * 5.1) * 0.5 + Math.sin(i * 7.7 + seed * 2.3) * 0.5) * base * 0.12;
    const weekend = [0, 6].includes(d.getDay()) ? 0.55 : 1;
    const v       = Math.max(100, Math.round((base + wave + noise) * weekend));

    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

    result.push({ date: label, month, v, full: d });
  }
  return result;
}

// Pre-generated so it doesn't change on re-render
export const VOLUME_DATA  = buildVolumeData(1);  // recebimentos
export const SAQUE_DATA   = buildVolumeData(2);  // historico saques (lower volume)

// ── API Keys ──────────────────────────────────────────────────────
export const apiKeys = [
  { id: 1, name: "Produção",        key: "pk_live_xxxxxxxxxxx4f3a", created: "01/01/2025", active: true  },
  { id: 2, name: "Desenvolvimento", key: "pk_test_xxxxxxxxxxx9b2c", created: "15/01/2025", active: true  },
];

// ── Legacy chart data (kept for compatibility) ────────────────────
export const chartData = [
  { day: "Seg", vol: 1200 },
  { day: "Ter", vol: 2800 },
  { day: "Qua", vol: 1900 },
  { day: "Qui", vol: 3400 },
  { day: "Sex", vol: 2100 },
  { day: "Sab", vol: 4200 },
  { day: "Dom", vol: 3800 },
];

export const transactions = [
  { id: 1, type: "PIX",  desc: "PIX pagamento",  amount: "R$ 420",   status: "confirmed",  time: "14:32", date: "Hoje"  },
  { id: 2, type: "PIX",  desc: "PIX pagamento",  amount: "R$ 1.200", status: "confirmed",  time: "12:10", date: "Hoje"  },
  { id: 3, type: "PIX",  desc: "PIX pagamento",  amount: "R$ 90",    status: "pending",    time: "10:05", date: "Hoje"  },
  { id: 4, type: "CARD", desc: "Cartao credito", amount: "R$ 540",   status: "confirmed",  time: "09:44", date: "Ontem" },
  { id: 5, type: "PIX",  desc: "PIX pagamento",  amount: "R$ 320",   status: "confirmed",  time: "18:22", date: "Ontem" },
  { id: 6, type: "PIX",  desc: "PIX pagamento",  amount: "R$ 1.150", status: "confirmed",  time: "15:30", date: "Ontem" },
  { id: 7, type: "CARD", desc: "Cartao debito",  amount: "R$ 200",   status: "failed",     time: "11:10", date: "12/06" },
];

export const withdrawals = [
  { id: 1, coin: "USDT", network: "TRC20", amount: "390 USDT",   brl: "R$ 1.980", status: "completed",  date: "10/03/2025" },
  { id: 2, coin: "USDT", network: "TRC20", amount: "150 USDT",   brl: "R$ 762",   status: "processing", date: "09/03/2025" },
  { id: 3, coin: "BTC",  network: "BTC",   amount: "0.0082 BTC", brl: "R$ 3.200", status: "completed",  date: "07/03/2025" },
  { id: 4, coin: "ETH",  network: "ERC20", amount: "0.52 ETH",   brl: "R$ 5.400", status: "completed",  date: "04/03/2025" },
  { id: 5, coin: "USDT", network: "BEP20", amount: "200 USDT",   brl: "R$ 1.016", status: "failed",     date: "01/03/2025" },
];
