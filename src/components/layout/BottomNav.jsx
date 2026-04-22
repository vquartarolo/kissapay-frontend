import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import C from "../../constants/colors";
import { BOTTOM } from "../../constants/navigation";
import MobileDrawer from "./MobileDrawer";

const PATH_MAP = {
  dashboard:    "/dashboard",
  recebimentos: "/recebimentos",
  sacar:        "/saque/cripto",
};

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const activeId = useMemo(() => {
    const p = location.pathname;
    if (p === "/" || p === "/dashboard")                         return "dashboard";
    if (p.startsWith("/recebimentos"))                           return "recebimentos";
    if (p.startsWith("/saque") || p.startsWith("/cobrancas"))   return "sacar";
    return null;
  }, [location.pathname]);

  function handleTap(id) {
    if (id === "menu") {
      setDrawerOpen(true);
      return;
    }
    navigate(PATH_MAP[id] || "/dashboard");
  }

  return (
    <>
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(13,18,25,0.97)",
          borderTop: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          zIndex: 200,
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {BOTTOM.map(({ id, label, icon: Icon }) => {
          const isActive = activeId === id;
          const isCTA    = id === "sacar";
          const isMenuActive = id === "menu" && drawerOpen;

          if (isCTA) {
            return (
              <button
                key={id}
                onClick={() => handleTap(id)}
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
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: C.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 18px rgba(45,134,89,0.42)",
                    marginTop: -20,
                    border: "1.5px solid rgba(52,160,101,0.55)",
                  }}
                >
                  <Icon size={20} color="#FFFFFF" strokeWidth={2.1} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.white : C.muted,
                    marginTop: 4,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => handleTap(id)}
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
                color={isActive || isMenuActive ? C.white : C.muted}
                strokeWidth={isActive || isMenuActive ? 2.2 : 1.8}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive || isMenuActive ? 700 : 500,
                  color: isActive || isMenuActive ? C.white : C.muted,
                  marginTop: 3,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
