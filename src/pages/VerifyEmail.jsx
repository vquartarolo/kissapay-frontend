import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import C from "../constants/colors";
import { verifyEmailToken } from "../services/auth.service";

export default function VerifyEmailPage() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verificando seu email...");

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Token de verificação não encontrado.");
        return;
      }

      try {
        const res = await verifyEmailToken(token);

        if (res?.status) {
          setStatus("success");
          setMessage(res?.msg || "Email verificado com sucesso.");
          return;
        }

        setStatus("error");
        setMessage(res?.msg || "Não foi possível verificar seu email.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err?.response?.data?.msg || "Erro ao verificar email."
        );
      }
    }

    run();
  }, [token]);

  function goToLogin() {
    window.location.href = "/";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Pro Display','Helvetica Neue',system-ui,sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg,#00C46A,#00E57A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={20} color="#000" />
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.white,
              letterSpacing: "-0.02em",
            }}
          >
            Orion<span style={{ color: C.green }}>Pay</span>
          </span>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "32px 28px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.white,
              marginBottom: 8,
            }}
          >
            Verificação de email
          </div>

          <div
            style={{
              fontSize: 14,
              color:
                status === "success"
                  ? "#00e094"
                  : status === "error"
                  ? "#ff6b6b"
                  : C.muted,
              marginBottom: 22,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </div>

          {status === "loading" && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `3px solid ${C.border}`,
                borderTopColor: C.green,
                animation: "spin 0.7s linear infinite",
                margin: "0 auto 20px",
              }}
            />
          )}

          {status !== "loading" && (
            <button
              type="button"
              onClick={goToLogin}
              style={{
                width: "100%",
                background: "linear-gradient(135deg,#00C46A,#00E57A)",
                border: "none",
                borderRadius: 14,
                padding: "14px",
                color: "#000",
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Ir para login
            </button>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}