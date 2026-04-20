import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Video,
  ImageOff,
  Layers,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import { getProdutos, deleteProduto } from "../../services/produtos.service";

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        background: active ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.06)",
        color: active ? C.green : C.muted,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: active ? C.green : C.muted,
          display: "inline-block",
        }}
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function EmptyState({ loading, filtered }) {
  return (
    <div
      style={{
        padding: "56px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {loading ? (
        <>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `2px solid ${C.border}`,
              borderTopColor: C.green,
              animation: "spin 0.7s linear infinite",
              marginBottom: 4,
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: 13, color: C.muted }}>Carregando produtos...</div>
        </>
      ) : (
        <>
          <Package size={32} color={C.dim} strokeWidth={1.5} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>
            {filtered ? "Nenhum produto encontrado" : "Nenhum produto criado ainda"}
          </div>
          <div style={{ fontSize: 12, color: C.dim }}>
            {filtered
              ? "Tente buscar com outros termos."
              : "Crie seu primeiro produto e configure o checkout."}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProdutosList({ isMobile }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState("");

  async function loadProdutos() {
    try {
      setLoading(true);
      const data = await getProdutos({ page: 1, limit: 50 });
      setProdutos(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProdutos();
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Deletar "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setDeleting(id);
      await deleteProduto(id);
      setFeedback(`"${name}" removido com sucesso.`);
      await loadProdutos();
    } catch {
      setFeedback("Erro ao remover o produto.");
    } finally {
      setDeleting(null);
      setTimeout(() => setFeedback(""), 3500);
    }
  }

  const filtered = produtos.filter((p) =>
    !search ||
    String(p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    String(p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <PageHeader
        title="Produtos"
        subtitle="Gerencie seus produtos digitais e configure o checkout de cada um."
        right={
          <Btn icon={<Plus size={15} />} onClick={() => navigate("/produtos/novo")}>
            Novo produto
          </Btn>
        }
      />

      {feedback && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: 13,
            color: feedback.includes("Erro") ? C.error : C.green,
            background: feedback.includes("Erro")
              ? "rgba(229,72,77,0.08)"
              : "rgba(45,134,89,0.08)",
            border: `1px solid ${feedback.includes("Erro") ? "rgba(229,72,77,0.20)" : "rgba(45,134,89,0.20)"}`,
          }}
        >
          {feedback}
        </div>
      )}

      <Card style={{ overflow: "hidden", padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
            {loading ? "—" : `${filtered.length} produto${filtered.length !== 1 ? "s" : ""}`}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.inputDeep,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <Search size={13} color={C.muted} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: C.white,
                  fontSize: 13,
                  fontFamily: "inherit",
                  width: 180,
                }}
              />
            </div>
            <Btn
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={loadProdutos}
            />
          </div>
        </div>

        {loading || filtered.length === 0 ? (
          <EmptyState loading={loading} filtered={!!search && filtered.length === 0} />
        ) : (
          <>
            {!isMobile && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 120px 90px 90px 100px",
                  gap: 12,
                  padding: "10px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                <span />
                <span>Produto</span>
                <span>Preço</span>
                <span>Tipo</span>
                <span>Status</span>
                <span style={{ textAlign: "right" }}>Ações</span>
              </div>
            )}

            {filtered.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: isMobile ? "flex" : "grid",
                  gridTemplateColumns: "48px 1fr 120px 90px 90px 100px",
                  flexDirection: "column",
                  gap: isMobile ? 8 : 12,
                  alignItems: isMobile ? "flex-start" : "center",
                  padding: "14px 20px",
                  borderBottom:
                    idx < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                {/* Thumb */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: C.cardSoft,
                    border: `1px solid ${C.border}`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.images?.[0] ? (
                    <>
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        style={{
                          display: "none",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <ImageOff size={16} color={C.dim} />
                      </div>
                    </>
                  ) : (
                    <ImageOff size={16} color={C.dim} />
                  )}
                </div>

                {/* Nome + descrição */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: C.white,
                      marginBottom: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.description || "Sem descrição"}
                  </div>
                  {p.videoUrl && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                        fontSize: 10,
                        color: C.muted,
                        fontWeight: 700,
                      }}
                    >
                      <Video size={10} />
                      Vídeo
                    </div>
                  )}
                </div>

                {/* Preço */}
                <div style={{ fontSize: 14, fontWeight: 900, color: C.white }}>
                  {fmtBRL((p.price || 0) / 100)}
                </div>

                {/* Tipo */}
                <div style={{ fontSize: 12, color: C.muted }}>
                  {p.type === "recurring" ? "Recorrente" : "Único"}
                </div>

                {/* Status */}
                <div>
                  <StatusPill status={p.status} />
                </div>

                {/* Ações */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: isMobile ? "flex-start" : "flex-end",
                  }}
                >
                  <button
                    title={p.checkoutId ? "Editar checkout" : "Criar / vincular checkout"}
                    onClick={() => p.checkoutId ? navigate(`/builder/${p.checkoutId}`) : navigate(`/produtos/${p.id}`)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1px solid rgba(45,134,89,0.25)`,
                      background: "transparent", color: C.green,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Layers size={13} />
                  </button>
                  <button
                    title={p.checkoutPublicId ? "Ver checkout" : "Checkout indisponível"}
                    onClick={() => p.checkoutPublicId && window.open(`/c/${p.checkoutPublicId}`, "_blank")}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: "transparent",
                      color: p.checkoutPublicId ? C.muted : C.dim,
                      cursor: p.checkoutPublicId ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    title="Editar"
                    onClick={() => navigate(`/produtos/${p.id}`)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: "transparent",
                      color: p.checkoutPublicId ? C.muted : C.dim,
                      cursor: p.checkoutPublicId ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    title="Deletar"
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid rgba(229,72,77,0.20)",
                      background: "transparent",
                      color: C.error,
                      cursor: deleting === p.id ? "not-allowed" : "pointer",
                      opacity: deleting === p.id ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
}
