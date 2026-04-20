import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, XCircle, Clock,
  Eye, FileText, User, RefreshCcw, Search,
  AlertCircle, ShieldCheck, ShieldAlert, FileBadge, FileClock,
} from "lucide-react";
import M from "../../master/theme/colors";
import MCard from "../../master/components/MCard";
import MPageHeader from "../../master/components/MPageHeader";
import MEmptyState from "../../master/components/MEmptyState";
import { getKycQueue, reviewKycRequest } from "../../services/master.service";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function fileUrl(path) {
  if (!path) return "#";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

function statusConfig(s) {
  if (s === "pending" || s === "under_review")
    return { label: s === "pending" ? "Pendente" : "Em análise", color: M.warn, bg: "rgba(245,197,66,0.12)", icon: <Clock size={12} /> };
  if (s === "approved")
    return { label: "Aprovado", color: M.green, bg: "rgba(45,134,89,0.12)", icon: <CheckCircle2 size={12} /> };
  return { label: "Recusado", color: M.error, bg: "rgba(229,72,77,0.12)", icon: <XCircle size={12} /> };
}

function formatDocumentType(value) {
  const raw = String(value || "").toUpperCase();
  if (raw === "CPF") return "CPF";
  if (raw === "CNPJ") return "CNPJ";
  return raw || "—";
}

function StatCard({ title, value, icon, accentColor, accentBg, accentBorder }) {
  return (
    <div style={{
      background: M.card, border: `1px solid ${M.border}`,
      borderRadius: 14, padding: 16,
      display: "flex", justifyContent: "space-between", gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 12, color: M.muted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.02em" }}>
          {title}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: M.white, lineHeight: 1 }}>
          {value}
        </div>
      </div>
      <div style={{
        width: 42, height: 42, borderRadius: 14, flexShrink: 0,
        background: accentBg, color: accentColor,
        border: `1px solid ${accentBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
    </div>
  );
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

const COLS = "1fr 120px 120px 110px";

export default function MasterKYC() {
  const [kycs,      setKycs]      = useState([]);
  const [filter,    setFilter]    = useState("pending");
  const [selected,  setSelected]  = useState(null);
  const [reason,    setReason]    = useState("");
  const [acting,    setActing]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  async function loadKycs(currentFilter = filter, keepSelectedId = null) {
    try {
      setError("");
      const res = await getKycQueue(currentFilter === "" ? "" : currentFilter);
      const rows = Array.isArray(res?.kyc) ? res.kyc : [];
      setKycs(rows);
      if (keepSelectedId) {
        setSelected(rows.find(item => item._id === keepSelectedId) || null);
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao carregar fila de KYC.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadKycs(filter, selected?._id || null);
  }, [filter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return kycs;
    const q = search.trim().toLowerCase();
    return kycs.filter(item => {
      const name  = String(item?.userId?.name || item?.fullName || "").toLowerCase();
      const email = String(item?.userId?.email || "").toLowerCase();
      const doc   = String(item?.documentNumber || "").toLowerCase();
      return name.includes(q) || email.includes(q) || doc.includes(q);
    });
  }, [kycs, search]);

  const pendingCount      = kycs.filter(k => k.status === "pending").length;
  const underReviewCount  = kycs.filter(k => k.status === "under_review").length;
  const approvedCount     = kycs.filter(k => k.status === "approved").length;
  const rejectedCount     = kycs.filter(k => k.status === "rejected").length;

  async function handleApprove(id) {
    try {
      setActing(id); setError("");
      await reviewKycRequest(id, { decision: "approved" });
      await loadKycs(filter, id);
      setReason("");
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao aprovar KYC.");
    } finally { setActing(null); }
  }

  async function handleReject(id) {
    if (!reason.trim()) return;
    try {
      setActing(id); setError("");
      await reviewKycRequest(id, { decision: "rejected", reason: reason.trim() });
      await loadKycs(filter, id);
      setReason("");
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao recusar KYC.");
    } finally { setActing(null); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0,1fr) 420px" : "1fr", gap: 16 }}>
      {/* Left — list */}
      <div>
        <MPageHeader
          title="KYC — Verificação"
          subtitle="Revisão de identidade, documentos e comprovante de endereço."
          style={{ marginBottom: 20 }}
        />

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
          <StatCard title="Pendentes"  value={pendingCount}     icon={<FileClock   size={18} />} accentColor={M.warn}  accentBg="rgba(245,197,66,0.12)"  accentBorder="rgba(245,197,66,0.22)" />
          <StatCard title="Em análise" value={underReviewCount} icon={<ShieldAlert size={18} />} accentColor={M.warn}  accentBg="rgba(245,197,66,0.12)"  accentBorder="rgba(245,197,66,0.22)" />
          <StatCard title="Aprovados"  value={approvedCount}    icon={<ShieldCheck size={18} />} accentColor={M.green} accentBg="rgba(45,134,89,0.12)"   accentBorder="rgba(45,134,89,0.22)"  />
          <StatCard title="Recusados"  value={rejectedCount}    icon={<FileBadge   size={18} />} accentColor={M.error} accentBg="rgba(229,72,77,0.10)"   accentBorder="rgba(229,72,77,0.22)"  />
        </div>

        {error && (
          <div style={{
            background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.20)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12,
            fontSize: 13, color: M.error,
          }}>
            {error}
          </div>
        )}

        {/* Filters + search */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { v: "pending",      l: "Pendentes"  },
            { v: "under_review", l: "Em análise" },
            { v: "approved",     l: "Aprovados"  },
            { v: "rejected",     l: "Recusados"  },
            { v: "",             l: "Todos"      },
          ].map(f => (
            <FilterBtn key={f.v} active={filter === f.v} onClick={() => { setFilter(f.v); setSelected(null); }}>
              {f.l}
              {f.v === "pending" && pendingCount > 0 && (
                <span style={{
                  background: M.warn, color: "#000",
                  fontSize: 10, fontWeight: 800,
                  padding: "1px 6px", borderRadius: 20, marginLeft: 6,
                }}>
                  {pendingCount}
                </span>
              )}
            </FilterBtn>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flex: "1 1 260px", maxWidth: 360 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: M.card, border: `1px solid ${M.border}`,
              borderRadius: 12, padding: "0 12px", height: 40, flex: 1,
            }}>
              <Search size={14} color={M.muted} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou documento"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: M.white, fontSize: 13, fontFamily: "inherit",
                }}
              />
            </div>
            <button
              onClick={() => { setReloading(true); loadKycs(filter, selected?._id || null); }}
              title="Atualizar fila"
              style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                border: `1px solid ${M.border}`, background: M.card, color: M.muted,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                opacity: reloading ? 0.65 : 1,
              }}
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <MCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 16px", borderBottom: `1px solid ${M.border}` }}>
            {["Usuário", "Documento", "Status", "Data"].map(h => (
              <span key={h} style={{ fontSize: 11, color: M.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <MEmptyState loading text="Carregando fila de KYC..." />
          ) : filtered.length === 0 ? (
            <MEmptyState text="Nenhum KYC encontrado." />
          ) : (
            filtered.map((k, i) => {
              const sc        = statusConfig(k.status);
              const userName  = k?.userId?.name || k?.fullName || "—";
              const userEmail = k?.userId?.email || "—";
              const doc       = k?.documentNumber || "—";

              return (
                <div
                  key={k._id}
                  onClick={() => { setSelected(k); setReason(k?.rejectionReason || ""); }}
                  style={{
                    display: "grid", gridTemplateColumns: COLS,
                    padding: "13px 16px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${M.border}` : "none",
                    alignItems: "center", cursor: "pointer",
                    background: selected?._id === k._id ? "rgba(212,175,55,0.05)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: M.white }}>{userName}</div>
                    <div style={{ fontSize: 11, color: M.muted }}>{userEmail}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: M.white }}>{formatDocumentType(k.documentType)}</div>
                    <div style={{ fontSize: 11, color: M.muted, fontFamily: "monospace" }}>
                      {doc.length > 12 ? `${doc.slice(0, 12)}...` : doc}
                    </div>
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 600,
                    color: sc.color, background: sc.bg,
                    padding: "3px 8px", borderRadius: 20, width: "fit-content",
                  }}>
                    {sc.icon}{sc.label}
                  </span>
                  <span style={{ fontSize: 12, color: M.muted }}>
                    {new Date(k.submittedAt || k.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              );
            })
          )}
        </MCard>
      </div>

      {/* Right — detail panel */}
      {selected && (
        <MCard style={{ padding: 20, height: "fit-content", position: "sticky", top: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: M.white }}>Análise KYC</div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", color: M.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* User header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(45,134,89,0.3), rgba(212,175,55,0.2))",
              border: `1.5px solid ${M.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={20} color={M.muted} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: M.white }}>
                {selected?.userId?.name || selected?.fullName || "—"}
              </div>
              <div style={{ fontSize: 12, color: M.muted }}>{selected?.userId?.email || "—"}</div>
            </div>
          </div>

          {/* Info rows */}
          {[
            { k: "Documento", v: selected?.documentNumber || "—" },
            { k: "Tipo",      v: formatDocumentType(selected?.documentType) },
            { k: "Enviado",   v: new Date(selected?.submittedAt || selected?.createdAt).toLocaleString("pt-BR") },
            { k: "Status",    v: statusConfig(selected?.status).label },
            { k: "Conta",     v: selected?.userId?.accountStatus || "—" },
            { k: "2FA",       v: selected?.userId?.twofaEnabled ? "Ativo" : "Inativo" },
          ].map(r => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${M.border}` }}>
              <span style={{ fontSize: 12, color: M.muted }}>{r.k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: M.white, textAlign: "right" }}>{r.v}</span>
            </div>
          ))}

          {/* Documents */}
          <div style={{ marginTop: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: M.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Documentos enviados
            </div>
            {[
              { label: "Documento",             path: selected?.documentFile    },
              { label: "Selfie",                path: selected?.selfieFile      },
              { label: "Selfie com documento",  path: selected?.livenessFile    },
              { label: "Comprovante de endereço", path: selected?.addressProofFile },
            ]
              .filter(f => Boolean(f.path))
              .map(f => (
                <div
                  key={f.label}
                  onClick={() => window.open(fileUrl(f.path), "_blank", "noopener,noreferrer")}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px",
                    background: M.inputDeep,
                    borderRadius: 10, marginBottom: 6, cursor: "pointer",
                    border: `1px solid ${M.border}`,
                  }}
                >
                  <FileText size={14} color={M.muted} />
                  <span style={{ fontSize: 13, color: M.muted, flex: 1 }}>{f.label}</span>
                  <Eye size={13} color={M.muted} />
                </div>
              ))
            }
          </div>

          {/* Rejection reason display */}
          {selected?.status === "rejected" && selected?.rejectionReason && (
            <div style={{
              background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.20)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 14,
              fontSize: 13, color: M.error,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Motivo da recusa:</div>
              {selected.rejectionReason}
            </div>
          )}

          {/* Actions */}
          {["pending", "under_review"].includes(selected?.status) ? (
            <div style={{ marginTop: 4 }}>
              <button
                onClick={() => handleApprove(selected._id)}
                disabled={acting === selected._id}
                style={{
                  width: "100%", marginBottom: 8,
                  background: "rgba(45,134,89,0.12)", border: "1px solid rgba(45,134,89,0.25)",
                  borderRadius: 12, padding: "12px",
                  color: M.green, fontWeight: 700, fontSize: 14,
                  cursor: acting === selected._id ? "not-allowed" : "pointer",
                  opacity: acting === selected._id ? 0.65 : 1,
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                {acting === selected._id ? "Processando..." : "Aprovar KYC"}
              </button>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: M.muted, marginBottom: 6 }}>
                  Motivo da recusa (obrigatório)
                </div>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Documento ilegível, selfie incorreta..."
                  rows={3}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: M.inputDeep,
                    border: `1px solid ${reason ? "rgba(229,72,77,0.5)" : M.border}`,
                    borderRadius: 10, padding: "10px 12px",
                    color: M.white, fontSize: 13, outline: "none",
                    resize: "none", fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                onClick={() => handleReject(selected._id)}
                disabled={acting === selected._id || !reason.trim()}
                style={{
                  width: "100%",
                  background: "rgba(229,72,77,0.06)", border: "1px solid rgba(229,72,77,0.20)",
                  borderRadius: 12, padding: "12px",
                  color: M.error, fontWeight: 700, fontSize: 14,
                  cursor: !reason.trim() ? "not-allowed" : "pointer",
                  opacity: !reason.trim() ? 0.5 : 1,
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <XCircle size={16} />
                Recusar KYC
              </button>
            </div>
          ) : (
            <div style={{
              background: M.cardSoft, border: `1px solid ${M.border}`,
              borderRadius: 12, padding: "12px 14px",
              fontSize: 12, color: M.muted,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertCircle size={14} />
              Este KYC já foi finalizado.
            </div>
          )}
        </MCard>
      )}
    </div>
  );
}
