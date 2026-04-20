import { useEffect, useRef, useState } from "react";
import {
  Key,
  LogOut,
  ShieldCheck,
  X,
  FileCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ChevronRight,
  Circle,
} from "lucide-react";
import C from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { updateMySettings } from "../services/user.service";
import { setup2FA, enable2FA, disable2FA } from "../services/twofa.service";
import { submitKyc, getMyKyc } from "../services/kyc.service";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Btn from "../components/ui/Btn";
import PageHeader from "../components/ui/PageHeader";

function sanitize2FACode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function sanitizeDocument(value) {
  return String(value || "").replace(/\D/g, "");
}

function getAccountStatusMeta(user, kyc) {
  const emailVerified = Boolean(user?.emailVerified);
  const twofaEnabled = Boolean(user?.twofaEnabled ?? user?.twofa);
  const hasSubmission = Boolean(kyc?._id || kyc?.status || kyc?.submittedAt);
  const kycStatus = String(kyc?.status || "").toLowerCase();

  if (!emailVerified) {
    return {
      label: "Email pendente",
      description: "Confirme o email da conta para continuar a ativação.",
      color: "#F5C542",
      bg: "rgba(245,197,66,0.10)",
      border: "rgba(245,197,66,0.22)",
      icon: Clock3,
    };
  }

  if (!hasSubmission) {
    return {
      label: "Conta básica",
      description: "Envie seus documentos para iniciar a verificação da conta.",
      color: "#9AA4B2",
      bg: "rgba(154,164,178,0.08)",
      border: "rgba(154,164,178,0.18)",
      icon: Lock,
    };
  }

  if (kycStatus === "pending") {
    return {
      label: "Documentos enviados",
      description: "Seu envio foi recebido e está aguardando análise.",
      color: "#F5C542",
      bg: "rgba(245,197,66,0.10)",
      border: "rgba(245,197,66,0.22)",
      icon: Clock3,
    };
  }

  if (kycStatus === "under_review") {
    return {
      label: "Em análise",
      description: "Seu cadastro está em revisão pela equipe OrionPay.",
      color: "#F5C542",
      bg: "rgba(245,197,66,0.10)",
      border: "rgba(245,197,66,0.22)",
      icon: Clock3,
    };
  }

  if (kycStatus === "rejected") {
    return {
      label: "KYC rejeitado",
      description:
        kyc?.rejectionReason?.trim() ||
        "Seus documentos foram rejeitados. Revise os arquivos e envie novamente.",
      color: "#FF4D4F",
      bg: "rgba(255,77,79,0.10)",
      border: "rgba(255,77,79,0.22)",
      icon: AlertCircle,
    };
  }

  if (kycStatus === "approved" && !twofaEnabled) {
    return {
      label: "KYC aprovado",
      description: "Seu KYC foi aprovado. Ative o 2FA para liberar a operação.",
      color: "#00C46A",
      bg: "rgba(0,196,106,0.10)",
      border: "rgba(0,196,106,0.22)",
      icon: CheckCircle2,
    };
  }

  if (kycStatus === "approved" && twofaEnabled) {
    return {
      label: "Conta operacional ativa",
      description:
        "Sua conta está pronta para criar cobranças e solicitar saques.",
      color: "#00C46A",
      bg: "rgba(0,196,106,0.10)",
      border: "rgba(0,196,106,0.22)",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Conta básica",
    description: "Envie seus documentos para iniciar a verificação da conta.",
    color: "#9AA4B2",
    bg: "rgba(154,164,178,0.08)",
    border: "rgba(154,164,178,0.18)",
    icon: Lock,
  };
}

function getKycJourney(user, kyc, twofaEnabled) {
  const emailVerified = Boolean(user?.emailVerified);
  const hasSubmission = Boolean(kyc?._id || kyc?.status || kyc?.submittedAt);
  const kycStatus = String(kyc?.status || "").toLowerCase();

  function makeStatus(label, color, icon) {
    return { label, color, icon };
  }

  const notStarted = makeStatus("Nao iniciado", C.muted, Circle);
  const pending = makeStatus("Pendente", C.muted, Circle);
  const sent = makeStatus("Enviado", "#F5C542", FileCheck);
  const underReview = makeStatus("Em análise", "#F5C542", Clock3);
  const approved = makeStatus("Concluído", C.green, CheckCircle2);
  const rejected = makeStatus("Rejeitado", C.error, AlertCircle);

  let documentsStatus = notStarted;
  let approvalStatus = notStarted;

  if (hasSubmission) {
    if (kycStatus === "approved") {
      documentsStatus = approved;
      approvalStatus = approved;
    } else if (kycStatus === "rejected") {
      documentsStatus = sent;
      approvalStatus = rejected;
    } else if (kycStatus === "pending") {
      documentsStatus = sent;
      approvalStatus = underReview;
    } else if (kycStatus === "under_review") {
      documentsStatus = sent;
      approvalStatus = underReview;
    } else {
      documentsStatus = sent;
      approvalStatus = pending;
    }
  }

  return [
    {
      key: "email",
      label: "Email verificado",
      status: emailVerified ? approved : pending,
    },
    {
      key: "twofa",
      label: "2FA ativo",
      status: twofaEnabled ? approved : pending,
    },
    {
      key: "documents",
      label: "Documentos enviados",
      status: documentsStatus,
    },
    {
      key: "approval",
      label: "KYC aprovado",
      status: approvalStatus,
    },
  ];
}

function TwoFactorCodeInput({ value, onChange, isMobile }) {
  const inputRefs = useRef([]);

  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

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

    const nextFocusIndex = Math.min(Math.max(normalized.length - 1, 0), 5);
    inputRefs.current[nextFocusIndex]?.focus();
    inputRefs.current[nextFocusIndex]?.select?.();
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          marginBottom: 10,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        Código de autenticação
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? 8 : 10,
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
              width: isMobile ? 42 : 48,
              height: isMobile ? 52 : 56,
              background: "#080C12",
              border: `1px solid ${
                digit ? "rgba(0,224,148,0.40)" : C.border
              }`,
              borderRadius: 16,
              color: C.white,
              fontSize: isMobile ? 20 : 22,
              fontWeight: 800,
              textAlign: "center",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              boxShadow: digit ? "0 0 0 3px rgba(0,224,148,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StatusRow({ label, status }) {
  const Icon = status.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: C.white,
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: status.color,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Icon size={14} />
        {status.label}
      </div>
    </div>
  );
}

function UploadCard({
  title,
  helper,
  file,
  onChange,
  accept = ".jpg,.jpeg,.png,.pdf",
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 12,
        minHeight: 122,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: C.white,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        style={{
          width: "100%",
          color: C.muted,
          fontSize: 12,
        }}
      />

      <div
        style={{
          fontSize: 11,
          color: C.muted,
          marginTop: 8,
          lineHeight: 1.45,
        }}
      >
        {helper}
      </div>

      {file ? (
        <div
          style={{
            fontSize: 11,
            color: C.green,
            marginTop: 8,
            wordBreak: "break-word",
            fontWeight: 600,
          }}
        >
          {file.name}
        </div>
      ) : null}
    </div>
  );
}

export default function ConfiguracoesPage({ isMobile }) {
  const { user, wallet, logout, refreshProfile } = useAuth();

  const [empresa, setEmpresa] = useState("");
  const [doc, setDoc] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [twofa, setTwofa] = useState(false);
  const [notif, setNotif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twofaMode, setTwofaMode] = useState("enable");
  const [qrCode, setQrCode] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [twofaLoading, setTwofaLoading] = useState(false);

  const [showKycModal, setShowKycModal] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycName, setKycName] = useState("");
  const [kycDocument, setKycDocument] = useState("");
  const [kycType, setKycType] = useState("cpf");
  const [selfieFile, setSelfieFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [livenessFile, setLivenessFile] = useState(null);

  useEffect(() => {
    setEmpresa(user?.name ?? "");
    setDoc(user?.document ?? "");
    setPixKey(user?.pixKey ?? "");
    setWalletAddr(wallet?.defaultAddress ?? "");
    setTwofa(Boolean(user?.twofaEnabled ?? user?.twofa ?? false));
    setNotif(Boolean(user?.notifications ?? true));

    setKycName(user?.name ?? "");
    setKycDocument(user?.document ?? "");
  }, [user, wallet]);

  useEffect(() => {
    let mounted = true;

    async function loadKyc() {
      try {
        setKycLoading(true);
        const data = await getMyKyc();
        if (!mounted) return;

        setKyc(data || null);

        if (data?.fullName) setKycName(data.fullName);
        if (data?.documentNumber) setKycDocument(data.documentNumber);
        if (data?.documentType) setKycType(data.documentType);
      } catch {
      } finally {
        if (mounted) setKycLoading(false);
      }
    }

    if (user?.emailVerified) {
      loadKyc();
    } else {
      setKyc(null);
    }

    return () => {
      mounted = false;
    };
  }, [user?.emailVerified]);

  function clearMessages() {
    setError("");
    setSuccess("");
    setSaved(false);
  }

  function close2FAModal() {
    setShow2FAModal(false);
    setTwofaMode("enable");
    setQrCode("");
    setManualKey("");
    setTwofaCode("");
    setTwofaLoading(false);
    setError("");
    setSuccess("");
  }

  function openKycModal() {
    clearMessages();
    setShowKycModal(true);
  }

  function closeKycModal() {
    setShowKycModal(false);
    setSelfieFile(null);
    setDocumentFile(null);
    setLivenessFile(null);
    setError("");
    setSuccess("");
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    setSuccess("");

    try {
      await updateMySettings({
        name: empresa.trim(),
        document: doc.trim(),
        pixKey: pixKey.trim(),
        defaultAddress: walletAddr.trim(),
        notifications: notif,
      });

      await refreshProfile();

      setSaved(true);
      setSuccess("");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen2FASetup() {
    clearMessages();
    setTwofaLoading(true);

    try {
      const res = await setup2FA();

      if (res?.status) {
        setTwofaMode("enable");
        setQrCode(res?.qr || "");
        setManualKey(res?.manualKey || res?.secret || "");
        setTwofaCode("");
        setShow2FAModal(true);
      } else {
        setError(res?.msg || "Erro ao iniciar configuracao do 2FA.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.msg || "Erro ao iniciar configuracao do 2FA."
      );
    } finally {
      setTwofaLoading(false);
    }
  }

  function handleOpen2FADisable() {
    clearMessages();
    setTwofaMode("disable");
    setQrCode("");
    setManualKey("");
    setTwofaCode("");
    setShow2FAModal(true);
  }

  async function handleConfirm2FAEnable() {
    const code = sanitize2FACode(twofaCode);

    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }

    setTwofaLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await enable2FA(code);

      if (res?.status) {
        setTwofa(true);
        close2FAModal();
        await refreshProfile();
        setSuccess("2FA ativado com sucesso.");
      } else {
        setError(res?.msg || "Código inválido.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao ativar 2FA.");
    } finally {
      setTwofaLoading(false);
    }
  }

  async function handleConfirm2FADisable() {
    const code = sanitize2FACode(twofaCode);

    if (code.length !== 6) {
      setError("Digite o código atual de 6 dígitos.");
      return;
    }

    setTwofaLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await disable2FA(code);

      if (res?.status) {
        setTwofa(false);
        close2FAModal();
        await refreshProfile();
        setSuccess("2FA desativado com sucesso.");
      } else {
        setError(res?.msg || "Código inválido.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao desativar 2FA.");
    } finally {
      setTwofaLoading(false);
    }
  }

  async function handleToggle2FA() {
    clearMessages();

    if (twofaLoading) return;

    if (twofa) {
      handleOpen2FADisable();
      return;
    }

    await handleOpen2FASetup();
  }

  function handleToggleNotifications() {
    clearMessages();
    setNotif((prev) => !prev);
  }

  async function handleSubmitKyc() {
    clearMessages();

    if (!user?.emailVerified) {
      setError("Verifique seu email antes de enviar seus documentos.");
      return;
    }

    if (!kycName.trim() || !kycDocument.trim()) {
      setError("Preencha nome completo e documento.");
      return;
    }

    if (!selfieFile || !documentFile || !livenessFile) {
      setError(
        "Envie selfie, documento e selfie com documento para continuar."
      );
      return;
    }

    try {
      setKycSubmitting(true);

      const formData = new FormData();
      formData.append("fullName", kycName.trim());
      formData.append("documentNumber", sanitizeDocument(kycDocument));
      formData.append("documentType", kycType);
      formData.append("selfieFile", selfieFile);
      formData.append("documentFile", documentFile);
      formData.append("livenessFile", livenessFile);

      const res = await submitKyc(formData);

      if (res?.status) {
        setSuccess("KYC enviado com sucesso. Agora sua conta ficará em análise.");
        setSelfieFile(null);
        setDocumentFile(null);
        setLivenessFile(null);

        await refreshProfile();
        const updated = await getMyKyc();
        setKyc(updated || null);
      } else {
        setError(res?.msg || "Erro ao enviar KYC.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao enviar KYC.");
    } finally {
      setKycSubmitting(false);
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";
  const isDisableMode = twofaMode === "disable";
  const accountMeta = getAccountStatusMeta(user, kyc);
  const StatusIcon = accountMeta.icon;
  const kycJourney = getKycJourney(user, kyc, twofa);

  const hasKycSubmission = Boolean(kyc?._id || kyc?.status || kyc?.submittedAt);

  const canShowKycForm =
    !hasKycSubmission || String(kyc?.status || "").toLowerCase() === "rejected";

  return (
    <div>
      <PageHeader title="Configuracoes" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
        }}
      >
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg,rgba(0,196,106,0.3),rgba(212,175,55,0.3))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${C.green}`,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.green,
                }}
              >
                {initial}
              </span>
            </div>

            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.white,
                }}
              >
                {user?.name ?? "—"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                {user?.email ?? "—"}
              </div>
            </div>
          </div>

          <Input
            label="Nome da empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />

          <Input
            label="CNPJ / CPF"
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
          />
        </Card>

        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.white,
              marginBottom: 16,
            }}
          >
            Recebimento
          </div>

          <Input
            label="Chave PIX"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.white,
              marginBottom: 12,
              marginTop: 4,
            }}
          >
            Carteira padrao
          </div>

          <Input
            label="Endereco USDT (TRC20)"
            value={walletAddr}
            onChange={(e) => setWalletAddr(e.target.value)}
          />
        </Card>

        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.white,
              marginBottom: 14,
            }}
          >
            Seguranca
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.white,
                }}
              >
                2FA
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                {twofa
                  ? "Autenticacao em duas etapas ativa"
                  : "Autenticacao 2 fatores"}
              </div>
            </div>

            <div
              onClick={handleToggle2FA}
              style={{
                width: 46,
                height: 26,
                borderRadius: 13,
                background: twofa ? C.green : C.border,
                position: "relative",
                cursor: twofaLoading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
                opacity: twofaLoading ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: twofa ? 23 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.white,
                }}
              >
                Notificacoes
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                Email e push
              </div>
            </div>

            <div
              onClick={handleToggleNotifications}
              style={{
                width: 46,
                height: 26,
                borderRadius: 13,
                background: notif ? C.green : C.border,
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: notif ? 23 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </div>

          <div
            onClick={openKycModal}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: `1px solid ${C.border}`,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: accountMeta.bg,
                  border: `1px solid ${accountMeta.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: accountMeta.color,
                  flexShrink: 0,
                }}
              >
                <StatusIcon size={15} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.white,
                  }}
                >
                  Verificacao de conta
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                  }}
                >
                  {accountMeta.label}
                </div>
              </div>
            </div>

            <ChevronRight size={16} color={C.muted} />
          </div>

          <div style={{ paddingTop: 14 }}>
            <Btn variant="secondary" fullWidth icon={<Key size={15} />}>
              Alterar senha
            </Btn>
          </div>
        </Card>

        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.white,
              marginBottom: 14,
            }}
          >
            Conta
          </div>

          <div
            style={{
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            Mantenha seus dados atualizados para recebimentos e saques.
          </div>

          {error && !show2FAModal && !showKycModal ? (
            <div
              style={{
                background: "rgba(255,77,79,0.08)",
                border: "1px solid rgba(255,77,79,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
                color: C.error,
              }}
            >
              {error}
            </div>
          ) : null}

          {success && !show2FAModal && !showKycModal ? (
            <div
              style={{
                background: "rgba(0,196,106,0.08)",
                border: "1px solid rgba(0,196,106,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
                color: C.green,
              }}
            >
              {success}
            </div>
          ) : null}

          {saved ? (
            <div
              style={{
                background: "rgba(0,196,106,0.08)",
                border: "1px solid rgba(0,196,106,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
                color: C.green,
              }}
            >
              Configuracoes salvas com sucesso.
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Btn fullWidth onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </Btn>

            <Btn
              variant="secondary"
              fullWidth
              icon={<LogOut size={15} />}
              onClick={logout}
            >
              Sair
            </Btn>
          </div>
        </Card>
      </div>

      {showKycModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: isMobile ? "20px 10px 14px" : "0px 20px 20px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,16,28,0.98), rgba(7,11,20,0.98))",
                border: `1px solid ${accountMeta.border}`,
                borderRadius: 22,
                width: "100%",
                maxWidth: 660,
                boxSizing: "border-box",
                boxShadow:
                  "0 30px 90px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.02)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: isMobile ? "14px 14px 12px" : "16px 16px 12px",
                  borderBottom: `1px solid ${C.border}`,
                  position: "relative",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.005))",
                }}
              >
                <button
                  type="button"
                  onClick={closeKycModal}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 36,
                    height: 36,
                    borderRadius: 13,
                    border: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,0.02)",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    paddingRight: 42,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 15,
                      background: accountMeta.bg,
                      border: `1px solid ${accountMeta.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: accountMeta.color,
                      flexShrink: 0,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                  >
                    <StatusIcon size={19} />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: isMobile ? 19 : 22,
                        fontWeight: 800,
                        color: C.white,
                        lineHeight: 1.1,
                        marginBottom: 5,
                        letterSpacing: -0.2,
                      }}
                    >
                      Verificacao de conta
                    </div>

                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.muted,
                        lineHeight: 1.6,
                        maxWidth: 480,
                      }}
                    >
                      Envie seus documentos para ativar sua conta operacional e
                      liberar cobrancas e saques.
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: isMobile ? 14 : 16,
                }}
              >
                {error ? (
                  <div
                    style={{
                      background: "rgba(255,77,79,0.10)",
                      border: "1px solid rgba(255,77,79,0.22)",
                      borderRadius: 13,
                      padding: "10px 12px",
                      marginBottom: 12,
                      fontSize: 13,
                      color: C.error,
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div
                    style={{
                      background: "rgba(0,196,106,0.10)",
                      border: "1px solid rgba(0,196,106,0.20)",
                      borderRadius: 13,
                      padding: "10px 12px",
                      marginBottom: 12,
                      fontSize: 13,
                      color: C.green,
                      lineHeight: 1.5,
                    }}
                  >
                    {success}
                  </div>
                ) : null}

                <div
                  style={{
                    background: accountMeta.bg,
                    border: `1px solid ${accountMeta.border}`,
                    borderRadius: 13,
                    padding: "11px 13px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: accountMeta.color,
                      marginBottom: 5,
                    }}
                  >
                    {accountMeta.label}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      lineHeight: 1.65,
                    }}
                  >
                    {accountMeta.description}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {kycJourney.map((step) => (
                    <StatusRow
                      key={step.key}
                      label={step.label}
                      status={step.status}
                    />
                  ))}
                </div>

                {kycLoading ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 12,
                    }}
                  >
                    Carregando status do KYC...
                  </div>
                ) : null}

                {hasKycSubmission ? (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 13,
                      padding: "11px 13px",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.white,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FileCheck size={15} />
                      Ultimo envio de KYC
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        lineHeight: 1.75,
                      }}
                    >
                      <div>
                        <strong style={{ color: C.white }}>Status:</strong>{" "}
                        {kyc?.status || "—"}
                      </div>
                      <div>
                        <strong style={{ color: C.white }}>Documento:</strong>{" "}
                        {kyc?.documentNumber || "—"}
                      </div>
                      <div>
                        <strong style={{ color: C.white }}>Tipo:</strong>{" "}
                        {String(kyc?.documentType || "").toUpperCase() || "—"}
                      </div>
                      {kyc?.rejectionReason ? (
                        <div>
                          <strong style={{ color: C.white }}>Motivo:</strong>{" "}
                          {kyc.rejectionReason}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {canShowKycForm ? (
                  <>
                    <Input
                      label="Nome completo"
                      value={kycName}
                      onChange={(e) => setKycName(e.target.value)}
                    />

                    <Input
                      label="CPF / CNPJ"
                      value={kycDocument}
                      onChange={(e) => setKycDocument(e.target.value)}
                    />

                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.muted,
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Tipo de documento
                      </div>

                      <select
                        value={kycType}
                        onChange={(e) => setKycType(e.target.value)}
                        style={{
                          width: "100%",
                          height: 44,
                          borderRadius: 12,
                          border: `1px solid ${C.border}`,
                          background: "#0B1220",
                          color: C.white,
                          padding: "0 14px",
                          outline: "none",
                          fontFamily: "inherit",
                          fontSize: 14,
                        }}
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <UploadCard
                        title="Selfie"
                        helper="JPG, PNG ou PDF. Maximo de 8MB."
                        file={selfieFile}
                        onChange={setSelfieFile}
                      />

                      <UploadCard
                        title="Documento"
                        helper="JPG, PNG ou PDF. Maximo de 8MB."
                        file={documentFile}
                        onChange={setDocumentFile}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <UploadCard
                        title="Selfie com documento"
                        helper="Envie uma selfie segurando o documento na mão. JPG, PNG ou PDF. Maximo de 8MB."
                        file={livenessFile}
                        onChange={setLivenessFile}
                      />
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 13,
                      padding: "11px 13px",
                      fontSize: 12,
                      color: C.muted,
                      lineHeight: 1.7,
                      marginBottom: 12,
                    }}
                  >
                    {String(kyc?.status || "").toLowerCase() === "approved" &&
                    twofa
                      ? "Sua conta ja esta ativa para operar."
                      : ["pending", "under_review"].includes(
                          String(kyc?.status || "").toLowerCase()
                        )
                      ? "Seu envio atual ja esta em analise. Assim que houver revisao, o status sera atualizado aqui."
                      : "No momento nao e possivel reenviar documentos."}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: isMobile ? 14 : 16,
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  gap: 10,
                  flexDirection: isMobile ? "column" : "row",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.008), rgba(255,255,255,0.018))",
                }}
              >
                {canShowKycForm ? (
                  <Btn
                    fullWidth
                    onClick={handleSubmitKyc}
                    disabled={kycSubmitting}
                  >
                    {kycSubmitting
                      ? "Enviando documentos..."
                      : "Enviar para analise"}
                  </Btn>
                ) : null}

                <Btn variant="secondary" fullWidth onClick={closeKycModal}>
                  Fechar
                </Btn>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {show2FAModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.74)",
            backdropFilter: "blur(7px)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "12px" : "16px",
              boxSizing: "border-box",
              transform: isDisableMode ? "translateY(0px)" : "translateY(58px)",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,16,28,0.98), rgba(7,11,20,0.98))",
                border: `1px solid ${
                  isDisableMode
                    ? "rgba(255,77,79,0.20)"
                    : "rgba(0,224,148,0.16)"
                }`,
                borderRadius: 24,
                width: "100%",
                maxWidth: isDisableMode ? 520 : 620,
                padding: isMobile ? 14 : 18,
                boxSizing: "border-box",
                boxShadow: isDisableMode
                  ? "0 30px 90px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,77,79,0.05)"
                  : "0 30px 90px rgba(0,0,0,0.50), 0 0 0 1px rgba(0,224,148,0.05)",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={close2FAModal}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  background: "rgba(255,255,255,0.02)",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 12,
                  paddingRight: 40,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 15,
                    background: isDisableMode
                      ? "rgba(255,77,79,0.12)"
                      : "rgba(0,224,148,0.12)",
                    border: isDisableMode
                      ? "1px solid rgba(255,77,79,0.24)"
                      : "1px solid rgba(0,224,148,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDisableMode ? C.error : "#00e094",
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 20 : 24,
                      fontWeight: 800,
                      color: C.white,
                      lineHeight: 1.1,
                      marginBottom: 4,
                    }}
                  >
                    {isDisableMode ? "Desativar 2FA" : "Ativar 2FA"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      lineHeight: 1.6,
                      maxWidth: 440,
                    }}
                  >
                    {isDisableMode
                      ? "Confirme com o código atual do Google Authenticator para remover a proteção da conta."
                      : "Proteja o acesso da sua conta com autenticação em duas etapas usando o Google Authenticator."}
                  </div>
                </div>
              </div>

              {error ? (
                <div
                  style={{
                    background: "rgba(255,77,79,0.10)",
                    border: "1px solid rgba(255,77,79,0.22)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    marginBottom: 12,
                    fontSize: 13,
                    color: C.error,
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              ) : null}

              {success ? (
                <div
                  style={{
                    background: "rgba(0,196,106,0.10)",
                    border: "1px solid rgba(0,196,106,0.20)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    marginBottom: 12,
                    fontSize: 13,
                    color: C.green,
                    lineHeight: 1.5,
                  }}
                >
                  {success}
                </div>
              ) : null}

              {isDisableMode ? (
                <>
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,77,79,0.08), rgba(255,77,79,0.04))",
                      border: "1px solid rgba(255,77,79,0.18)",
                      borderRadius: 16,
                      padding: isMobile ? 12 : 14,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.white,
                        marginBottom: 8,
                      }}
                    >
                      Confirmacao de seguranca
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: C.muted,
                        lineHeight: 1.75,
                      }}
                    >
                      <div>1. Abra o Google Authenticator.</div>
                      <div>2. Pegue o código atual de 6 dígitos da OrionPay.</div>
                      <div>3. Digite abaixo para confirmar a desativação.</div>
                    </div>
                  </div>

                  <TwoFactorCodeInput
                    value={twofaCode}
                    onChange={(value) => setTwofaCode(sanitize2FACode(value))}
                    isMobile={isMobile}
                  />

                  <div
                    style={{
                      marginTop: 8,
                      textAlign: "center",
                      fontSize: 12,
                      color: C.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    Verifique se o horário do seu celular está correto caso o
                    código não seja aceito.
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: isMobile ? 12 : 14,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.white,
                        marginBottom: 8,
                      }}
                    >
                      Como ativar
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: C.muted,
                        lineHeight: 1.75,
                      }}
                    >
                      <div>1. Escaneie o QR Code com o Google Authenticator.</div>
                      <div>2. Ou use a chave manual.</div>
                      <div>3. Digite o código de 6 dígitos para confirmar.</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "200px 1fr",
                      gap: 12,
                      alignItems: "stretch",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${C.border}`,
                        borderRadius: 16,
                        padding: 12,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: isMobile ? 180 : 200,
                      }}
                    >
                      {qrCode ? (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: 14,
                            padding: 10,
                            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                          }}
                        >
                          <img
                            src={qrCode}
                            alt="QR Code do 2FA"
                            style={{
                              width: isMobile ? 140 : 150,
                              height: isMobile ? 140 : 150,
                              display: "block",
                              maxWidth: "100%",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            color: C.muted,
                            fontSize: 13,
                            textAlign: "center",
                          }}
                        >
                          QR Code indisponível no momento.
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${C.border}`,
                          borderRadius: 16,
                          padding: "12px 14px",
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
                          Chave manual
                        </div>

                        <div
                          style={{
                            color: C.white,
                            fontSize: 13,
                            fontWeight: 700,
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                            letterSpacing: 0.15,
                          }}
                        >
                          {manualKey || "Chave não disponível"}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(0,224,148,0.06)",
                          border: "1px solid rgba(0,224,148,0.14)",
                          borderRadius: 14,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: C.white,
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          Confirmação de segurança
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: C.muted,
                            lineHeight: 1.6,
                          }}
                        >
                          Depois de escanear, digite o código atual gerado no
                          aplicativo.
                        </div>
                      </div>
                    </div>
                  </div>

                  <TwoFactorCodeInput
                    value={twofaCode}
                    onChange={(value) => setTwofaCode(sanitize2FACode(value))}
                    isMobile={isMobile}
                  />

                  <div
                    style={{
                      marginTop: 8,
                      textAlign: "center",
                      fontSize: 12,
                      color: C.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    Verifique se o horário do seu celular está correto caso o
                    código não seja aceito.
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 14,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Btn
                  fullWidth
                  onClick={
                    isDisableMode ? handleConfirm2FADisable : handleConfirm2FAEnable
                  }
                  disabled={twofaLoading}
                >
                  {twofaLoading
                    ? isDisableMode
                      ? "Desativando..."
                      : "Confirmando..."
                    : isDisableMode
                    ? "Confirmar desativacao"
                    : "Confirmar ativacao"}
                </Btn>

                <Btn variant="secondary" fullWidth onClick={close2FAModal}>
                  Cancelar
                </Btn>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}