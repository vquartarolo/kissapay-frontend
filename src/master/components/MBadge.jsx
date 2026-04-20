import M from "../theme/colors";

const PRESETS = {
  success:  { bg: "rgba(45,134,89,0.12)",  color: M.green },
  warning:  { bg: "rgba(212,175,55,0.14)", color: M.gold  },
  error:    { bg: "rgba(229,72,77,0.12)",  color: M.error },
  neutral:  { bg: "rgba(90,106,126,0.15)", color: M.muted },
  info:     { bg: "rgba(59,130,246,0.12)", color: "#60A5FA" },
};

export default function MBadge({ children, preset, bg, color, style = {} }) {
  const p = PRESETS[preset] || {};
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 999,
      background: bg || p.bg || PRESETS.neutral.bg,
      color: color || p.color || M.muted,
      fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap",
      ...style,
    }}>
      {children}
    </span>
  );
}
