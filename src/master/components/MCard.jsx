import M from "../theme/colors";

export default function MCard({ children, style = {}, hover = false, onClick, variant = "default" }) {
  const bg =
    variant === "elevated" ? M.cardSoft :
    variant === "subtle"   ? M.cardSoft :
    M.card;

  const shadow =
    variant === "elevated"
      ? "0 2px 8px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)"
      : "0 1px 3px rgba(0,0,0,0.25)";

  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${M.border}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: shadow,
        transition: hover || onClick ? "border-color 0.15s, transform 0.15s, box-shadow 0.15s" : "none",
        cursor: hover || onClick ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={e => {
        if (!hover && !onClick) return;
        e.currentTarget.style.borderColor = M.borderStrong;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.45)";
      }}
      onMouseLeave={e => {
        if (!hover && !onClick) return;
        e.currentTarget.style.borderColor = M.border;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = shadow;
      }}
    >
      {children}
    </div>
  );
}
