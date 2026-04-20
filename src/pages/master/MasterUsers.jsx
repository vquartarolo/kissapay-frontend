import { useEffect, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import M from "../../master/theme/colors";
import MCard from "../../master/components/MCard";
import MPageHeader from "../../master/components/MPageHeader";
import MEmptyState from "../../master/components/MEmptyState";
import MBadge from "../../master/components/MBadge";
import { getUsers, updateUser } from "../../services/master.service";

function fmtBRL(v = 0) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 20,
        border: `1px solid ${active ? M.gold : M.border}`,
        background: active ? "rgba(212,175,55,0.12)" : "transparent",
        color: active ? M.gold : M.muted,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

export default function MasterUsers() {
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);

  async function load(p = 1, s = search, f = filter) {
    setLoading(true);
    try {
      const res = await getUsers({ search: s, status: f, page: p, limit: 20 });
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggleStatus(user) {
    setSaving(true);
    try {
      await updateUser({ userId: user._id, status: !user.status });
      await load(page);
      if (selected?._id === user._id) setSelected(u => ({ ...u, status: !u.status }));
    } catch {}
    setSaving(false);
  }

  const COLS = "1fr 130px 90px 44px";

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 16 }}>
      {/* List */}
      <div>
        <MPageHeader
          title="Usuários"
          subtitle={`${total} cadastrado${total !== 1 ? "s" : ""}`}
          style={{ marginBottom: 20 }}
        />

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            display: "flex", alignItems: "center", gap: 8,
            background: M.card, border: `1px solid ${M.border}`,
            borderRadius: 12, padding: "10px 14px",
          }}>
            <Search size={15} color={M.muted} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load(1)}
              placeholder="Buscar nome ou email..."
              style={{
                background: "none", border: "none",
                color: M.white, fontSize: 14,
                outline: "none", width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>
          {[
            { v: "",      l: "Todos"      },
            { v: "true",  l: "Ativos"     },
            { v: "false", l: "Bloqueados" },
          ].map(({ v, l }) => (
            <FilterBtn key={v} active={filter === v} onClick={() => { setFilter(v); load(1, search, v); }}>
              {l}
            </FilterBtn>
          ))}
        </div>

        <MCard style={{ padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: COLS,
            padding: "10px 16px", borderBottom: `1px solid ${M.border}`,
          }}>
            {["Usuário", "Saldo", "Status", ""].map(h => (
              <span key={h} style={{ fontSize: 11, color: M.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <MEmptyState loading text="Carregando usuários..." />
          ) : users.length === 0 ? (
            <MEmptyState text="Nenhum usuário encontrado." />
          ) : (
            users.map((u, i) => (
              <div
                key={u._id}
                onClick={() => setSelected(u)}
                style={{
                  display: "grid", gridTemplateColumns: COLS,
                  padding: "13px 16px",
                  borderBottom: i < users.length - 1 ? `1px solid ${M.border}` : "none",
                  alignItems: "center",
                  cursor: "pointer",
                  background: selected?._id === u._id ? "rgba(212,175,55,0.05)" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: M.white }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: M.muted }}>{u.email}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: M.white }}>
                  R$ {fmtBRL(u.wallet?.available)}
                </div>
                <MBadge preset={u.status ? "success" : "error"}>
                  {u.status ? "Ativo" : "Bloqueado"}
                </MBadge>
                <ChevronRight size={14} color={M.muted} />
              </div>
            ))
          )}
        </MCard>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
            {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).map(p => (
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

      {/* Detail panel */}
      {selected && (
        <MCard style={{ padding: 20, height: "fit-content", position: "sticky", top: 20 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: M.white }}>Detalhes</div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "none", border: "none",
                color: M.muted, cursor: "pointer",
                fontSize: 20, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, marginBottom: 14,
            background: `linear-gradient(135deg, rgba(45,134,89,0.3), rgba(212,175,55,0.3))`,
            border: `2px solid ${M.green}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: M.green }}>
              {selected.name?.charAt(0).toUpperCase()}
            </span>
          </div>

          {[
            { k: "Nome",   v: selected.name  },
            { k: "Email",  v: selected.email },
            { k: "Saldo",  v: `R$ ${fmtBRL(selected.wallet?.available)}` },
            { k: "Status", v: selected.status ? "Ativo" : "Bloqueado" },
            { k: "ID",     v: String(selected._id).slice(-10) },
          ].map(r => (
            <div
              key={r.k}
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "9px 0", borderBottom: `1px solid ${M.border}`,
              }}
            >
              <span style={{ fontSize: 12, color: M.muted }}>{r.k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: M.white }}>{r.v}</span>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => handleToggleStatus(selected)}
              disabled={saving}
              style={{
                width: "100%",
                background: selected.status ? "rgba(229,72,77,0.08)" : "rgba(45,134,89,0.12)",
                border: `1px solid ${selected.status ? "rgba(229,72,77,0.20)" : "rgba(45,134,89,0.20)"}`,
                borderRadius: 12, padding: "12px",
                color: selected.status ? M.error : M.green,
                fontWeight: 700, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.65 : 1,
                fontFamily: "inherit",
                transition: "opacity 0.15s",
              }}
            >
              {saving ? "Salvando..." : selected.status ? "Bloquear usuário" : "Aprovar usuário"}
            </button>
          </div>
        </MCard>
      )}
    </div>
  );
}
