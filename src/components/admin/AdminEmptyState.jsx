import C from "../../constants/colors";

export default function AdminEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "64px 24px",
        textAlign:      "center",
      }}
    >
      {Icon && (
        <div
          style={{
            width:          64,
            height:         64,
            borderRadius:   16,
            background:     "rgba(255,255,255,0.03)",
            border:         `1px solid ${C.border}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            marginBottom:   20,
          }}
        >
          <Icon size={28} style={{ color: C.dim }} />
        </div>
      )}
      <div
        style={{
          fontSize:   16,
          fontWeight: 700,
          color:      C.white,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize:   13,
            color:      C.muted,
            maxWidth:   360,
            lineHeight: 1.65,
          }}
        >
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
