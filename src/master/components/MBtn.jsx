import { useState } from "react";
import M from "../theme/colors";

export default function MBtn({
  children, onClick, disabled = false, variant = "primary",
  size = "md", fullWidth = false, icon, style = {},
}) {
  const [hov, setHov] = useState(false);

  const sizes = {
    sm: { padding: "7px 14px",  fontSize: 12, borderRadius: 9  },
    md: { padding: "10px 20px", fontSize: 13, borderRadius: 11 },
    lg: { padding: "13px 28px", fontSize: 15, borderRadius: 13 },
  };

  const base = sizes[size] || sizes.md;

  const variants = {
    primary: {
      background: disabled ? M.cardSoft : hov ? M.greenBright : M.green,
      color: "#FFFFFF",
      border: "none",
      boxShadow: hov && !disabled ? `0 4px 16px rgba(45,134,89,0.30)` : "none",
    },
    secondary: {
      background: hov ? M.cardSoft : "transparent",
      color: M.white,
      border: `1px solid ${M.border}`,
      boxShadow: "none",
    },
    outline: {
      background: "transparent",
      color: hov ? M.white : M.muted,
      border: `1px solid ${hov ? M.borderStrong : M.border}`,
      boxShadow: "none",
    },
    danger: {
      background: hov ? "#C0393E" : M.error,
      color: "#FFFFFF",
      border: "none",
      boxShadow: "none",
    },
    gold: {
      background: `linear-gradient(135deg, ${M.gold}, #F0C94B)`,
      color: "#000",
      border: "none",
      boxShadow: hov ? "0 4px 16px rgba(212,175,55,0.35)" : "none",
    },
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        width: fullWidth ? "100%" : "auto",
        fontFamily: "inherit",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        ...base,
        ...v,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
