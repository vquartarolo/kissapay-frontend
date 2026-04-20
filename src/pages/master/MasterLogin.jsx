import { useState } from "react";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import M from "../../master/theme/colors";
import { masterLogin } from "../../services/master.service";

export default function MasterLogin({ onAuth }) {
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!password) return;
    setError("");
    setLoading(true);
    try {
      const res = await masterLogin(password);
      if (res.status && res.token) {
        localStorage.setItem("masterToken", res.token);
        onAuth(res.token);
      } else {
        setError("Senha incorreta. Verifique e tente novamente.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: "0 auto 16px",
            background: "linear-gradient(145deg, rgba(212,175,55,0.20), rgba(212,175,55,0.06))",
            border: `1.5px solid rgba(212,175,55,0.35)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={26} color={M.gold} strokeWidth={1.8} />
          </div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 800, color: M.white, lineHeight: 1,
          }}>
            ORION<span style={{ color: M.gold }}>MASTER</span>
          </div>
          <div style={{ fontSize: 13, color: M.muted, marginTop: 6 }}>
            Painel administrativo exclusivo
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: M.card,
          border: `1px solid ${M.border}`,
          borderRadius: 16,
          padding: "28px 24px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.40)",
        }}>
          <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: M.muted }}>
            Senha master
          </div>

          {/* Password input */}
          <div style={{
            position: "relative",
            marginBottom: 14,
          }}>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                background: M.inputDeep,
                border: `1px solid ${M.border}`,
                borderRadius: 11,
                padding: "13px 46px 13px 14px",
                color: M.white,
                fontSize: 15,
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = M.borderStrong}
              onBlur={e => e.target.style.borderColor = M.border}
            />
            <button
              onClick={() => setShow(s => !s)}
              style={{
                position: "absolute", right: 13, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: "pointer", color: M.muted, padding: 2,
                display: "flex", alignItems: "center",
              }}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{
              background: "rgba(229,72,77,0.08)",
              border: "1px solid rgba(229,72,77,0.20)",
              borderRadius: 10,
              padding: "10px 13px",
              marginBottom: 14,
              fontSize: 13,
              color: M.error,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !password}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${M.gold}, #F0C94B)`,
              border: "none",
              borderRadius: 12,
              padding: "14px",
              color: "#000",
              fontWeight: 800,
              fontSize: 15,
              cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: loading || !password ? 0.65 : 1,
              fontFamily: "inherit",
              transition: "opacity 0.15s, transform 0.1s",
            }}
          >
            {loading ? "Verificando..." : "Acessar painel"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: M.dim }}>
          Acesso restrito a administradores autorizados
        </div>
      </div>
    </div>
  );
}
