import { useState } from "react";
import M from "../theme/colors";

export default function MInput({
  label, value, onChange, placeholder, type = "text",
  hint, disabled = false, style = {},
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{
          display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600,
          color: focused ? M.white : M.muted, transition: "color 0.15s",
        }}>
          {label}
        </label>
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
          background: M.inputDeep,
          border: `1px solid ${focused ? M.borderStrong : M.border}`,
          borderRadius: 10,
          padding: "11px 14px",
          color: M.white,
          fontSize: 14,
          fontFamily: "inherit",
          outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(45,134,89,0.10)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
          boxSizing: "border-box",
        }}
      />
      {hint && (
        <div style={{ fontSize: 11, color: M.dim, marginTop: 5, lineHeight: 1.5 }}>{hint}</div>
      )}
    </div>
  );
}
