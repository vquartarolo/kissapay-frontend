import { ChevronDown, LogOut, Sun, Moon, Shield } from "lucide-react";
import { useState } from "react";
import M from "../theme/colors";

// Fixed icon column width — all icons on same X axis
const ICON_COL = 18;

function SidebarBtn({
  item, isActive, isHovered, childActive,
  onClick, onMouseEnter, onMouseLeave,
  isChild, chevron, isOpen,
}) {
  const highlight = isActive || isHovered || childActive;
  const accentActive = isActive || childActive;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        display: "grid",
        gridTemplateColumns: `${ICON_COL}px 1fr auto`,
        alignItems: "center",
        columnGap: 9,
        padding: "6px 10px 6px 14px",
        marginBottom: 1,
        borderRadius: 8,
        border: "none",
        background: highlight ? "rgba(255,255,255,0.055)" : "transparent",
        color: highlight ? M.white : M.muted,
        fontSize: isChild ? 13 : 14,
        fontWeight: highlight ? 700 : 500,
        cursor: "pointer",
        transition: "color 0.1s, background 0.1s",
        textAlign: "left",
        fontFamily: "inherit",
        boxSizing: "border-box",
        letterSpacing: highlight ? "-0.01em" : "normal",
      }}
    >
      {/* Accent bar — absolutely positioned, no layout shift */}
      <span style={{
        position: "absolute",
        left: 0, top: "50%",
        transform: "translateY(-50%)",
        width: 2,
        height: accentActive ? "52%" : 0,
        borderRadius: 2,
        background: M.green,
        transition: "height 0.15s ease",
      }} />

      {/* Icon — centered in fixed column */}
      <item.icon
        size={isChild ? 12 : 14}
        strokeWidth={highlight ? 2.3 : 1.7}
        style={{
          color: accentActive ? M.green : "inherit",
          justifySelf: "center",
          display: "block",
        }}
      />

      {/* Label */}
      <span style={{ lineHeight: 1 }}>{item.label}</span>

      {/* 3rd col: chevron or active dot */}
      {chevron ? (
        <ChevronDown
          size={11} strokeWidth={2.5}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s",
            opacity: 0.5,
          }}
        />
      ) : (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: M.green,
          boxShadow: isActive ? `0 0 6px ${M.green}` : "none",
          opacity: isActive ? 1 : 0,
          transition: "opacity 0.15s",
        }} />
      )}
    </button>
  );
}

export default function SidebarMaster({ nav, activePage, onNavigate, theme, onToggleTheme, kycBadge = 0 }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [hovered,   setHovered]   = useState(null);

  function renderItem(item) {
    if (!item.children) {
      return (
        <SidebarBtn
          key={item.id}
          item={item}
          isActive={activePage === item.id}
          isHovered={hovered === item.id}
          onClick={() => onNavigate(item.id)}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
        />
      );
    }

    const isOpen      = openGroup === item.id;
    const childActive = item.children.some(c => activePage === c.id);

    return (
      <div key={item.id}>
        <SidebarBtn
          item={item}
          isActive={false}
          isHovered={hovered === item.id}
          childActive={childActive}
          onClick={() => setOpenGroup(isOpen ? null : item.id)}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
          chevron
          isOpen={isOpen}
        />
        {isOpen && (
          <div style={{ marginTop: 0, marginBottom: 2 }}>
            {item.children.map(child => (
              <SidebarBtn
                key={child.id}
                item={child}
                isActive={activePage === child.id}
                isHovered={hovered === child.id}
                onClick={() => onNavigate(child.id)}
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
    <aside style={{
      width: 232, flexShrink: 0,
      background: M.sidebar,
      borderRight: `1px solid ${M.border}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>

      {/* LOGO */}
      <div style={{
        padding: "22px 16px 18px",
        borderBottom: `1px solid ${M.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: "linear-gradient(145deg, rgba(212,175,55,0.28), rgba(212,175,55,0.08))",
            border: `1px solid rgba(212,175,55,0.30)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={15} color={M.gold} strokeWidth={2} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", color: M.white, lineHeight: 1,
            }}>
              ORION<span style={{ color: M.gold }}>MASTER</span>
            </div>
            <div style={{
              fontSize: 8, fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase", color: M.dim, marginTop: 3,
            }}>
              Painel Administrativo
            </div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 8px 0" }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: M.dim, padding: "10px 12px 5px",
        }}>
          Menu
        </div>

        {nav.map(item => (
          <div key={item.id} style={{ position: "relative" }}>
            {renderItem(item)}
            {/* Badge for kyc */}
            {item.id === "kyc" && kycBadge > 0 && (
              <span style={{
                position: "absolute", top: 8, right: 28,
                background: M.warn, color: "#000",
                fontSize: 9, fontWeight: 900,
                padding: "1px 6px", borderRadius: 20,
                pointerEvents: "none",
              }}>{kycBadge}</span>
            )}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div style={{ padding: "10px 8px 16px" }}>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: `${ICON_COL}px 1fr`,
            alignItems: "center",
            columnGap: 9,
            padding: "6px 10px 6px 14px",
            marginBottom: 8,
            borderRadius: 8,
            border: `1px solid ${M.border}`,
            background: "transparent",
            color: M.muted,
            fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
            transition: "color 0.1s, border-color 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = M.white; e.currentTarget.style.borderColor = M.borderStrong; }}
          onMouseLeave={e => { e.currentTarget.style.color = M.muted; e.currentTarget.style.borderColor = M.border; }}
        >
          {theme === "dark"
            ? <Sun  size={13} strokeWidth={2} style={{ justifySelf: "center" }} />
            : <Moon size={13} strokeWidth={2} style={{ justifySelf: "center" }} />
          }
          <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
        </button>

        {/* Master badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "9px 10px", borderRadius: 10,
          border: `1px solid rgba(212,175,55,0.20)`,
          background: "rgba(212,175,55,0.04)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={14} color={M.gold} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: M.white, lineHeight: 1.2 }}>
              Master Admin
            </div>
            <div style={{ fontSize: 10, color: M.dim, marginTop: 2 }}>Acesso total</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
