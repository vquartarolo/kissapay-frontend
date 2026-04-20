import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Eye, EyeOff, Pencil, Shield, X } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Btn from "../../components/ui/Btn";
import ImageCropper from "../../components/ui/ImageCropper";
import C from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  changeMyPassword,
  updateMySettings,
} from "../../services/user.service";
import { logoutOtherSessions } from "../../services/auth.service";

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

function getPasswordStrength(checks) {
  const valid = checks.filter((c) => c.valid).length;
  if (valid <= 2) return { label: "Fraca", color: "#FF4D4F", level: 1 };
  if (valid <= 4) return { label: "Média", color: "#F59E0B", level: 2 };
  return { label: "Forte", color: "#00C46A", level: 3 };
}

function validateStrongPassword(password) {
  const checks = getPasswordChecks(password);
  const firstInvalid = checks.find((item) => !item.valid);

  if (!firstInvalid) return "";
  return `A senha deve conter: ${firstInvalid.label.toLowerCase()}.`;
}

function formatDocument(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

  if (!digits) return "";

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 14);
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

function getDocumentStatus(user) {
  const accountStatus = String(user?.accountStatus || "").toLowerCase();
  const hasDocument = Boolean(String(user?.document || "").trim());

  const approvedStatuses = ["kyc_approved", "seller_active"];

  if (approvedStatuses.includes(accountStatus) && hasDocument) {
    return {
      verified: true,
      value: formatDocument(user?.document),
      valueColor: C.white,
      badgeColor: C.green,
      badgeLabel: "Verificado",
    };
  }

  return {
    verified: false,
    value: "Aguardando verificação de dados",
    valueColor: "#FFD600",
    badgeColor: "#FFD600",
    badgeLabel: "",
  };
}

function ActionButton({
  onClick,
  label,
  icon = "edit",
  variant = "default",
}) {
  const Icon = icon === "close" ? X : Pencil;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        background:
          variant === "subtle" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)",
        color: C.white,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function StaticField({ label, value, right, valueColor = C.white }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 15,
            color: valueColor,
            fontWeight: 700,
            wordBreak: "break-word",
            lineHeight: 1.45,
          }}
        >
          {value || "—"}
        </div>
      </div>

      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  status,
  disabled,
  isLight,
}) {
  const borderColor =
    status === "error" ? "#FF4D4F"
    : status === "success" ? C.green
    : isLight ? "rgba(15,23,42,0.14)" : C.border;

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 11,
          color: isLight ? "#475569" : C.muted,
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            background: disabled
              ? isLight ? "rgba(15,23,42,0.04)" : "rgba(8,12,18,0.5)"
              : isLight ? "#FFFFFF" : "#080C12",
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: "10px 42px 10px 12px",
            color: isLight ? "#0F172A" : C.white,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            opacity: disabled ? 0.6 : 1,
            transition: "border-color 0.2s",
          }}
        />

        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: isLight ? "#94A3B8" : C.muted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function PasswordRulesCard({ checks, isLight }) {
  return (
    <div
      style={{
        background: isLight ? "#F1F5F9" : C.cardSoft,
        border: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : C.border}`,
        borderRadius: 10,
        padding: "8px 12px",
        marginBottom: 10,
        fontSize: 11,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px 10px",
        }}
      >
        {checks.map((item) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: item.valid ? C.green : isLight ? "#EF4444" : "#ff6b6b",
              fontWeight: 600,
              lineHeight: 1.7,
            }}
          >
            <span style={{ fontSize: 10 }}>{item.valid ? "✓" : "✗"}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange, disabled, hasError, isLight }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => !d);
    const target = inputRefs.current[firstEmpty === -1 ? 5 : firstEmpty];
    if (target) { target.focus(); target.select?.(); }
  }, []);

  function updateDigit(index, raw) {
    const only = String(raw).replace(/\D/g, "");
    if (!only) {
      const next = [...digits]; next[index] = "";
      onChange(next.join("")); return;
    }
    if (only.length > 1) {
      const pasted = only.slice(0, 6).split("");
      const next = Array(6).fill("");
      pasted.forEach((d, i) => { next[i] = d; });
      onChange(next.join(""));
      const fi = Math.min(pasted.length, 5);
      inputRefs.current[fi]?.focus(); inputRefs.current[fi]?.select?.(); return;
    }
    const next = [...digits]; next[index] = only;
    onChange(next.join(""));
    if (index < 5) { inputRefs.current[index + 1]?.focus(); inputRefs.current[index + 1]?.select?.(); }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits]; next[index] = ""; onChange(next.join("")); return;
      }
      if (index > 0) {
        const next = [...digits]; next[index - 1] = ""; onChange(next.join(""));
        inputRefs.current[index - 1]?.focus(); inputRefs.current[index - 1]?.select?.();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) { inputRefs.current[index - 1]?.focus(); inputRefs.current[index - 1]?.select?.(); }
    if (e.key === "ArrowRight" && index < 5) { inputRefs.current[index + 1]?.focus(); inputRefs.current[index + 1]?.select?.(); }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((d, i) => { next[i] = d; });
    onChange(next.join(""));
    const fi = Math.min(pasted.length, 5);
    inputRefs.current[fi]?.focus(); inputRefs.current[fi]?.select?.();
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => updateDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 42,
            height: 48,
            background: isLight ? "#FFFFFF" : "#080C12",
            border: `1px solid ${
              hasError ? "rgba(255,77,79,0.55)"
              : digit ? "rgba(0,224,148,0.40)"
              : isLight ? "rgba(15,23,42,0.14)" : C.border
            }`,
            borderRadius: 10,
            color: hasError ? "#FF4D4F" : isLight ? "#0F172A" : C.white,
            fontSize: 18,
            fontWeight: 800,
            textAlign: "center",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            boxShadow: digit
              ? hasError
                ? "0 0 0 3px rgba(255,77,79,0.10)"
                : "0 0 0 3px rgba(0,224,148,0.08)"
              : "none",
            transition: "all 0.15s ease",
            caretColor: C.green,
            opacity: disabled ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}

function PasswordModal({
  isMobile,
  open,
  onClose,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordChecks,
  passwordError,
  passwordSaving,
  canSubmit,
  strength,
  postSuccess,
  onRevokeOthers,
  onKeepSessions,
  revokingOthers,
  twofa,
  twofaCode,
  setTwofaCode,
  theme,
  onSubmit,
}) {
  if (!open) return null;

  const isLight = theme === "light";

  const M = {
    overlay:    isLight ? "rgba(15,23,42,0.40)"  : "rgba(0,0,0,0.74)",
    bg:         isLight ? "linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.99))" : "linear-gradient(180deg,rgba(10,16,28,0.98),rgba(7,11,20,0.98))",
    border:     isLight ? "rgba(15,23,42,0.10)"  : C.border,
    title:      isLight ? "#0F172A"              : C.white,
    sub:        isLight ? "#64748B"              : C.muted,
    label:      isLight ? "#475569"              : C.muted,
    inputBg:    isLight ? "#FFFFFF"              : "#080C12",
    inputBorder:isLight ? "rgba(15,23,42,0.14)" : C.border,
    inputColor: isLight ? "#0F172A"              : C.white,
    cardBg:     isLight ? "#F8FAFC"              : C.cardSoft,
    cardBorder: isLight ? "rgba(15,23,42,0.08)" : C.border,
    closeBtn:   isLight ? "#FFFFFF"              : C.cardSoft,
    closeBtnBorder: isLight ? "rgba(15,23,42,0.10)" : C.border,
    closeBtnColor:  isLight ? "#475569"             : C.muted,
    otpBg:      isLight ? "#FFFFFF"              : "#080C12",
    otpBorder:  isLight ? "rgba(15,23,42,0.14)" : C.border,
    otpColor:   isLight ? "#0F172A"              : C.white,
    shadow:     isLight ? "0 30px 90px rgba(15,23,42,0.14)" : "0 30px 90px rgba(0,0,0,0.50)",
  };

  const confirmStatus =
    !confirmPassword ? undefined
    : confirmPassword === newPassword ? "success"
    : "error";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: M.overlay,
        backdropFilter: "blur(7px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "12px" : "24px 16px",
        boxSizing: "border-box",
      }}
    >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: M.bg,
            border: `1px solid ${postSuccess ? "rgba(0,196,106,0.30)" : M.border}`,
            borderRadius: 20,
            padding: 16,
            boxSizing: "border-box",
            boxShadow: postSuccess
              ? `${M.shadow}, 0 0 0 1px rgba(0,196,106,0.05)`
              : M.shadow,
            position: "relative",
            transition: "border-color 0.3s",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={passwordSaving || revokingOthers}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 38,
              height: 38,
              borderRadius: 14,
              border: `1px solid ${M.closeBtnBorder}`,
              background: M.closeBtn,
              color: M.closeBtnColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: (passwordSaving || revokingOthers) ? 0.4 : 1,
            }}
          >
            <X size={18} />
          </button>

          <div style={{ marginBottom: 12, paddingRight: 46 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                background: postSuccess ? "rgba(0,196,106,0.12)" : isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${postSuccess ? "rgba(0,196,106,0.24)" : M.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: postSuccess ? C.green : M.label,
                transition: "all 0.3s",
              }}>
                <Shield size={15} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: M.title }}>
                {postSuccess ? "Senha alterada!" : "Alterar senha"}
              </div>
            </div>
            <div style={{ fontSize: 13, color: M.sub, lineHeight: 1.6 }}>
              {postSuccess
                ? "Sua senha foi atualizada com sucesso. Deseja encerrar todas as outras sessões por segurança?"
                : "Para sua segurança, informe a senha atual e depois defina uma nova senha forte."}
            </div>
          </div>

          {postSuccess ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                background: "rgba(0,196,106,0.08)",
                border: "1px solid rgba(0,196,106,0.18)",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <CheckCircle2 size={20} color={C.green} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: M.title, marginBottom: 2 }}>
                    Senha atualizada com sucesso
                  </div>
                  <div style={{ fontSize: 12, color: M.sub }}>
                    Outras sessões ainda estão ativas.
                  </div>
                </div>
              </div>

              <Btn fullWidth onClick={onRevokeOthers} disabled={revokingOthers}>
                {revokingOthers ? "Encerrando..." : "Encerrar outras sessões"}
              </Btn>

              <Btn variant="secondary" fullWidth onClick={onKeepSessions}>
                Manter sessões ativas
              </Btn>
            </div>
          ) : (
            <>
              <PasswordInput
                label="Senha atual"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((prev) => !prev)}
                placeholder="Digite sua senha atual"
                disabled={passwordSaving}
                isLight={isLight}
              />

              <PasswordInput
                label="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((prev) => !prev)}
                placeholder="Digite sua nova senha"
                disabled={passwordSaving}
                isLight={isLight}
              />

              {newPassword ? <PasswordRulesCard checks={passwordChecks} isLight={isLight} /> : null}

              {newPassword && strength ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: isLight ? "rgba(15,23,42,0.10)" : C.border, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(strength.level / 3) * 100}%`,
                      background: strength.color,
                      borderRadius: 4,
                      transition: "all 0.35s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: strength.color, minWidth: 40, textAlign: "right" }}>
                    {strength.label}
                  </div>
                </div>
              ) : null}

              <PasswordInput
                label="Confirmar nova senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                placeholder="Repita a nova senha"
                status={confirmStatus}
                disabled={passwordSaving}
                isLight={isLight}
              />

              {confirmPassword && confirmPassword !== newPassword ? (
                <div style={{ fontSize: 11, color: "#FF4D4F", marginTop: -6, marginBottom: 10, fontWeight: 600 }}>
                  As senhas não coincidem
                </div>
              ) : null}

              {twofa ? (
                <div style={{
                  marginBottom: 10,
                  background: isLight ? "#F8FAFC" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${passwordError && passwordError.includes("autenticador") ? "rgba(255,77,79,0.30)" : M.cardBorder}`,
                  borderRadius: 12,
                  padding: "10px 14px 12px",
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: M.title, marginBottom: 2, textAlign: "center" }}>
                    Código do autenticador
                  </div>
                  <div style={{ fontSize: 10, color: M.sub, marginBottom: 10, textAlign: "center" }}>
                    Digite o código de 6 dígitos do Google Authenticator
                  </div>
                  <OtpInput
                    value={twofaCode}
                    onChange={setTwofaCode}
                    disabled={passwordSaving}
                    hasError={Boolean(passwordError && passwordError.includes("autenticador"))}
                    isLight={isLight}
                  />
                  {passwordError && passwordError.includes("autenticador") ? (
                    <div style={{ fontSize: 11, color: "#FF4D4F", fontWeight: 600, textAlign: "center", marginTop: 10 }}>
                      {passwordError}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {passwordError && !passwordError.includes("autenticador") ? (
                <div
                  style={{
                    background: "rgba(255,77,79,0.10)",
                    border: "1px solid rgba(255,77,79,0.22)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    fontSize: 13,
                    color: C.error,
                    marginBottom: 12,
                  }}
                >
                  {passwordError}
                </div>
              ) : null}

              <Btn fullWidth onClick={onSubmit} disabled={passwordSaving || !canSubmit}>
                {passwordSaving ? "Alterando..." : "Alterar senha"}
              </Btn>
            </>
          )}
        </div>
    </div>
  );
}

export default function ConfiguracoesDados({ isMobile }) {
  const { user, wallet, refreshProfile, patchUser } = useAuth();
  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [walletAddr, setWalletAddr] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingRecebimentos, setEditingRecebimentos] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ── Avatar ──────────────────────────────────────────────────────────────
  const [cropSrc, setCropSrc] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarInputRef = useRef(null);

  function handleAvatarFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target.result);
    reader.readAsDataURL(file);
  }

  async function handleAvatarConfirm(base64) {
    const prevAvatar = user?.avatar ?? "";
    console.log("[avatar] base64 size:", base64?.length, "chars (~" + Math.round(base64?.length / 1024) + "KB)");
    setCropSrc(null);
    setAvatarSaving(true);
    patchUser({ avatar: base64 });
    try {
      const res = await updateMySettings({ avatar: base64 });
      console.log("[avatar] PATCH response:", res?.user?.avatar?.slice(0, 60));
      await refreshProfile();
      console.log("[avatar] after refreshProfile, user.avatar:", user?.avatar?.slice(0, 60));
    } catch (err) {
      console.error("[avatar] PATCH/refresh FAILED:", err?.response?.status, err?.response?.data);
      patchUser({ avatar: prevAvatar });
    } finally {
      setAvatarSaving(false);
    }
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [twofaCode, setTwofaCode] = useState("");

  const twofa = Boolean(user?.twofaEnabled ?? user?.twofa ?? false);

  const passwordChecks = useMemo(
    () => getPasswordChecks(newPassword),
    [newPassword]
  );

  const passwordStrength = useMemo(
    () => (newPassword ? getPasswordStrength(passwordChecks) : null),
    [newPassword, passwordChecks]
  );

  const canSubmit = useMemo(
    () =>
      Boolean(currentPassword) &&
      passwordChecks.every((c) => c.valid) &&
      confirmPassword === newPassword &&
      confirmPassword.length > 0 &&
      (!twofa || /^\d{6}$/.test(twofaCode)),
    [currentPassword, passwordChecks, confirmPassword, newPassword, twofa, twofaCode]
  );

  const documentStatus = useMemo(() => getDocumentStatus(user), [user]);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setPixKey(user?.pixKey ?? "");
    setWalletAddr(wallet?.defaultAddress ?? "");
  }, [user, wallet]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await updateMySettings({
        name: name.trim(),
        phone: String(phone || "").replace(/\D/g, ""),
        pixKey: pixKey.trim(),
        defaultAddress: walletAddr.trim(),
      });

      await refreshProfile();

      setSaved(true);
      setEditingName(false);
      setEditingPhone(false);
      setEditingRecebimentos(false);

      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!canSubmit) return;
    setPasswordSaving(true);
    setPasswordError("");

    try {
      const res = await changeMyPassword({ currentPassword, newPassword, twofaCode: twofa ? twofaCode : undefined });

      if (res?.status) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTwofaCode("");
        setPostSuccess(true);
      } else {
        setPasswordError(res?.msg || "Erro ao alterar senha.");
      }
    } catch (err) {
      setPasswordError(err?.response?.data?.msg || "Erro ao alterar senha.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleRevokeOtherSessions() {
    setRevokingOthers(true);
    try {
      await logoutOtherSessions();
    } catch {
      // falha silenciosa — sessão do usuário permanece ativa
    } finally {
      setRevokingOthers(false);
      closePasswordModal();
    }
  }

  function openPasswordModal() {
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTwofaCode("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPostSuccess(false);
    setRevokingOthers(false);
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTwofaCode("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPostSuccess(false);
    setRevokingOthers(false);
  }

  const isEditingAnything =
    editingName || editingPhone || editingRecebimentos;

  return (
    <div>
      <PageHeader title="Dados pessoais" subtitle="Informações da sua conta OrionPay" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
          gap: 16,
        }}
      >
        <Card>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.white,
              marginBottom: 6,
            }}
          >
            Informações pessoais
          </div>

          <div
            style={{
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Gerencie os dados principais da sua conta OrionPay.
          </div>

          {/* ── Avatar ──────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "16px 0",
              borderTop: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              marginBottom: 4,
            }}
          >
            {/* Avatar preview */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  overflow: "hidden",
                  background: user?.avatar ? "transparent" : "rgba(45,134,89,0.12)",
                  border: `1.5px solid ${user?.avatar ? C.borderStrong : "rgba(45,134,89,0.22)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => avatarInputRef.current?.click()}
                title="Alterar foto de perfil"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <span style={{ fontSize: 24, fontWeight: 800, color: C.green }}>
                    {String(user?.name || user?.email || "U").trim().charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Hover overlay */}
                <div
                  className="avatar-hover-overlay"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.52)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.18s",
                    borderRadius: "inherit",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  {avatarSaving ? (
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "avatar-spin 0.7s linear infinite",
                    }} />
                  ) : (
                    <Camera size={18} color="#fff" />
                  )}
                </div>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Text + action */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 3 }}>
                Foto de perfil
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                JPG, PNG ou WEBP · Será exibida na sidebar e no seu perfil
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarSaving}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: avatarSaving ? C.dim : C.light,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: avatarSaving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => !avatarSaving && (e.currentTarget.style.borderColor = C.borderStrong)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                >
                  {avatarSaving ? "Salvando..." : user?.avatar ? "Trocar foto" : "Adicionar foto"}
                </button>
                {user?.avatar && (
                  <button
                    type="button"
                    onClick={async () => {
                      setAvatarSaving(true);
                      try {
                        await updateMySettings({ avatar: "" });
                        await refreshProfile();
                      } finally {
                        setAvatarSaving(false);
                      }
                    }}
                    disabled={avatarSaving}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: "transparent",
                      color: C.muted,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
          <style>{`@keyframes avatar-spin { to { transform: rotate(360deg); } }`}</style>

          {editingName ? (
            <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
              <Input
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ActionButton
                  onClick={() => setEditingName(false)}
                  label="Fechar"
                  icon="close"
                />
              </div>
            </div>
          ) : (
            <StaticField
              label="Nome"
              value={name}
              right={<ActionButton onClick={() => setEditingName(true)} label="Editar" />}
            />
          )}

          <StaticField
            label="Email"
            value={user?.email ?? "—"}
            right={
              user?.emailVerified ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 10px",
                    borderRadius: 999,
                    background: "rgba(0,196,106,0.10)",
                    border: "1px solid rgba(0,196,106,0.18)",
                    color: C.green,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={14} />
                  Email verificado
                </div>
              ) : null
            }
          />

          <StaticField
            label="Senha"
            value="************"
            right={<ActionButton onClick={openPasswordModal} label="Editar" />}
          />

          <StaticField
            label="CPF / CNPJ"
            value={documentStatus.value}
            valueColor={documentStatus.valueColor}
            right={
              documentStatus.verified ? (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: documentStatus.badgeColor,
                  }}
                >
                  Verificado
                </div>
              ) : null
            }
          />

          {editingPhone ? (
            <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
              <Input
                label="Telefone"
                value={formatPhone(phone)}
                onChange={(e) =>
                  setPhone(String(e.target.value || "").replace(/\D/g, ""))
                }
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ActionButton
                  onClick={() => setEditingPhone(false)}
                  label="Fechar"
                  icon="close"
                />
              </div>
            </div>
          ) : (
            <StaticField
              label="Telefone"
              value={formatPhone(phone)}
              right={<ActionButton onClick={() => setEditingPhone(true)} label="Editar" />}
            />
          )}
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 6,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: C.white,
                  marginBottom: 6,
                }}
              >
                Recebimentos
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.6,
                }}
              >
                Defina seus dados para recebimento via PIX e carteira padrão.
              </div>
            </div>

            <ActionButton
              onClick={() => setEditingRecebimentos((prev) => !prev)}
              label={editingRecebimentos ? "Fechar" : "Editar"}
              icon={editingRecebimentos ? "close" : "edit"}
            />
          </div>

          {editingRecebimentos ? (
            <div style={{ marginTop: 16 }}>
              <Input
                label="Chave PIX"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />

              <Input
                label="Endereço USDT (TRC20)"
                value={walletAddr}
                onChange={(e) => setWalletAddr(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <StaticField label="Chave PIX" value={pixKey || "Não definida"} />
              <StaticField
                label="Endereço USDT (TRC20)"
                value={walletAddr || "Não definido"}
              />
            </div>
          )}
        </Card>
      </div>

      {isEditingAnything ? (
        <div style={{ marginTop: 16 }}>
          {error ? (
            <div
              style={{
                background: "rgba(255,77,79,0.10)",
                border: "1px solid rgba(255,77,79,0.22)",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 13,
                color: C.error,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          ) : null}

          {saved ? (
            <div
              style={{
                background: "rgba(0,196,106,0.10)",
                border: "1px solid rgba(0,196,106,0.20)",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 13,
                color: C.green,
                marginBottom: 12,
              }}
            >
              Configurações salvas com sucesso.
            </div>
          ) : null}

          <Btn fullWidth onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Btn>
        </div>
      ) : null}

      <PasswordModal
        isMobile={isMobile}
        open={showPasswordModal}
        onClose={closePasswordModal}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showCurrentPassword={showCurrentPassword}
        setShowCurrentPassword={setShowCurrentPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        passwordChecks={passwordChecks}
        passwordError={passwordError}
        passwordSaving={passwordSaving}
        canSubmit={canSubmit}
        strength={passwordStrength}
        postSuccess={postSuccess}
        onRevokeOthers={handleRevokeOtherSessions}
        onKeepSessions={closePasswordModal}
        revokingOthers={revokingOthers}
        twofa={twofa}
        twofaCode={twofaCode}
        setTwofaCode={setTwofaCode}
        theme={theme}
        onSubmit={handleChangePassword}
      />

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={1}
          outputWidth={400}
          title="Ajustar foto de perfil"
          onConfirm={handleAvatarConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}