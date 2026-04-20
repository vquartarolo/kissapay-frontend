import M from "../theme/colors";

export default function MEmptyState({ text = "Nenhum item encontrado.", loading = false, icon }) {
  return (
    <div style={{ padding: "36px 0", textAlign: "center" }}>
      {loading ? (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `2px solid ${M.border}`, borderTopColor: M.green,
          animation: "m-spin 0.7s linear infinite",
          margin: "0 auto 14px",
        }} />
      ) : icon ? (
        <div style={{ color: M.dim, marginBottom: 12, display: "flex", justifyContent: "center" }}>
          {icon}
        </div>
      ) : null}
      <div style={{ fontSize: 13, color: M.muted }}>{text}</div>
      <style>{`@keyframes m-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
