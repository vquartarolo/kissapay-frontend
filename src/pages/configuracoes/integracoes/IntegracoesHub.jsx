import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Zap } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import C from "../../../constants/colors";
import useIntegrations from "../../../hooks/useIntegrations";
import { INTEGRATIONS, CATEGORIES, filterIntegrations, getCategoryLabel } from "./integrationsData";

// ─── Dot pulsante ─────────────────────────────────────────────────────────────
const PULSE_STYLE = `
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    70%  { transform: scale(1.9); opacity: 0;   }
    100% { transform: scale(1.9); opacity: 0;   }
  }
  .int-pulse::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: #2D8659;
    animation: pulse-ring 2s ease-out infinite;
  }
`;

function StatusDot({ active }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {active && <style>{PULSE_STYLE}</style>}
      <span
        className={active ? "int-pulse" : undefined}
        style={{
          display: "inline-block",
          width: 8, height: 8,
          borderRadius: "50%",
          background: active ? "#2D8659" : "rgba(255,255,255,0.12)",
          position: "relative",
          flexShrink: 0,
        }}
      />
    </span>
  );
}

// ─── Category tab ─────────────────────────────────────────────────────────────
function CategoryTab({ label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: active ? `1px solid ${C.borderStrong}` : `1px solid transparent`,
        background: active ? C.cardSoft : "transparent",
        color: active ? C.white : C.muted,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? C.green + "30" : "rgba(255,255,255,0.06)",
          color: active ? C.greenBright : C.muted,
          fontSize: 11, fontWeight: 700,
          padding: "1px 6px", borderRadius: 99,
          minWidth: 18, textAlign: "center",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────
function IntegrationCard({ integration, isConfigured, isEnabled, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isEnabled && isConfigured;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
        background: C.card,
        border: `1px solid ${hovered ? C.borderStrong : C.border}`,
        borderRadius: 14,
        padding: 0,
        overflow: "hidden",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: active
          ? `0 0 0 1px ${integration.color}30, 0 4px 24px ${integration.color}14`
          : hovered
            ? "0 8px 28px rgba(0,0,0,0.4)"
            : "0 1px 3px rgba(0,0,0,0.25)",
        position: "relative",
      }}
    >
      {/* Accent bar esquerda com cor da marca */}
      <div style={{
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: active ? integration.color : "transparent",
        borderRadius: "14px 0 0 14px",
        transition: "background 0.3s",
      }} />

      <div style={{ padding: "18px 18px 18px 20px" }}>
        {/* Linha superior: nome + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.white, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {integration.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
              {getCategoryLabel(integration.category)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, paddingTop: 2 }}>
            {isConfigured && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: "2px 7px", borderRadius: 99,
                background: active ? "#2D865918" : "rgba(255,255,255,0.05)",
                color: active ? C.greenBright : C.muted,
                border: `1px solid ${active ? "#2D865930" : "rgba(255,255,255,0.08)"}`,
              }}>
                {active ? "Ativo" : "Pausado"}
              </span>
            )}
            <StatusDot active={active} />
          </div>
        </div>

        {/* Descrição */}
        <div style={{
          fontSize: 12,
          color: C.muted,
          lineHeight: 1.55,
          marginBottom: 14,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {integration.description}
        </div>

        {/* CTA */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: isConfigured ? C.greenBright : C.muted,
          fontSize: 12,
          fontWeight: 700,
          transition: "color 0.15s",
        }}>
          {isConfigured ? "Configurado" : "Configurar"}
          <ChevronRight size={12} />
        </div>
      </div>
    </button>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ active, total }) {
  const pct = total === 0 ? 0 : Math.round((active / total) * 100);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      marginBottom: 20,
    }}>
      <Zap size={14} color={C.green} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: C.light, fontWeight: 600 }}>
            {active} de {total} integrações ativas
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${C.green}, ${C.greenBright})`,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function IntegracoesHub({ isMobile }) {
  const navigate = useNavigate();
  const { isConfigured, config } = useIntegrations();

  const [category, setCategory] = useState("all");
  const [search, setSearch]     = useState("");

  const filtered = useMemo(
    () => filterIntegrations(INTEGRATIONS, { category, search }),
    [category, search]
  );

  // contagem de ativas (enabled + configurado)
  const activeCount = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      const c = config[i.id];
      return c?.enabled && isConfigured(i.id);
    }).length;
  }, [config, isConfigured]);

  // contagem por categoria para os tabs
  const countForCat = (catId) =>
    INTEGRATIONS.filter((i) => catId === "all" || i.category === catId).length;

  return (
    <div>
      <PageHeader
        title="Integrações"
        subtitle="Conecte suas ferramentas de marketing, análise e automação."
      />

      {/* Stats */}
      <StatsBar active={activeCount} total={INTEGRATIONS.length} />

      {/* Barra de controles: search + filtros */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        marginBottom: 20,
        alignItems: isMobile ? "stretch" : "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: isMobile ? undefined : "0 0 220px" }}>
          <Search
            size={14}
            color={C.muted}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar integração..."
            style={{
              width: "100%",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "9px 12px 9px 34px",
              color: C.white,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Category tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          paddingBottom: 2,
          scrollbarWidth: "none",
        }}>
          {CATEGORIES.map((cat) => (
            <CategoryTab
              key={cat.id}
              label={cat.label}
              active={category === cat.id}
              count={countForCat(cat.id)}
              onClick={() => setCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 0",
          color: C.muted,
          fontSize: 14,
        }}>
          Nenhuma integração encontrada para "{search}".
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 12,
        }}>
          {filtered.map((integration) => {
            const cfg = config[integration.id];
            return (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isConfigured={isConfigured(integration.id)}
                isEnabled={cfg?.enabled ?? false}
                onClick={() => navigate(`/integracoes/${integration.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
