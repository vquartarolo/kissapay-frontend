import C from "../../constants/colors";
import { getStatusLabel } from "../../utils/statusMap";

export default function StatusBadge({ status }) {
  const styles = {
    confirmed: {
      background: "rgba(0,196,106,0.12)",
      color: "#00C46A",
    },
    pending: {
      background: "rgba(255,193,7,0.12)",
      color: "#FFC107",
    },
    failed: {
      background: "rgba(239,68,68,0.12)",
      color: "#EF4444",
    },
    cancelled: {
      background: "rgba(120,120,120,0.12)",
      color: "#9CA3AF",
    },
    expired: {
      background: "rgba(255,152,0,0.12)",
      color: "#FF9800",
    },
  };

  const style = styles[status] || styles.pending;

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: style.background,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
}