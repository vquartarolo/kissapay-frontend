import { useEffect, useState } from "react";
import M from "../../master/theme/colors";
import MCard from "../../master/components/MCard";
import MPageHeader from "../../master/components/MPageHeader";
import MEmptyState from "../../master/components/MEmptyState";
import MBadge from "../../master/components/MBadge";
import { getTransactions } from "../../services/master.service";

function fmtBRL(v = 0) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function txLabel(tx) {
  if (tx.type === "withdrawal") return "Saque";
  if (tx.method === "card") return "Cartão";
  return "PIX";
}

function statusPreset(s) {
  if (s === "completed") return "success";
  if (s === "pending")   return "warning";
  return "error";
}

function statusLabel(s) {
  if (s === "completed") return "Concluído";
  if (s === "pending")   return "Pendente";
  return "Falhou";
}

function FilterBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px", borderRadius: 20,
        border: `1px solid ${active ? M.gold : M.border}`,
        background: active ? "rgba(212,175,55,0.12)" : "transparent",
        color: active ? M.gold : M.muted,
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

const COLS = "140px 1fr 120px 110px 130px";

export default function MasterTransactions() {
  const [txs,     setTxs]     = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("");
  const [page,    setPage]    = useState(1);

  async function load(p = 1, f = filter) {
    setLoading(true);
    try {
      const res = await getTransactions({ status: f || undefined, page: p, limit: 30 });
      setTxs(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <MPageHeader
        title="Transações"
        subtitle={`${total} no total`}
        style={{ marginBottom: 20 }}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { v: "",          l: "Todas"     },
          { v: "completed", l: "Aprovadas" },
          { v: "pending",   l: "Pendentes" },
          { v: "failed",    l: "Falhas"    },
        ].map(f => (
          <FilterBtn key={f.v} active={filter === f.v} onClick={() => { setFilter(f.v); setPage(1); load(1, f.v); }}>
            {f.l}
          </FilterBtn>
        ))}
      </div>

      <MCard style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 16px", borderBottom: `1px solid ${M.border}` }}>
          {["ID", "Tipo / Método", "Valor", "Status", "Data"].map(h => (
            <span key={h} style={{ fontSize: 11, color: M.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <MEmptyState loading text="Carregando transações..." />
        ) : txs.length === 0 ? (
          <MEmptyState text="Nenhuma transação encontrada." />
        ) : (
          txs.map((tx, i) => (
            <div
              key={tx._id}
              style={{
                display: "grid", gridTemplateColumns: COLS,
                padding: "13px 16px",
                borderBottom: i < txs.length - 1 ? `1px solid ${M.border}` : "none",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, fontFamily: "monospace", color: M.muted }}>
                {String(tx._id).slice(-10)}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: M.white }}>{txLabel(tx)}</div>
                <div style={{ fontSize: 11, color: M.muted }}>{tx.type}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: M.white }}>
                R$ {fmtBRL(tx.amount)}
              </span>
              <MBadge preset={statusPreset(tx.status)}>{statusLabel(tx.status)}</MBadge>
              <span style={{ fontSize: 12, color: M.muted }}>
                {new Date(tx.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </MCard>

      {/* Pagination */}
      {total > 30 && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
          {Array.from({ length: Math.min(Math.ceil(total / 30), 10) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => { setPage(p); load(p); }}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${p === page ? M.gold : M.border}`,
                background: p === page ? "rgba(212,175,55,0.12)" : "transparent",
                color: p === page ? M.gold : M.muted,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
