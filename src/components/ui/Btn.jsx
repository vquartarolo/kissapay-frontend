import C from "../../constants/colors";

const styles = {
  primary: {
    bg:      C.green,
    color:   "#FFFFFF",
    border:  "1px solid transparent",
    shadow:  `0 2px 12px rgba(45,134,89,0.28)`,
    hoverBg: C.greenBright,
    hoverShadow: `0 4px 20px rgba(45,134,89,0.35)`,
  },
  outline: {
    bg:      "transparent",
    color:   C.light,
    border:  `1px solid ${C.borderStrong}`,
    shadow:  "none",
    hoverBg: "rgba(255,255,255,0.05)",
    hoverShadow: "none",
  },
  secondary: {
    bg:      "transparent",
    color:   C.light,
    border:  `1px solid ${C.border}`,
    shadow:  "none",
    hoverBg: "rgba(255,255,255,0.04)",
    hoverShadow: "none",
  },
  gold: {
    bg:      "transparent",
    color:   C.gold,
    border:  "1px solid rgba(212,175,55,0.25)",
    shadow:  "none",
    hoverBg: "rgba(212,175,55,0.06)",
    hoverShadow: "none",
  },
  subtle: {
    bg:      "rgba(255,255,255,0.03)",
    color:   C.muted,
    border:  `1px solid ${C.border}`,
    shadow:  "none",
    hoverBg: "rgba(255,255,255,0.06)",
    hoverShadow: "none",
  },
  danger: {
    bg:      "transparent",
    color:   C.error,
    border:  "1px solid rgba(229,72,77,0.25)",
    shadow:  "none",
    hoverBg: "rgba(229,72,77,0.08)",
    hoverShadow: "none",
  },
};

export default function Btn({
  children,
  onClick,
  fullWidth,
  disabled,
  icon,
  variant = "primary",
  size = "md",
  style: extraStyle = {},
}) {
  const s = styles[variant] || styles.primary;

  const pad = size === "sm"
    ? "8px 14px"
    : size === "lg"
    ? "15px 28px"
    : "11px 20px";

  const fs = size === "sm" ? 12 : size === "lg" ? 15 : 14;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? "100%" : "auto",
        background: s.bg,
        color: s.color,
        border: s.border,
        borderRadius: 10,
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        boxShadow: s.shadow,
        fontFamily: "inherit",
        transition: "background 0.15s, box-shadow 0.15s, transform 0.12s",
        ...extraStyle,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = s.hoverBg;
        e.currentTarget.style.boxShadow = s.hoverShadow;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = s.bg;
        e.currentTarget.style.boxShadow = s.shadow;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon}
      {children}
    </button>
  );
}
