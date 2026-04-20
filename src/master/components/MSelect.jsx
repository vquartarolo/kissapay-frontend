import { useState } from "react";
import M from "../theme/colors";

export default function MSelect({ label, value, onChange, options = [], style = {} }) {
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
      <select
        value={value}
        onChange={onChange}
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
          cursor: "pointer",
          boxShadow: focused ? "0 0 0 3px rgba(45,134,89,0.10)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxSizing: "border-box",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
