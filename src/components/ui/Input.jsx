import { useState } from "react";
import C from "../../constants/colors";

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  style: extraStyle = {},
  hint,
  disabled = false,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{
          fontSize: 12,
          color: focused ? C.light : C.muted,
          marginBottom: 6,
          fontWeight: 600,
          letterSpacing: "0.01em",
          transition: "color 0.15s",
        }}>
          {label}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: C.card,
          border: `1px solid ${focused ? C.borderStrong : C.border}`,
          borderRadius: 10,
          padding: "12px 14px",
          color: C.white,
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "inherit",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
          transition: "border-color 0.15s",
          boxShadow: focused ? `0 0 0 3px rgba(45,134,89,0.10)` : "none",
          ...extraStyle,
        }}
      />
      {hint && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 5, lineHeight: 1.4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
