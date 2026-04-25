import { RefreshCcw, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminEmptyState from "../../components/admin/AdminEmptyState";
import C from "../../constants/colors";
import api from "../../services/api";

export default function AdminReconciliation({ isMobile }) {
  const [running, setRunning] = useState(false);
  const [result, setResult]   = useState(null);

  async function runReconciliation() {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post("/admin/reconcile");
      setResult({ ok: true, data });
    } catch (e) {
      setResult({ ok: false, msg: e?.response?.data?.msg || "Erro ao executar reconciliação." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="page">
      <AdminPageHeader
        title="Reconciliação"
        subtitle="Verificação de integridade financeira entre ledger e provedores"
        onRefresh={runReconciliation}
        refreshing={running}
      />

      {result && (
        <div
          style={{
            display:      "flex",
            alignItems:   "flex-start",
            gap:          12,
            padding:      "14px 18px",
            borderRadius: 12,
            marginBottom: 20,
            background:   result.ok ? "rgba(45,134,89,0.07)" : "rgba(229,72,77,0.07)",
            border:       `1px solid ${result.ok ? "rgba(45,134,89,0.2)" : "rgba(229,72,77,0.2)"}`,
          }}
        >
          {result.ok
            ? <CheckCircle size={18} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
            : <AlertTriangle size={18} style={{ color: C.error, flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 4 }}>
              {result.ok ? "Reconciliação concluída" : "Erro na reconciliação"}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {result.ok
                ? `Processado em ${new Date().toLocaleString("pt-BR")}`
                : result.msg}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background:   C.card,
          border:       `1px solid ${C.border}`,
          borderRadius: 16,
        }}
      >
        <AdminEmptyState
          icon={RefreshCcw}
          title="Módulo em preparação"
          description='A tela de reconciliação automática e relatórios de divergência estarão disponíveis em breve. Para executar manualmente, clique em "Atualizar" acima.'
          action={
            <button
              onClick={runReconciliation}
              disabled={running}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          8,
                padding:      "9px 20px",
                borderRadius: 9,
                border:       `1px solid rgba(45,134,89,0.3)`,
                background:   "rgba(45,134,89,0.08)",
                color:        C.green,
                fontSize:     13,
                fontWeight:   700,
                cursor:       running ? "not-allowed" : "pointer",
                fontFamily:   "inherit",
                opacity:      running ? 0.6 : 1,
              }}
            >
              <RefreshCcw size={14} style={{ animation: running ? "spin 0.7s linear infinite" : "none" }} />
              {running ? "Executando..." : "Executar Reconciliação"}
            </button>
          }
        />
      </div>
    </div>
  );
}
