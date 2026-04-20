import {
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  ShieldCheck,
  Wallet,
  Users,
  ScrollText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import C from "../../constants/colors";
import { NAV } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function getPath(id) {
  const map = {
    dashboard: "/dashboard",
    recebimentos: "/recebimentos",
    wallet: "/wallet",
    produtos: "/produtos",
    checkouts: "/checkouts",
    criarPix: "/cobrancas/pix",
    criarCripto: "/cobrancas/cripto",
    sacar: "/saque/cripto",
    sacarPix: "/saque/pix",
    historico: "/historico-saques",
    apikeys: "/api-keys",
    integracoes: "/integracoes",
    dominios: "/dominios",
    configuracoes: "/configuracoes",
    adminKyc: "/admin/kyc",
    adminWithdrawals: "/admin/withdrawals",
    adminManage: "/admin/manage",
    adminAudit: "/admin/audit",
  };
  return map[id] || "/dashboard";
}

const ICON_COL = 18;

const ADMIN_ITEMS = [
  { id: "adminKyc", label: "KYC", icon: ShieldCheck },
  { id: "adminWithdrawals", label: "Saques / Aprovações", icon: Wallet },
  { id: "adminManage", label: "Gerenciar", icon: Users },
  { id: "adminAudit", label: "Auditoria", icon: ScrollText },
];

function SidebarBtn({
  item,
  isActive,
  isHovered,
  childActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isChild,
  chevron,
  isOpen,
}) {
  const highlight = isActive || isHovered || childActive;
  const accentActive = isActive || childActive;

  const BTN_STYLE = {
    position: "relative",
    width: "100%",
    display: "grid",
    gridTemplateColumns: `${ICON_COL}px 1fr auto`,
    alignItems: "center",
    columnGap: 9,
    padding: "7px 10px 7px 14px",
    marginBottom: 1,
    borderRadius: 8,
    border: "none",
    background: highlight ? C.cardSoft : "transparent",
    color: highlight ? C.white : C.muted,
    fontSize: isChild ? 13.5 : 15,
    fontWeight: highlight ? 700 : 500,
    cursor: "pointer",
    transition: "color 0.1s, background 0.1s",
    textAlign: "left",
    fontFamily: "inherit",
    boxSizing: "border-box",
    letterSpacing: "0.01em",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={BTN_STYLE}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 2,
          height: accentActive ? "52%" : 0,
          borderRadius: 2,
          background: C.green,
          transition: "height 0.15s ease",
        }}
      />

      <item.icon
        size={isChild ? 12 : 14}
        strokeWidth={highlight ? 2.3 : 1.7}
        style={{
          color: accentActive ? C.green : "inherit",
          justifySelf: "center",
          display: "block",
        }}
      />

      <span style={{ lineHeight: 1 }}>{item.label}</span>

      {chevron ? (
        <ChevronDown
          size={11}
          strokeWidth={2.5}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s",
            opacity: 0.5,
          }}
        />
      ) : (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: C.green,
            boxShadow: isActive ? `0 0 6px ${C.green}` : "none",
            opacity: isActive ? 1 : 0,
            transition: "opacity 0.15s",
          }}
        />
      )}
    </button>
  );
}

function NavItem(props) {
  return <SidebarBtn {...props} />;
}

function GroupItem({
  item,
  isOpen,
  isHovered,
  childActive,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}) {
  return (
    <SidebarBtn
      item={item}
      isActive={false}
      isHovered={isHovered}
      childActive={childActive}
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      chevron
      isOpen={isOpen}
    />
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const [hovered, setHovered] = useState(null);

  const isAdmin = ["moderator", "super_moderator", "admin", "master"].includes(
    String(user?.role || "")
  );

  const activeId = useMemo(() => {
    const p = location.pathname;
    if (p === "/saque/pix") return "sacarPix";
    if (p.startsWith("/saque")) return "sacar";
    if (p.startsWith("/recebimentos")) return "recebimentos";
    if (p.startsWith("/wallet")) return "wallet";
    if (p.startsWith("/checkouts")) return "checkouts";
    if (p.startsWith("/produtos") || p.startsWith("/builder")) return "produtos";
    if (p.includes("cobrancas/pix")) return "criarPix";
    if (p.includes("cobrancas/cripto")) return "criarCripto";
    if (p.includes("historico")) return "historico";
    if (p.includes("api-keys")) return "apikeys";
    if (p.startsWith("/integracoes")) return "integracoes";
    if (p.startsWith("/dominios")) return "dominios";
    if (p.includes("configuracoes")) return "configuracoes";
    if (p.includes("/admin/kyc")) return "adminKyc";
    if (p.includes("/admin/withdrawals")) return "adminWithdrawals";
    if (p.includes("/admin/manage")) return "adminManage";
    if (p.includes("/admin/audit")) return "adminAudit";
    return "dashboard";
  }, [location.pathname]);

  useEffect(() => {
    if (["criarPix", "criarCripto"].includes(activeId)) setOpenGroup("criarCobranca");
    else if (["sacar", "sacarPix"].includes(activeId)) setOpenGroup("saque");
    else if (["produtos", "checkouts"].includes(activeId)) setOpenGroup("loja");
  }, [activeId]);

  const mainNav = NAV.filter((i) => {
    if (["apikeys", "integracoes", "dominios", "configuracoes"].includes(i.id)) return false;
    return true;
  });
  const settingsNav = NAV.filter((i) => {
    if (!["apikeys", "integracoes", "dominios", "configuracoes"].includes(i.id)) return false;
    if (isAdmin && ["integracoes", "dominios"].includes(i.id)) return false;
    return true;
  });

  function renderItem(item) {
    if (!item.children) {
      return (
        <NavItem
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          isHovered={hovered === item.id}
          onClick={() => navigate(getPath(item.id))}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
        />
      );
    }

    const isOpen = openGroup === item.id;
    const childActive = item.children.some((c) => activeId === c.id);

    return (
      <div key={item.id}>
        <GroupItem
          item={item}
          isOpen={isOpen}
          isHovered={hovered === item.id}
          childActive={childActive}
          onToggle={() => setOpenGroup(isOpen ? null : item.id)}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
        />

        {isOpen && (
          <div
            style={{
              paddingLeft: 20,
              marginBottom: 2,
              marginTop: 0,
            }}
          >
            {item.children.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                isActive={activeId === child.id}
                isHovered={hovered === child.id}
                onClick={() => navigate(getPath(child.id))}
                onMouseEnter={() => setHovered(child.id)}
                onMouseLeave={() => setHovered(null)}
                isChild
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      style={{
        width: 232,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "22px 16px 18px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(145deg, #1A3828, #0F2118)",
              border: "1px solid rgba(45,134,89,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 15,
                fontWeight: 800,
                background: `linear-gradient(135deg, ${C.gold}, #F0D060)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              O
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.10em",
                color: C.white,
                lineHeight: 1,
              }}
            >
              ORION<span style={{ color: C.gold }}>PAY</span>
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.dim,
                marginTop: 3,
              }}
            >
              Infraestrutura Financeira
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 8px 0" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.dim,
            padding: "10px 12px 5px",
          }}
        >
          Menu
        </div>

        {mainNav.map(renderItem)}

        <div style={{ height: 1, background: C.border, margin: "10px 4px" }} />

        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.dim,
            padding: "2px 12px 5px",
          }}
        >
          Conta
        </div>

        {settingsNav.map(renderItem)}

        {isAdmin && (
          <>
            <div style={{ height: 1, background: C.border, margin: "10px 4px" }} />
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.dim,
                padding: "2px 12px 5px",
              }}
            >
              Área Administrativa
            </div>

            {ADMIN_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                isHovered={hovered === item.id}
                onClick={() => navigate(getPath(item.id))}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </>
        )}
      </nav>

      <div style={{ padding: "10px 8px 16px" }}>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: `${ICON_COL}px 1fr`,
            alignItems: "center",
            columnGap: 9,
            padding: "6px 10px 6px 14px",
            marginBottom: 8,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.muted,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          {theme === "dark" ? (
            <Moon size={14} style={{ justifySelf: "center" }} />
          ) : (
            <Sun size={14} style={{ justifySelf: "center" }} />
          )}
          <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "28px 1fr auto",
            alignItems: "center",
            gap: 9,
            padding: "8px 10px 8px 12px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              overflow: "hidden",
              background: "rgba(45,134,89,0.12)",
              border: "1px solid rgba(45,134,89,0.22)",
              color: C.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 12,
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
              String(user?.name || user?.email || "U").trim().charAt(0).toUpperCase()
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.white,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
              {user?.role || "conta"}
            </div>
          </div>

          <button
            onClick={() => {
              logout?.();
              navigate("/");
            }}
            title="Sair"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
