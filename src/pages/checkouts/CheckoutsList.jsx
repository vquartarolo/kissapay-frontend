import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutTemplate,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Layers,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import { getCheckouts, deleteCheckout } from "../../services/checkouts.service";

function ThemePreview({ primaryColor, bgColor }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <div style={{ width: 14, height: 14, borderRadius: 4, background: bgColor || "#FFFFFF", border: "1px solid rgba(0,0,0,0.10)" }} />
      <div style={{ width: 14, height: 14, borderRadius: 4, background: primaryColor || "#2D8659" }} />
    </div>
  );
}

function SectionCount({ sections }) {
  const active = (sections || []).filter((s) => s.enabled).length;
  return (
    <span style={{ fontSize: 12, color: C.muted }}>
      {active} seção{active !== 1 ? "ões" : ""}
    </span>
  );
}

function EmptyState({ loading, filtered }) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {loading ? (
        <>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.green, animation: "spin 0.7s linear infinite", marginBottom: 4 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: 13, color: C.muted }}>Carregando checkouts...</div>
        </>
      ) : (
        <>
          <LayoutTemplate size={32} color={C.dim} strokeWidth={1.5} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>
            {filtered ? "Nenhum checkout encontrado" : "Nenhum checkout criado ainda"}
          </div>
          <div style={{ fontSize: 12, color: C.dim }}>
            {filtered ? "Tente buscar com outros termos." : "Crie seu primeiro template de checkout personalizado."}
          </div>
        </>
      )}
    </div>
  );
}

export default function CheckoutsList({ isMobile }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkouts, setCheckouts] = useState([]);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await getCheckouts();
      setCheckouts(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setCheckouts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Deletar "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setDeleting(id);
      await deleteCheckout(id);
      setFeedback(`"${name}" removido.`);
      await load();
    } catch {
      setFeedback("Erro ao remover o checkout.");
    } finally {
      setDeleting(null);
      setTimeout(() => setFeedback(""), 3500);
    }
  }

  const filtered = checkouts.filter((c) =>
    !search || String(c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="page">
      <PageHeader
        title="Checkouts"
        subtitle="Crie e personalize templates de checkout. Vincule a um produto quando estiver pronto."
        right={
          <Btn icon={<Plus size={15} />} onClick={() => navigate("/builder/new")}>
            Novo checkout
          </Btn>
        }
      />

      {feedback && (
        <div style={{
          marginBottom: 16, padding: "12px 14px", borderRadius: 12, fontSize: 13,
          color: feedback.includes("Erro") ? C.error : C.green,
          background: feedback.includes("Erro") ? "rgba(229,72,77,0.08)" : "rgba(45,134,89,0.08)",
          border: `1px solid ${feedback.includes("Erro") ? "rgba(229,72,77,0.20)" : "rgba(45,134,89,0.20)"}`,
        }}>
          {feedback}
        </div>
      )}

      <Card style={{ overflow: "hidden", padding: 0 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
            {loading ? "—" : `${filtered.length} checkout${filtered.length !== 1 ? "s" : ""}`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.inputDeep, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px" }}>
              <Search size={13} color={C.muted} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar checkout..."
                style={{ background: "none", border: "none", outline: "none", color: C.white, fontSize: 13, fontFamily: "inherit", width: 180 }}
              />
            </div>
            <Btn variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={load} />
          </div>
        </div>

        {/* Column headers */}
        {!loading && filtered.length > 0 && !isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 110px 120px 88px", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Nome</span>
            <span>Tema</span>
            <span>Seções</span>
            <span>Criado em</span>
            <span style={{ textAlign: "right" }}>Ações</span>
          </div>
        )}

        {loading || filtered.length === 0 ? (
          <EmptyState loading={loading} filtered={!!search && filtered.length === 0} />
        ) : (
          filtered.map((co, idx) => (
            <div key={co.id}
              style={{ display: isMobile ? "flex" : "grid", gridTemplateColumns: "1fr 100px 110px 120px 88px", flexDirection: "column", gap: isMobile ? 8 : 12, alignItems: isMobile ? "flex-start" : "center", padding: "14px 20px", borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>

              {/* Nome */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {co.name || "Checkout sem título"}
                </div>
                <div style={{ fontSize: 11, color: C.dim }}>ID: {co.id}</div>
              </div>

              {/* Tema (preview de cores) */}
              <div>
                <ThemePreview
                  primaryColor={co.config?.theme?.primaryColor}
                  bgColor={co.config?.theme?.bgColor}
                />
              </div>

              {/* Seções ativas */}
              <div>
                <SectionCount sections={co.config?.sections} />
              </div>

              {/* Data */}
              <div style={{ fontSize: 12, color: C.muted }}>
                {fmtDate(co.createdAt)}
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 6, justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                <button
                  title="Editar no builder"
                  onClick={() => navigate(`/builder/${co.id}`)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(45,134,89,0.25)`, background: "transparent", color: C.green, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Layers size={13} />
                </button>
                <button
                  title="Renomear / editar"
                  onClick={() => navigate(`/builder/${co.id}`)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={13} />
                </button>
                <button
                  title="Deletar"
                  onClick={() => handleDelete(co.id, co.name)}
                  disabled={deleting === co.id}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(229,72,77,0.20)", background: "transparent", color: C.error, cursor: deleting === co.id ? "not-allowed" : "pointer", opacity: deleting === co.id ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
