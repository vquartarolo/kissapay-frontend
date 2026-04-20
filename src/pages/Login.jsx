import { useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  Eye,
  EyeOff,
  MailCheck,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Moon,
  Sun,
} from "lucide-react";
import C from "../constants/colors";
import {
  login,
  register,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  verify2FALogin,
} from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function getPasswordChecks(password) {
  const value = String(password || "");

  return [
    {
      key: "length",
      label: "No mínimo 10 caracteres",
      valid: value.length >= 10,
    },
    {
      key: "upper",
      label: "1 letra maiúscula",
      valid: /[A-Z]/.test(value),
    },
    {
      key: "lower",
      label: "1 letra minúscula",
      valid: /[a-z]/.test(value),
    },
    {
      key: "number",
      label: "1 número",
      valid: /[0-9]/.test(value),
    },
    {
      key: "special",
      label: "1 caractere especial",
      valid: /[^A-Za-z0-9]/.test(value),
    },
  ];
}

function validateStrongPassword(password) {
  const checks = getPasswordChecks(password);
  const firstInvalid = checks.find((item) => !item.valid);

  if (!firstInvalid) return "";
  return `A senha deve conter: ${firstInvalid.label.toLowerCase()}.`;
}

function sanitize2FACode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function LoginPage() {
  const { saveToken } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [twofaCode, setTwofaCode] = useState("");
  const [twofaTempToken, setTwofaTempToken] = useState("");
  const [twofaEmail, setTwofaEmail] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaConfirmed, setCaptchaConfirmed] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [verificationUrl, setVerificationUrl] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const failureCountRef = useRef(0);

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const newPasswordChecks = useMemo(
    () => getPasswordChecks(newPassword),
    [newPassword]
  );

  useEffect(() => {
    if (retryAfter <= 0) return;
    const interval = setInterval(() => setRetryAfter((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [retryAfter]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function clearRegisterData() {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  }

  function resetTwoFAState() {
    setTwofaCode("");
    setTwofaTempToken("");
    setTwofaEmail("");
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setLoading(false);
  }

  function goToLoginMode() {
    changeMode("login");
    setPassword("");
    setNewPassword("");
    setResetToken("");
    resetTwoFAState();
  }

  function openVerificationLink() {
    if (!verificationUrl) return;
    window.location.href = verificationUrl;
  }

  async function handleResendVerification() {
    if (!email) {
      setError("Digite seu email para reenviar a verificação.");
      return;
    }

    setResendingVerification(true);
    setError("");
    setSuccess("");

    try {
      const res = await resendVerificationEmail(email);

      if (res?.status) {
        setRegisteredEmail(email);
        setVerificationUrl(res?.verification?.url || "");
        setMode("registerSuccess");
        return;
      }

      setError(res?.msg || "Não foi possível reenviar a verificação.");
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao reenviar verificação.");
    } finally {
      setResendingVerification(false);
    }
  }

  async function handleSubmit() {
    resetMessages();

    if (mode === "login") {
      // Sanitização client-side (defesa em profundidade — não substitui backend)
      const cleanEmail    = email.trim().toLowerCase();
      const cleanPassword = password;

      if (/\s/.test(cleanEmail)) {
        setError("O email não pode conter espaços.");
        return;
      }
      if (/\s/.test(cleanPassword)) {
        setError("A senha não pode conter espaços ou caracteres invisíveis.");
        return;
      }
      if (captchaRequired && !captchaConfirmed) {
        setError("Confirme que você não é um robô antes de continuar.");
        return;
      }
    }

    setLoading(true);

    try {
      let res;

      if (mode === "login") {
        const cleanEmail = email.trim().toLowerCase();
        res = await login(cleanEmail, password);

        if (res?.status && res?.twofaRequired && res?.tempToken) {
          if (rememberEmail) {
            localStorage.setItem("remember_email", email);
          } else {
            localStorage.removeItem("remember_email");
          }

          setTwofaTempToken(res.tempToken);
          setTwofaCode("");
          setTwofaEmail(email);
          setSuccess("Confirmação de segurança necessária.");
          setMode("twofa");
          setLoading(false);
          return;
        }

        if (res?.status && res?.token) {
          if (rememberEmail) {
            localStorage.setItem("remember_email", email);
          } else {
            localStorage.removeItem("remember_email");
          }

          failureCountRef.current = 0;
          setSuccess(res?.msg || "Login realizado com sucesso.");

          setTimeout(() => {
            saveToken(res.token);
          }, 800);
        } else {
          // Tratar rate limit e captcha vindos do backend
          if (res?.rateLimited) {
            setRetryAfter(res?.retryAfter ?? 300);
            setError(res?.msg || "Muitas tentativas. Aguarde antes de tentar novamente.");
          } else {
            failureCountRef.current += 1;
            const delayMs =
              failureCountRef.current >= 5 ? 5000
              : failureCountRef.current >= 3 ? 2000
              : failureCountRef.current >= 2 ? 1000
              : 0;
            if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

            if (res?.captchaRequired) {
              setCaptchaRequired(true);
              setCaptchaConfirmed(false);
            }
            setError(res?.msg || "Erro desconhecido.");
          }
        }
      }

      if (mode === "twofa") {
        const normalizedCode = sanitize2FACode(twofaCode);

        if (normalizedCode.length !== 6) {
          setError("Digite o código de 6 dígitos do Google Authenticator.");
          setLoading(false);
          return;
        }

        if (!twofaTempToken) {
          setError("Sessão temporária expirada. Faça login novamente.");
          setLoading(false);
          return;
        }

        res = await verify2FALogin(twofaTempToken, normalizedCode);

        if (res?.status && res?.token) {
          if (rememberEmail && twofaEmail) {
            localStorage.setItem("remember_email", twofaEmail);
          } else if (!rememberEmail) {
            localStorage.removeItem("remember_email");
          }

          setSuccess(res?.msg || "Autenticação em duas etapas validada.");

          setTimeout(() => {
            saveToken(res.token);
          }, 700);
        } else {
          setError(res?.msg || "Código inválido.");
        }
      }

      if (mode === "register") {
        const passwordError = validateStrongPassword(password);

        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }

        res = await register(name, email, password);

        if (res?.status) {
          setRegisteredEmail(email);
          setVerificationUrl(res?.verification?.url || "");
          setSuccess("");
          setError("");
          clearRegisterData();
          setMode("registerSuccess");
        } else {
          setError(res?.msg || "Erro ao criar conta.");
        }
      }

      if (mode === "forgot") {
        res = await forgotPassword(email);

        if (res?.status) {
          setSuccess(
            res?.msg ||
              "Se o email existir, enviaremos as instruções de recuperação."
          );

          if (res?.reset?.token) {
            setResetToken(res.reset.token);
            setMode("reset");
          }
        } else {
          setError(res?.msg || "Erro ao solicitar recuperação.");
        }
      }

      if (mode === "reset") {
        const passwordError = validateStrongPassword(newPassword);

        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }

        res = await resetPassword(resetToken, newPassword);

        if (res?.status) {
          setSuccess(res?.msg || "Senha redefinida com sucesso.");

          setTimeout(() => {
            changeMode("login");
            setPassword("");
            setNewPassword("");
            setResetToken("");
          }, 1200);
        } else {
          setError(res?.msg || "Erro ao redefinir senha.");
        }
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  const showPasswordRules = mode === "register" || mode === "reset";
  const canShowResendVerification =
    mode === "login" &&
    error &&
    error.toLowerCase().includes("verifique seu email");

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
      <div style={{ width: "100%", maxWidth: 460 }}>
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
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg,#00C46A,#00E57A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 28px rgba(0, 229, 122, 0.18)",
            }}
          >
            <Zap size={21} color="#000" />
          </div>

          <span
            style={{
              fontSize: 24,
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
            borderRadius: 24,
            padding: "32px 28px",
            boxShadow:
              theme === "light"
                ? "0 20px 60px rgba(15,23,42,0.08)"
                : "0 20px 60px rgba(0,0,0,0.28)",
          }}
        >
          {mode === "registerSuccess" ? (
            <RegisterSuccessCard
              email={registeredEmail}
              verificationUrl={verificationUrl}
              onOpenVerification={openVerificationLink}
              onBackToLogin={goToLoginMode}
            />
          ) : (
            <>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: C.white,
                  marginBottom: 6,
                }}
              >
                {mode === "login" && "Entrar na conta"}
                {mode === "twofa" && "Verificação em duas etapas"}
                {mode === "register" && "Criar conta"}
                {mode === "forgot" && "Recuperar conta"}
                {mode === "reset" && "Redefinir senha"}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: C.muted,
                  marginBottom: 24,
                }}
              >
                {mode === "login" && "Acesse seu painel OrionPay"}
                {mode === "twofa" &&
                  "Digite o código de 6 dígitos do seu aplicativo autenticador"}
                {mode === "register" && "Cadastre sua conta para começar"}
                {mode === "forgot" &&
                  "Digite seu email para iniciar a recuperação da senha"}
                {mode === "reset" &&
                  "Cole o token e defina uma nova senha forte"}
              </div>

              {mode === "register" && (
                <Field
                  label="Nome"
                  value={name}
                  onChange={setName}
                  placeholder="Seu nome"
                />
              )}

              {(mode === "login" || mode === "register" || mode === "forgot") && (
                <Field
                  label="Email"
                  value={email}
                  onChange={(v) => { setEmail(v.replace(/\s/g, "")); setCaptchaRequired(false); setRetryAfter(0); failureCountRef.current = 0; }}
                  placeholder="email@empresa.com"
                  type="email"
                  autoComplete="email"
                />
              )}

              {(mode === "login" || mode === "register") && (
                <PasswordField
                  label="Senha"
                  value={password}
                  onChange={(v) => setPassword(v.replace(/\s/g, ""))}
                  placeholder="••••••••••"
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  rightLabelAction={
                    mode === "login" ? (
                      <button
                        type="button"
                        onClick={() => changeMode("forgot")}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          color: C.green,
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = 0.75;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = 1;
                        }}
                      >
                        Esqueceu sua senha?
                      </button>
                    ) : null
                  }
                />
              )}

              {mode === "login" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      color: C.muted,
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      style={{
                        accentColor: "#00E57A",
                        cursor: "pointer",
                      }}
                    />
                    Lembrar email
                  </label>
                </div>
              )}

              {mode === "twofa" && (
                <TwoFactorCard
                  code={twofaCode}
                  onChange={setTwofaCode}
                  email={twofaEmail || email}
                  onBack={goToLoginMode}
                />
              )}

              {mode === "login" && retryAfter > 0 && (
                <div style={{
                  background: "rgba(255,77,79,0.10)",
                  border: "1px solid rgba(255,77,79,0.28)",
                  borderRadius: 12, padding: "14px", marginBottom: 12,
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(255,77,79,0.16)", border: "1px solid rgba(255,77,79,0.30)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>🔒</div>
                  <div>
                    <div style={{ fontSize: 13, color: "#FF6B6B", fontWeight: 700, marginBottom: 3 }}>
                      Acesso temporariamente bloqueado
                    </div>
                    <div style={{ fontSize: 12, color: "#FF6B6B", opacity: 0.85, lineHeight: 1.55 }}>
                      Muitas tentativas incorretas foram detectadas.
                      Tente novamente em{" "}
                      <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                        {formatTime(retryAfter)}
                      </span>.
                    </div>
                  </div>
                </div>
              )}

              {mode === "login" && captchaRequired && retryAfter === 0 && (
                <label style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.22)",
                  borderRadius: 12, padding: "11px 14px", marginBottom: 12,
                  cursor: "pointer", fontSize: 13, color: "#F59E0B", fontWeight: 600,
                }}>
                  <input
                    type="checkbox"
                    checked={captchaConfirmed}
                    onChange={(e) => setCaptchaConfirmed(e.target.checked)}
                    style={{ accentColor: "#F59E0B", width: 16, height: 16, cursor: "pointer" }}
                  />
                  Confirmo que não sou um robô
                </label>
              )}

              {mode === "reset" && (
                <>
                  <Field
                    label="Token de recuperação"
                    value={resetToken}
                    onChange={setResetToken}
                    placeholder="Cole o token aqui"
                  />

                  <PasswordField
                    label="Nova senha"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="••••••••••"
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword((prev) => !prev)}
                    autoComplete="new-password"
                  />
                </>
              )}

              {showPasswordRules && (
                <PasswordRulesCard
                  checks={mode === "register" ? passwordChecks : newPasswordChecks}
                />
              )}

              {error ? (
                <div
                  style={{
                    background: "rgba(255,77,79,0.10)",
                    border: "1px solid rgba(255,77,79,0.28)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: canShowResendVerification ? 12 : 16,
                    fontSize: 13,
                    color: "#ff6b6b",
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              ) : null}

              {canShowResendVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  style={{
                    width: "100%",
                    background: "rgba(0,224,148,0.08)",
                    border: "1px solid rgba(0,224,148,0.20)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 16,
                    color: "#00e094",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: resendingVerification ? "not-allowed" : "pointer",
                    opacity: resendingVerification ? 0.7 : 1,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <RefreshCw size={15} />
                  {resendingVerification
                    ? "Reenviando verificação..."
                    : "Reenviar verificação"}
                </button>
              )}

              {success ? (
                <div
                  style={{
                    background: "rgba(0,224,148,0.10)",
                    border: "1px solid rgba(0,224,148,0.28)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 16,
                    fontSize: 13,
                    color: "#00e094",
                    fontWeight: 600,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {success}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || retryAfter > 0}
                style={{
                  width: "100%",
                  background: retryAfter > 0
                    ? "rgba(255,77,79,0.18)"
                    : "linear-gradient(135deg,#00C46A,#00E57A)",
                  border: retryAfter > 0 ? "1px solid rgba(255,77,79,0.30)" : "none",
                  borderRadius: 14,
                  padding: "14px",
                  color: retryAfter > 0 ? "#FF6B6B" : "#000",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: loading || retryAfter > 0 ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : retryAfter > 0 ? 0.85 : 1,
                  fontFamily: "inherit",
                  transition: "background 0.3s, color 0.3s",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {loading
                  ? "Processando..."
                  : retryAfter > 0 && mode === "login"
                  ? `Tentar novamente em ${formatTime(retryAfter)}`
                  : mode === "login"
                  ? "Entrar"
                  : mode === "twofa"
                  ? "Validar código"
                  : mode === "register"
                  ? "Criar conta"
                  : mode === "forgot"
                  ? "Enviar recuperação"
                  : "Redefinir senha"}
              </button>

              {mode === "forgot" && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 12,
                    fontSize: 13,
                  }}
                >
                  <span
                    onClick={() => changeMode("reset")}
                    style={{
                      color: C.green,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Já tem um token? Redefinir agora
                  </span>
                </div>
              )}

              <div
                style={{
                  textAlign: "center",
                  marginTop: 18,
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                {mode === "login" && (
                  <>
                    Não tem conta?{" "}
                    <span
                      onClick={() => changeMode("register")}
                      style={{
                        color: C.green,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Criar conta
                    </span>
                  </>
                )}

                {mode === "register" && (
                  <>
                    Já tem conta?{" "}
                    <span
                      onClick={() => changeMode("login")}
                      style={{
                        color: C.green,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Entrar
                    </span>
                  </>
                )}

                {mode === "twofa" && (
                  <>
                    Precisa voltar?{" "}
                    <span
                      onClick={goToLoginMode}
                      style={{
                        color: C.green,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Fazer login novamente
                    </span>
                  </>
                )}

                {(mode === "forgot" || mode === "reset") && (
                  <>
                    Voltar para{" "}
                    <span
                      onClick={() => changeMode("login")}
                      style={{
                        color: C.green,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Entrar
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        style={{
          position: "fixed",
          left: 16,
          bottom: 16,
          height: 44,
          minWidth: 170,
          padding: "0 16px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: C.card,
          color: C.light,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          boxShadow:
            theme === "light"
              ? "0 10px 28px rgba(15,23,42,0.06)"
              : "0 10px 28px rgba(0,0,0,0.18)",
          zIndex: 30,
        }}
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        {theme === "light" ? "Modo escuro" : "Modo claro"}
      </button>
    </div>
  );
}

function RegisterSuccessCard({
  email,
  verificationUrl,
  onOpenVerification,
  onBackToLogin,
}) {
  return (
    <div>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          margin: "0 auto 18px",
          background: "rgba(0,224,148,0.12)",
          border: "1px solid rgba(0,224,148,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00e094",
        }}
      >
        <MailCheck size={30} />
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 24,
          fontWeight: 800,
          color: C.white,
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}
      >
        Conta pronta para ativação
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 14,
          color: C.muted,
          lineHeight: 1.7,
          marginBottom: 24,
        }}
      >
        Para liberar o acesso à plataforma, confirme o email da conta.
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Email da conta
        </div>

        <div
          style={{
            color: C.white,
            fontSize: 14,
            fontWeight: 600,
            wordBreak: "break-word",
          }}
        >
          {email || "Email não informado"}
        </div>
      </div>

      <div
        style={{
          background: "rgba(0,224,148,0.08)",
          border: "1px solid rgba(0,224,148,0.18)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            color: "#00e094",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Modo teste ativado
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          O envio real de email ainda não está ativo. Use o botão abaixo para
          abrir a verificação manualmente.
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenVerification}
        disabled={!verificationUrl}
        style={{
          width: "100%",
          background: "linear-gradient(135deg,#00C46A,#00E57A)",
          border: "none",
          borderRadius: 14,
          padding: "14px",
          color: "#000",
          fontWeight: 800,
          fontSize: 15,
          cursor: verificationUrl ? "pointer" : "not-allowed",
          opacity: verificationUrl ? 1 : 0.65,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span>Verificar email agora</span>
        <ExternalLink size={16} />
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        style={{
          width: "100%",
          background: "transparent",
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px",
          color: C.white,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <ArrowLeft size={16} />
        <span>Voltar para login</span>
      </button>
    </div>
  );
}

function TwoFactorCard({ code, onChange, email, onBack }) {
  return (
    <div
      style={{
        marginBottom: 16,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "rgba(0,224,148,0.12)",
              border: "1px solid rgba(0,224,148,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00e094",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} />
          </div>

          <div>
            <div
              style={{
                fontSize: 13,
                color: C.white,
                fontWeight: 700,
              }}
            >
              Confirmação de segurança
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                marginTop: 2,
              }}
            >
              Sua conta está protegida com autenticação em duas etapas.
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.7,
          }}
        >
          {email ? (
            <>
              Continue como <span style={{ color: C.white }}>{email}</span> e
              informe o código gerado no Google Authenticator.
            </>
          ) : (
            <>Informe o código gerado no Google Authenticator para continuar.</>
          )}
        </div>
      </div>

      <TwoFactorCodeInput value={code} onChange={onChange} />

      <div
        style={{
          marginTop: 12,
          textAlign: "center",
          fontSize: 12,
          color: C.muted,
          lineHeight: 1.6,
        }}
      >
        Verifique se o horário do seu celular está correto caso o código não
        seja aceito.
      </div>

      <div
        style={{
          marginTop: 12,
          textAlign: "center",
          fontSize: 13,
        }}
      >
        <span
          onClick={onBack}
          style={{
            color: C.green,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Voltar e fazer login novamente
        </span>
      </div>
    </div>
  );
}

function TwoFactorCodeInput({ value, onChange }) {
  const inputRefs = useRef([]);

  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((digit) => !digit);
    const targetIndex = firstEmptyIndex === -1 ? 5 : firstEmptyIndex;
    const target = inputRefs.current[targetIndex];

    if (target) {
      target.focus();
      target.select?.();
    }
  }, []);

  function updateDigit(index, rawValue) {
    const onlyDigits = String(rawValue || "").replace(/\D/g, "");

    if (!onlyDigits) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      onChange(nextDigits.join(""));
      return;
    }

    if (onlyDigits.length > 1) {
      const pasted = onlyDigits.slice(0, 6).split("");
      const nextDigits = Array(6).fill("");

      pasted.forEach((digit, pastedIndex) => {
        nextDigits[pastedIndex] = digit;
      });

      onChange(nextDigits.join(""));

      const nextFocusIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      inputRefs.current[nextFocusIndex]?.select?.();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = onlyDigits;
    onChange(nextDigits.join(""));

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select?.();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        onChange(nextDigits.join(""));
        return;
      }

      if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select?.();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select?.();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select?.();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const normalized = sanitize2FACode(pasted);
    onChange(normalized);

    const nextFocusIndex = Math.min(normalized.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
    inputRefs.current[nextFocusIndex]?.select?.();
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          marginBottom: 8,
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Código de autenticação
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexWrap: "nowrap",
        }}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(e) => updateDigit(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            style={{
              width: 48,
              height: 56,
              background: C.inputDeep,
              border: `1px solid ${digit ? "rgba(0,224,148,0.40)" : C.border}`,
              borderRadius: 14,
              color: C.white,
              caretColor: C.green,
              fontSize: 24,
              fontWeight: 800,
              textAlign: "center",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              boxShadow: digit ? "0 0 0 3px rgba(0,224,148,0.08)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PasswordRulesCard({ checks }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 16,
        fontSize: 12,
        lineHeight: 1.8,
      }}
    >
      <div
        style={{
          color: C.muted,
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        A senha deve conter:
      </div>

      {checks.map((item) => (
        <div
          key={item.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: item.valid ? C.green : "#ff6b6b",
            fontWeight: item.valid ? 600 : 500,
          }}
        >
          <span>{item.valid ? "✅" : "❌"}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete = "off",
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          background: C.inputDeep,
          border: `1px solid ${C.border}`,
          boxShadow: "none",
          borderRadius: 12,
          padding: "13px 14px",
          color: C.white,
          fontSize: 15,
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  autoComplete = "off",
  rightLabelAction = null,
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            background: C.inputDeep,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "13px 46px 13px 14px",
            color: C.white,
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {rightLabelAction && (
        <div style={{ marginTop: 6, textAlign: "right" }}>
          {rightLabelAction}
        </div>
      )}
    </div>
  );
}