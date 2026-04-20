import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import M from "../../master/theme/colors";
import MCard from "../../master/components/MCard";
import MPageHeader from "../../master/components/MPageHeader";
import MEmptyState from "../../master/components/MEmptyState";
import MBadge from "../../master/components/MBadge";
import { getTransactions, acceptWithdrawal, refuseWithdrawal } from "../../services/master.service";

function fmtBRL(v = 0) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
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

const COLS = "1fr 110px 120px 120px 190px";

export default function MasterWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("pending");
  const [acting,      setActing]      = useState(null);

  async function load(status = filter) {
    setLoading(true);
    try {
      const res = await getTransactions({ type: "withdrawal", status, limit: 50 });
      setWithdrawals(res.data ?? []);
    } catch {
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAccept(id) {
    setActing(id);
    try { await acceptWithdrawal(id); await load(filter); } catch {}
    setActing(null);
  }

  async function handleRefuse(id) {
    setActing(id);
    try { await refuseWithdrawal(id); await load(filter); } catch {}
    setActing(null);
  }

  const pending = withdrawals.filter(w => w.status === "pending");

  return (
    <div>
      <MPageHeader
        title="Saques"
        subtitle={
          pending.length > 0
            ? `${pending.length} pendente(s) aguardando aprovação`
            : "Nenhum saque pendente"
        }
        style={{ marginBottom: 20 }}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { v: "pending",   l: "Pendentes" },
          { v: "completed", l: "Aprovados" },
          { v: "failed",    l: "Recusados" },
        ].map(f => (
          <FilterBtn key={f.v} active={filter === f.v} onClick={() => { setFilter(f.v); load(f.v); }}>
            {f.l}
            {f.v === "pending" && pending.length > 0 && filter !== "pending" && (
              <span style={{
                background: M.warn, color: "#000",
                fontSize: 10, fontWeight: 800,
                padding: "1px 6px", borderRadius: 20, marginLeft: 6,
              }}>
                {pending.length}
              </span>
            )}
          </FilterBtn>
        ))}
      </div>

      <MCard style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 16px", borderBottom: `1px solid ${M.border}` }}>
          {["Destino / Tipo", "Valor", "Status", "Data", "Ações"].map(h => (
            <span key={h} style={{ fontSize: 11, color: M.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <MEmptyState loading text="Carregando saques..." />
        ) : withdrawals.length === 0 ? (
          <MEmptyState text="Nenhum saque encontrado." />
        ) : (
          withdrawals.map((w, i) => (
            <div
              key={w._id}
              style={{
                display: "grid", gridTemplateColumns: COLS,
                padding: "14px 16px",
                borderBottom: i < withdrawals.length - 1 ? `1px solid ${M.border}` : "none",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: M.white }}>
                  {w.withdrawal?.type?.toUpperCase() ?? "PIX"}
                </div>
                <div style={{ fontSize: 11, color: M.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                  {w.withdrawal?.target ?? "—"}
                </div>
              </div>

              <span style={{ fontSize: 14, fontWeight: 700, color: M.white }}>
                R$ {fmtBRL(w.amount)}
              </span>

              <div>
                {w.status === "pending"   && <MBadge preset="warning">Pendente</MBadge>}
                {w.status === "completed" && <MBadge preset="success">Aprovado</MBadge>}
                {w.status === "failed"    && <MBadge preset="error">Recusado</MBadge>}
              </div>

              <span style={{ fontSize: 12, color: M.muted }}>
                {new Date(w.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>

              <div style={{ display: "flex", gap: 6 }}>
                {w.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAccept(w._id)}
                      disabled={acting === w._id}
                      style={{
                        flex: 1,
                        background: "rgba(45,134,89,0.12)", border: "1px solid rgba(45,134,89,0.25)",
                        borderRadius: 8, padding: "7px 4px",
                        color: M.green, fontSize: 12, fontWeight: 600,
                        cursor: acting === w._id ? "not-allowed" : "pointer",
                        opacity: acting === w._id ? 0.65 : 1,
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      }}
                    >
                      <CheckCircle2 size={13} /> Aprovar
                    </button>
                    <button
                      onClick={() => handleRefuse(w._id)}
                      disabled={acting === w._id}
                      style={{
                        flex: 1,
                        background: "rgba(229,72,77,0.06)", border: "1px solid rgba(229,72,77,0.20)",
                        borderRadius: 8, padding: "7px 4px",
                        color: M.error, fontSize: 12, fontWeight: 600,
                        cursor: acting === w._id ? "not-allowed" : "pointer",
                        opacity: acting === w._id ? 0.65 : 1,
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      }}
                    >
                      <XCircle size={13} /> Recusar
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: M.dim }}>—</span>
                )}
              </div>
            </div>
          ))
        )}
      </MCard>
    </div>
  );
}
