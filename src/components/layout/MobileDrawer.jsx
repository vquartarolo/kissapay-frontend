import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import C from "../../constants/colors";
import { DRAWER_SECTIONS } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";

const PATH_MAP = {
  dashboard:        "/dashboard",
  recebimentos:     "/recebimentos",
  wallet:           "/wallet",
  produtos:         "/produtos",
  checkouts:        "/checkouts",
  criarPix:         "/cobrancas/pix",
  criarCripto:      "/cobrancas/cripto",
  sacar:            "/saque/cripto",
  sacarPix:         "/saque/pix",
  historico:        "/historico-saques",
  apikeys:          "/api-keys",
  integracoes:      "/integracoes",
  dominios:         "/dominios",
  configuracoes:    "/configuracoes",
  adminKyc:         "/admin/kyc",
  adminWithdrawals: "/admin/withdrawals",
  adminManage:      "/admin/manage",
  adminAudit:       "/admin/audit",
  adminConfig:      "/admin/config",
};

function resolveActive(pathname) {
  const p = pathname;
  if (p === "/saque/pix")               return "sacarPix";
  if (p.startsWith("/saque"))           return "sacar";
  if (p.startsWith("/recebimentos"))    return "recebimentos";
  if (p.startsWith("/wallet"))          return "wallet";
  if (p.startsWith("/checkouts"))       return "checkouts";
  if (p.startsWith("/produtos") || p.startsWith("/builder")) return "produtos";
  if (p.includes("cobrancas/pix"))      return "criarPix";
  if (p.includes("cobrancas/cripto"))   return "criarCripto";
  if (p.includes("historico"))          return "historico";
  if (p.includes("api-keys"))           return "apikeys";
  if (p.startsWith("/integracoes"))     return "integracoes";
  if (p.startsWith("/dominios"))        return "dominios";
  if (p.includes("configuracoes"))      return "configuracoes";
  if (p.includes("/admin/kyc"))         return "adminKyc";
  if (p.includes("/admin/withdrawals")) return "adminWithdrawals";
  if (p.includes("/admin/manage"))      return "adminManage";
  if (p.includes("/admin/audit"))       return "adminAudit";
  if (p.includes("/admin/config"))      return "adminConfig";
  return "dashboard";
}

const ANIM = `
  @keyframes _drawerUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes _drawerOverlay {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

export default function MobileDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = ["moderator", "super_moderator", "admin", "master"].includes(
    String(user?.role || "").toLowerCase()
  );

  const activeId = useMemo(() => resolveActive(location.pathname), [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleNav(id) {
    navigate(PATH_MAP[id] || "/dashboard");
    onClose();
  }

  function handleLogout() {
    logout?.();
    navigate("/");
    onClose();
  }

  const visibleSections = DRAWER_SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const initials = String(user?.name || user?.email || "U").trim().charAt(0).toUpperCase();
  const roleName = user?.role
    ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1).toLowerCase()
    : "Conta";

  return (
    <>
      <style>{ANIM}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 400,
          animation: "_drawerOverlay 0.22s ease forwards",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--c-sidebar)",
          borderRadius: "20px 20px 0 0",
          borderTop: `1px solid ${C.borderStrong}`,
          zIndex: 401,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          animation: "_drawerUp 0.3s cubic-bezier(0.32,0.72,0,1) forwards",
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: C.borderStrong,
            }}
          />
        </div>

        {/* Scrollable sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 4px" }}>
          {visibleSections.map((section, si) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.dim,
                  padding: "10px 20px 4px",
                }}
              >
                {section.title}
              </div>

              {section.items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={`${si}-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    style={{
                      position: "relative",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 20px",
                      border: "none",
                      background: isActive ? "var(--c-card-soft)" : "transparent",
                      color: isActive ? C.white : C.muted,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: "60%",
                          borderRadius: 2,
                          background: C.green,
                        }}
                      />
                    )}
                    <item.icon
                      size={16}
                      strokeWidth={isActive ? 2.2 : 1.7}
                      style={{ color: isActive ? C.green : "inherit", flexShrink: 0 }}
                    />
                    <span style={{ lineHeight: 1 }}>{item.label}</span>
                  </button>
                );
              })}

              {si < visibleSections.length - 1 && (
                <div style={{ height: 1, background: C.border, margin: "6px 16px" }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer: user + logout */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: "12px 20px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 8px))",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              overflow: "hidden",
              background: "rgba(45,134,89,0.12)",
              border: "1px solid rgba(45,134,89,0.22)",
              color: C.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              initials
            )}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.white,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {user?.name || "Usuário"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.dim,
                marginTop: 2,
                textTransform: "capitalize",
              }}
            >
              {roleName}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
