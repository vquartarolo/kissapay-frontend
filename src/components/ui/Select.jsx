import { useState } from "react";
import { ChevronDown } from "lucide-react";
import C from "../../constants/colors";

export default function Select({ label, value, onChange, options, style: extraStyle = {} }) {
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
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: C.card,
            border: `1px solid ${focused ? C.borderStrong : C.border}`,
            borderRadius: 10,
            padding: "12px 40px 12px 14px",
            color: C.white,
            fontSize: 14,
            outline: "none",
            appearance: "none",
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: focused ? `0 0 0 3px rgba(45,134,89,0.10)` : "none",
            transition: "border-color 0.15s",
            ...extraStyle,
          }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#1C1C21" }}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          color={C.muted}
          style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
