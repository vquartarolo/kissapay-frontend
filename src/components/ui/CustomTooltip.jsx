import C from "../../constants/colors";

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "8px 14px", fontSize: 12,
    }}>
      <div style={{ color: C.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ color: C.green, fontWeight: 700 }}>
        R$ {payload[0].value.toLocaleString("pt-BR")}
      </div>
    </div>
  );
}
