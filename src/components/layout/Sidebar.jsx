import {
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  ShieldCheck,
  Wallet,
  Users,
  ScrollText,
  Settings,
  LayoutDashboard,
  GitPullRequestArrow,
  BookOpen,
  FileText,
  ShieldAlert,
  ArrowDownToLine,
  BarChart3,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import C from "../../constants/colors";
import { NAV } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import useAdminBadges from "../../hooks/useAdminBadges";

/* ─── Path map ──────────────────────────────────────────────────── */
function getPath(id) {
  const map = {
    dashboard:            "/dashboard",
    recebimentos:         "/recebimentos",
    wallet:               "/wallet",
    produtos:             "/produtos",
    checkouts:            "/checkouts",
    criarPix:             "/cobrancas/pix",
    criarCripto:          "/cobrancas/cripto",
    sacar:                "/saque/cripto",
    sacarPix:             "/saque/pix",
    historico:            "/historico-saques",
    apikeys:              "/api-keys",
    integracoes:          "/integracoes",
    dominios:             "/dominios",
    configuracoes:        "/configuracoes",
    adminDashboard:       "/admin/dashboard",
    adminKyc:             "/admin/kyc",
    adminWithdrawals:     "/admin/withdrawals",
    adminManage:          "/admin/manage",
    adminAudit:           "/admin/audit",
    adminConfig:          "/admin/config",
    adminApprovals:       "/admin/approvals",
    adminAccounting:      "/admin/accounting",
    adminCompliance:      "/admin/compliance",
    adminSecurity:        "/admin/security",
    adminReconciliation:  "/admin/reconciliation",
    adminReports:         "/admin/reports",
  };
  return map[id] || "/dashboard";
}

/* ─── Admin groups ──────────────────────────────────────────────── */
const ADMIN_GROUPS = [
  {
    id:    "overview",
    label: "Visão Geral",
    items: [
      { id: "adminDashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id:    "operacoes",
    label: "Operações",
    items: [
      { id: "adminWithdrawals",    label: "Saques",        icon: ArrowDownToLine,     badge: "withdrawals", badgeSeverity: "blue"  },
      { id: "adminApprovals",      label: "Aprovações",    icon: GitPullRequestArrow, badge: "approvals",   badgeSeverity: "blue"  },
      { id: "adminReconciliation", label: "Reconciliação", icon: RefreshCcw                                                        },
    ],
  },
  {
    id:    "compliance",
    label: "Compliance",
    items: [
      { id: "adminKyc",        label: "KYC / KYB",  icon: ShieldCheck, badge: "kyc",  badgeSeverity: "amber" },
      { id: "adminCompliance", label: "Compliance",  icon: FileText                                           },
      { id: "adminAudit",      label: "Auditoria",   icon: ScrollText                                         },
    ],
  },
  {
    id:    "financeiro",
    label: "Financeiro",
    items: [
      { id: "adminAccounting", label: "Contabilidade", icon: BookOpen  },
      { id: "adminReports",    label: "Relatórios",    icon: BarChart3 },
    ],
  },
  {
    id:    "seguranca",
    label: "Segurança",
    items: [
      { id: "adminSecurity", label: "SOC / Segurança", icon: ShieldAlert, badge: "security", badgeSeverity: "red" },
      { id: "adminManage",   label: "Usuários",         icon: Users                                                },
      { id: "adminConfig",   label: "Configurações",    icon: Settings                                             },
    ],
  },
];

const ICON_COL = 18;

/* ─── NavBadge ──────────────────────────────────────────────────── */
function NavBadge({ count, severity = "blue" }) {
  if (!count || count <= 0) return null;
  const COLORS = {
    blue:  { color: "#3B82F6", bg: "rgba(59,130,246,0.18)",  glow: "none"                                    },
    amber: { color: "#F59E0B", bg: "rgba(245,158,11,0.18)",  glow: "0 0 8px rgba(245,158,11,0.45)"           },
    red:   { color: "#EF4444", bg: "rgba(239,68,68,0.18)",   glow: "0 0 8px rgba(239,68,68,0.45)"            },
  };
  const { color, bg, glow } = COLORS[severity] || COLORS.blue;
  return (
    <span
      aria-label={`${count} pendentes`}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        minWidth:       18,
        height:         17,
        borderRadius:   99,
        background:     bg,
        color,
        fontSize:       9,
        fontWeight:     800,
        padding:        "0 5px",
        flexShrink:     0,
        letterSpacing:  "0.02em",
        border:         `1px solid ${color}30`,
        boxShadow:      glow,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ─── SidebarBtn ────────────────────────────────────────────────── */
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
  badge,
}) {
  const highlight    = isActive || isHovered || childActive;
  const accentActive = isActive || childActive;

  const BTN_STYLE = {
    position:             "relative",
    width:                "100%",
    display:              "grid",
    gridTemplateColumns:  `${ICON_COL}px 1fr auto`,
    alignItems:           "center",
    columnGap:            9,
    padding:              "7px 10px 7px 14px",
    marginBottom:         1,
    borderRadius:         8,
    border:               "none",
    background:           isActive
      ? "linear-gradient(90deg, rgba(45,134,89,0.14) 0%, rgba(45,134,89,0.04) 100%)"
      : highlight
        ? "rgba(255,255,255,0.04)"
        : "transparent",
    color:                highlight ? C.white : C.muted,
    fontSize:             isChild ? 13 : 13.5,
    fontWeight:           highlight ? 700 : 500,
    cursor:               "pointer",
    transition:           "color 0.12s, background 0.12s, transform 0.1s",
    textAlign:            "left",
    fontFamily:           "inherit",
    boxSizing:            "border-box",
    letterSpacing:        "0.01em",
    transform:            isHovered && !isActive ? "translateX(1px)" : "translateX(0)",
    boxShadow:            isActive ? "inset 0 0 0 1px rgba(45,134,89,0.15)" : "none",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={BTN_STYLE}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active accent bar */}
      <span
        style={{
          position:     "absolute",
          left:         0,
          top:          "50%",
          transform:    "translateY(-50%)",
          width:        accentActive ? 3 : 0,
          height:       accentActive ? "56%" : 0,
          borderRadius: 2,
          background:   `linear-gradient(180deg, ${C.green}, rgba(45,134,89,0.4))`,
          boxShadow:    accentActive ? `0 0 8px rgba(45,134,89,0.6)` : "none",
          transition:   "width 0.12s ease, height 0.12s ease, box-shadow 0.12s ease",
        }}
      />

      {/* Icon with subtle bg when active */}
      <span
        style={{
          justifySelf:    "center",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          22,
          height:         22,
          borderRadius:   6,
          background:     accentActive ? "rgba(45,134,89,0.12)" : "transparent",
          transition:     "background 0.12s",
          flexShrink:     0,
        }}
      >
        <item.icon
          size={isChild ? 12 : 13}
          strokeWidth={highlight ? 2.4 : 1.8}
          style={{
            color:   accentActive ? C.green : "inherit",
            display: "block",
          }}
        />
      </span>

      <span style={{ lineHeight: 1 }}>{item.label}</span>

      {chevron ? (
        <ChevronDown
          size={11}
          strokeWidth={2.5}
          style={{
            transform:  isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s",
            opacity:    0.4,
          }}
        />
      ) : badge ? (
        <NavBadge count={badge.count} severity={badge.severity} />
      ) : (
        <span
          style={{
            width:        5,
            height:       5,
            borderRadius: "50%",
            background:   C.green,
            boxShadow:    isActive ? `0 0 8px ${C.green}` : "none",
            opacity:      isActive ? 1 : 0,
            transition:   "opacity 0.15s, box-shadow 0.15s",
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

/* ─── Group label ───────────────────────────────────────────────── */
function AdminGroupLabel({ label, first = false }) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            7,
        padding:        first ? "6px 12px 3px" : "10px 12px 3px",
      }}
    >
      <span
        style={{
          flex:       1,
          height:     1,
          background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)`,
        }}
      />
      <span
        style={{
          fontSize:      8,
          fontWeight:    800,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color:         "rgba(90,106,126,0.7)",
          whiteSpace:    "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Main Sidebar ──────────────────────────────────────────────── */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const [hovered,   setHovered]   = useState(null);

  const isAdmin = ["moderator", "super_moderator", "admin", "master"].includes(
    String(user?.role || "")
  );

  const badges = useAdminBadges(isAdmin);

  const totalAdminPending = useMemo(
    () => badges.kyc + badges.withdrawals + badges.approvals + badges.security,
    [badges]
  );

  const activeId = useMemo(() => {
    const p = location.pathname;
    if (p === "/saque/pix")                  return "sacarPix";
    if (p.startsWith("/saque"))              return "sacar";
    if (p.startsWith("/recebimentos"))       return "recebimentos";
    if (p.startsWith("/wallet"))             return "wallet";
    if (p.startsWith("/checkouts"))          return "checkouts";
    if (p.startsWith("/produtos") || p.startsWith("/builder")) return "produtos";
    if (p.includes("cobrancas/pix"))         return "criarPix";
    if (p.includes("cobrancas/cripto"))      return "criarCripto";
    if (p.includes("historico"))             return "historico";
    if (p.includes("api-keys"))              return "apikeys";
    if (p.startsWith("/integracoes"))        return "integracoes";
    if (p.startsWith("/dominios"))           return "dominios";
    if (p.includes("configuracoes"))         return "configuracoes";
    if (p.includes("/admin/dashboard"))      return "adminDashboard";
    if (p.includes("/admin/kyc"))            return "adminKyc";
    if (p.includes("/admin/withdrawals"))    return "adminWithdrawals";
    if (p.includes("/admin/manage"))         return "adminManage";
    if (p.includes("/admin/audit"))          return "adminAudit";
    if (p.includes("/admin/config"))         return "adminConfig";
    if (p.includes("/admin/approvals"))      return "adminApprovals";
    if (p.includes("/admin/accounting"))     return "adminAccounting";
    if (p.includes("/admin/compliance"))     return "adminCompliance";
    if (p.includes("/admin/security"))       return "adminSecurity";
    if (p.includes("/admin/reconciliation")) return "adminReconciliation";
    if (p.includes("/admin/reports"))        return "adminReports";
    return "dashboard";
  }, [location.pathname]);

  useEffect(() => {
    if (["criarPix", "criarCripto"].includes(activeId)) setOpenGroup("criarCobranca");
    else if (["sacar", "sacarPix"].includes(activeId))  setOpenGroup("saque");
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

    const isOpen     = openGroup === item.id;
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
          <div style={{ paddingLeft: 20, marginBottom: 2, marginTop: 0 }}>
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
        width:       232,
        background:  C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display:     "flex",
        flexDirection: "column",
        height:      "100vh",
        position:    "sticky",
        top:         0,
        flexShrink:  0,
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding:      "22px 16px 18px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width:          32,
              height:         32,
              borderRadius:   9,
              background:     "linear-gradient(145deg, #1A3828, #0F2118)",
              border:         "1px solid rgba(45,134,89,0.25)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <span
              style={{
                fontFamily:             "'Playfair Display', Georgia, serif",
                fontSize:               15,
                fontWeight:             800,
                background:             `linear-gradient(135deg, ${C.gold}, #F0D060)`,
                WebkitBackgroundClip:   "text",
                WebkitTextFillColor:    "transparent",
              }}
            >
              O
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily:    "'Playfair Display', Georgia, serif",
                fontSize:      13,
                fontWeight:    800,
                letterSpacing: "0.10em",
                color:         C.white,
                lineHeight:    1,
              }}
            >
              ORION<span style={{ color: C.gold }}>PAY</span>
            </div>
            <div
              style={{
                fontSize:      8,
                fontWeight:    600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color:         C.dim,
                marginTop:     3,
              }}
            >
              Infraestrutura Financeira
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 8px 0" }}>
        <div
          style={{
            fontSize:      9,
            fontWeight:    700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:         C.dim,
            padding:       "10px 12px 5px",
          }}
        >
          Menu
        </div>

        {mainNav.map(renderItem)}

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, margin: "10px 4px" }} />

        <div
          style={{
            fontSize:      9,
            fontWeight:    700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:         C.dim,
            padding:       "2px 12px 5px",
          }}
        >
          Conta
        </div>

        {settingsNav.map(renderItem)}

        {/* ── Admin Area ──────────────────────────────────────── */}
        {isAdmin && (
          <>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(45,134,89,0.25), transparent)`, margin: "12px 4px 8px" }} />

            {/* Admin section header */}
            <div
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                padding:        "0 12px 6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={9} style={{ color: C.green, opacity: 0.7 }} />
                <span
                  style={{
                    fontSize:      9,
                    fontWeight:    800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color:         "rgba(45,134,89,0.8)",
                  }}
                >
                  Área Administrativa
                </span>
              </div>
              {totalAdminPending > 0 && (
                <span
                  style={{
                    display:        "inline-flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    minWidth:       18,
                    height:         17,
                    borderRadius:   99,
                    background:     "rgba(239,68,68,0.18)",
                    color:          "#EF4444",
                    fontSize:       9,
                    fontWeight:     800,
                    padding:        "0 5px",
                    border:         "1px solid rgba(239,68,68,0.3)",
                    boxShadow:      "0 0 8px rgba(239,68,68,0.35)",
                  }}
                >
                  {totalAdminPending > 99 ? "99+" : totalAdminPending}
                </span>
              )}
            </div>

            {/* Grouped items */}
            {ADMIN_GROUPS.map((group, gi) => (
              <div key={group.id}>
                <AdminGroupLabel label={group.label} first={gi === 0} />
                {group.items.map((item) => {
                  const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                  return (
                    <NavItem
                      key={item.id}
                      item={item}
                      isActive={activeId === item.id}
                      isHovered={hovered === item.id}
                      badge={badgeCount > 0 ? { count: badgeCount, severity: item.badgeSeverity || "blue" } : null}
                      onClick={() => navigate(getPath(item.id))}
                      onMouseEnter={() => setHovered(item.id)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })}
              </div>
            ))}

            {/* Bottom spacer */}
            <div style={{ height: 8 }} />
          </>
        )}
      </nav>

      {/* ── Bottom bar (theme + user) ─────────────────────────── */}
      <div style={{ padding: "10px 8px 16px" }}>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          style={{
            width:          "100%",
            display:        "grid",
            gridTemplateColumns: `${ICON_COL}px 1fr`,
            alignItems:     "center",
            columnGap:      9,
            padding:        "6px 10px 6px 14px",
            marginBottom:   8,
            borderRadius:   8,
            border:         `1px solid ${C.border}`,
            background:     "transparent",
            color:          C.muted,
            fontSize:       12,
            fontWeight:     500,
            cursor:         "pointer",
            textAlign:      "left",
            fontFamily:     "inherit",
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
            display:        "grid",
            gridTemplateColumns: "28px 1fr auto",
            alignItems:     "center",
            gap:            9,
            padding:        "8px 10px 8px 12px",
            borderRadius:   10,
            border:         `1px solid ${C.border}`,
            background:     "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              width:          28,
              height:         28,
              borderRadius:   9,
              overflow:       "hidden",
              background:     "rgba(45,134,89,0.12)",
              border:         "1px solid rgba(45,134,89,0.22)",
              color:          C.green,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontWeight:     800,
              fontSize:       12,
              flexShrink:     0,
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
                fontSize:     12,
                fontWeight:   700,
                color:        C.white,
                lineHeight:   1.1,
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "Usuário"}
            </div>
            <div
              style={{
                fontSize:      11,
                color:         C.dim,
                marginTop:     2,
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
            aria-label="Sair da conta"
            style={{
              width:          28,
              height:         28,
              borderRadius:   8,
              border:         "none",
              background:     "transparent",
              color:          C.muted,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              cursor:         "pointer",
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
