import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, X, ChevronRight, ArrowLeft } from "lucide-react";
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
  @keyframes _drawerFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes _slideRight {
    from { transform: translateX(24px); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes _slideLeft {
    from { transform: translateX(-24px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
`;

function DrawerItem({ item, isActive, hasChildren, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 20px 0 24px",
        border: "none",
        background: "transparent",
        color: isActive ? C.white : C.muted,
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        letterSpacing: "0.01em",
        minHeight: 46,
        transition: "color 0.1s",
      }}
    >
      {/* Accent bar */}
      {isActive && (
        <span style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 2,
          height: "38%",
          borderRadius: 2,
          background: C.green,
        }} />
      )}

      {/* Clean icon — no container */}
      <item.icon
        size={16}
        strokeWidth={isActive ? 2.1 : 1.6}
        style={{
          color: isActive ? C.green : "inherit",
          flexShrink: 0,
          opacity: isActive ? 1 : 0.7,
        }}
      />

      <span style={{ flex: 1, lineHeight: 1.3 }}>{item.label}</span>

      {hasChildren && (
        <ChevronRight
          size={13}
          strokeWidth={1.7}
          style={{ color: C.dim, flexShrink: 0, opacity: 0.5 }}
        />
      )}
    </button>
  );
}

export default function MobileDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [subview, setSubview] = useState(null);
  const [slideDir, setSlideDir] = useState(null);

  const isAdmin = ["moderator", "super_moderator", "admin", "master"].includes(
    String(user?.role || "").toLowerCase()
  );

  const activeId = useMemo(() => resolveActive(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      setSubview(null);
      setSlideDir(null);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleItemClick(item) {
    if (item.children) {
      setSlideDir("right");
      setSubview({ title: item.label, items: item.children });
      return;
    }
    navigate(PATH_MAP[item.id] || "/dashboard");
    onClose();
  }

  function handleSubItemClick(id) {
    navigate(PATH_MAP[id] || "/dashboard");
    onClose();
  }

  function handleBack() {
    setSlideDir("left");
    setSubview(null);
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

  const contentAnim = slideDir === "right"
    ? "_slideRight 0.2s ease forwards"
    : slideDir === "left"
      ? "_slideLeft 0.2s ease forwards"
      : "none";

  return (
    <>
      <style>{ANIM}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 400,
          animation: "_drawerFade 0.2s ease forwards",
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
          borderRadius: "22px 22px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -24px 60px rgba(0,0,0,0.5)",
          zIndex: 401,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          animation: "_drawerUp 0.32s cubic-bezier(0.25,0.8,0.25,1) forwards",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}>
          <div style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.12)",
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 20px 12px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          {subview ? (
            <>
              <button
                onClick={handleBack}
                style={{
                  width: 30, height: 30,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  marginRight: 10,
                }}
              >
                <ArrowLeft size={14} strokeWidth={2} />
              </button>
              <span style={{
                flex: 1,
                fontSize: 15,
                fontWeight: 700,
                color: C.white,
                letterSpacing: "-0.01em",
              }}>
                {subview.title}
              </span>
            </>
          ) : (
            <>
              <div style={{
                width: 24, height: 24,
                borderRadius: 6,
                background: "linear-gradient(145deg, #1A3828, #0F2118)",
                border: "1px solid rgba(45,134,89,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginRight: 8,
              }}>
                <span style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 11,
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${C.gold}, #F0D060)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>O</span>
              </div>
              <span style={{
                flex: 1,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: C.white,
              }}>
                ORION<span style={{ color: C.gold }}>PAY</span>
              </span>
            </>
          )}

          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              opacity: 0.7,
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Animated content */}
        <div
          key={subview ? `sub-${subview.title}` : "main"}
          style={{
            flex: 1,
            overflowY: "auto",
            animation: contentAnim,
          }}
        >
          {subview ? (
            <div style={{ padding: "8px 0 16px" }}>
              {subview.items.map((item) => (
                <DrawerItem
                  key={item.id}
                  item={item}
                  isActive={activeId === item.id}
                  hasChildren={false}
                  onClick={() => handleSubItemClick(item.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: "2px 0 16px" }}>
              {visibleSections.map((section, si) => (
                <div key={section.title}>
                  {/* Section label — subtle, no divider line */}
                  <div style={{ padding: "16px 20px 3px" }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.13em",
                      textTransform: "uppercase",
                      color: C.dim,
                    }}>
                      {section.title}
                    </span>
                  </div>

                  {section.items.map((item) => {
                    const childIds = item.children?.map((c) => c.id) ?? [];
                    const isActive = activeId === item.id || childIds.includes(activeId);
                    return (
                      <DrawerItem
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        hasChildren={!!item.children}
                        onClick={() => handleItemClick(item)}
                      />
                    );
                  })}

                  {si < visibleSections.length - 1 && (
                    <div style={{
                      height: 1,
                      background: C.border,
                      margin: "8px 20px 0",
                      opacity: 0.6,
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom, 8px))",
          borderTop: `1px solid ${C.border}`,
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32,
            borderRadius: 9,
            overflow: "hidden",
            background: "rgba(45,134,89,0.1)",
            border: "1px solid rgba(45,134,89,0.18)",
            color: C.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : initials}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.white,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}>
              {user?.name || "Usuário"}
            </div>
            <div style={{
              fontSize: 11,
              color: C.dim,
              marginTop: 1,
              textTransform: "capitalize",
            }}>
              {roleName}
            </div>
          </div>

          {/* Logout — icon only */}
          <button
            onClick={handleLogout}
            title="Sair da conta"
            style={{
              width: 30, height: 30,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              opacity: 0.7,
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
