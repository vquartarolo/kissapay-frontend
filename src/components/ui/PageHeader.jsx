import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import C from "../../constants/colors";

export default function PageHeader({ title, subtitle, right, back, onBack }) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) onBack();
    else navigate(-1);
  }

  return (
    <header style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 28,
      gap: 12,
      paddingBottom: 20,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {back && (
          <button
            onClick={handleBack}
            style={{
              width: 34, height: 34,
              borderRadius: 9,
              background: "transparent",
              border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: C.muted,
              transition: "color 0.15s, border-color 0.15s",
              flexShrink: 0,
              marginTop: 2,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = C.white;
              e.currentTarget.style.borderColor = C.borderStrong;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = C.muted;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
          </button>
        )}
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.white,
            margin: 0,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: "5px 0 0",
              fontSize: 13,
              color: C.muted,
              fontWeight: 400,
              lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {right}
        </div>
      )}
    </header>
  );
}
