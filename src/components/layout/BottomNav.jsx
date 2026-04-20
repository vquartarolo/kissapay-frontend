import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import C from "../../constants/colors";
import { BOTTOM } from "../../constants/navigation";

function getPath(id) {
  const map = {
    dashboard:    "/dashboard",
    recebimentos: "/recebimentos",
    criarCripto:  "/cobrancas/cripto",
    sacar:        "/saque/cripto",
    configuracoes:"/configuracoes",
  };
  return map[id] || "/dashboard";
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = useMemo(() => {
    const p = location.pathname;
    if (p === "/" || p === "/dashboard")           return "dashboard";
    if (p.startsWith("/recebimentos"))             return "recebimentos";
    if (p.startsWith("/cobrancas/cripto"))         return "criarCripto";
    if (p.startsWith("/saque"))                    return "sacar";
    if (p.startsWith("/configuracoes"))            return "configuracoes";
    return "dashboard";
  }, [location.pathname]);

  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: "rgba(13,18,25,0.97)",
      borderTop: `1px solid ${C.border}`,
      backdropFilter: "blur(20px)",
      display: "flex",
      zIndex: 200,
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
    }}>
      {BOTTOM.map(({ id, label, icon: Icon }) => {
        const isActive = activeId === id;
        const isCTA    = id === "sacar";

        if (isCTA) {
          return (
            <button
              key={id}
              onClick={() => navigate(getPath(id))}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 44, height: 44,
                borderRadius: 12,
                background: C.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(45,134,89,0.35)",
                marginTop: -18,
              }}>
                <Icon size={20} color="#FFFFFF" strokeWidth={2} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.white : C.muted,
                marginTop: 4,
              }}>
                {label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={id}
            onClick={() => navigate(getPath(id))}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0 6px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Icon
              size={20}
              color={isActive ? C.white : C.muted}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? C.white : C.muted,
              marginTop: 3,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
