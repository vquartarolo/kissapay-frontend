import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck,
  Lock,
  Upload,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Input from "../../components/ui/Input";
import Btn from "../../components/ui/Btn";
import C from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { getMyKyc, submitKyc } from "../../services/kyc.service";

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

function UploadCard({
  title,
  helper,
  file,
  onChange,
  accept = ".jpg,.jpeg,.png,.pdf",
  isMobile,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: isMobile ? 14 : 16,
        minHeight: isMobile ? "auto" : 156,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            background: C.cardSoft,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.muted,
          }}
        >
          <Upload size={14} />
        </div>

        <div
          style={{
            fontSize: 13,
            color: C.white,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
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
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
        {helper}
      </div>

      {file ? (
        <div
          style={{
            fontSize: 11,
            color: C.green,
            marginTop: 10,
            wordBreak: "break-word",
            fontWeight: 700,
          }}
        >
          {file.name}
        </div>
      ) : null}
    </div>
  );
}

export default function ConfiguracoesVerificacao({ isMobile }) {
  const { user, refreshProfile } = useAuth();

  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [kycName, setKycName] = useState("");
  const [kycDocument, setKycDocument] = useState("");
  const [kycType, setKycType] = useState("cpf");

  const [documentFile, setDocumentFile] = useState(null);
  const [livenessFile, setLivenessFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);

  useEffect(() => {
    setKycName(user?.name ?? "");
    setKycDocument(user?.document ?? "");
  }, [user]);

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

    if (!documentFile || !livenessFile || !addressProofFile) {
      setError(
        "Envie documento, selfie com documento e comprovante de endereço para continuar."
      );
      return;
    }

    try {
      setKycSubmitting(true);

      const formData = new FormData();
      formData.append("fullName", kycName.trim());
      formData.append("documentNumber", sanitizeDocument(kycDocument));
      formData.append("documentType", kycType);

      formData.append("documentFile", documentFile);

      // Mantém compatibilidade com backend antigo:
      // usa a selfie com documento como selfieFile e livenessFile
      formData.append("selfieFile", livenessFile);
      formData.append("livenessFile", livenessFile);

      formData.append("addressProofFile", addressProofFile);

      const res = await submitKyc(formData);

      if (res?.status) {
        setSuccess("KYC enviado com sucesso. Agora sua conta ficará em análise.");
        setDocumentFile(null);
        setLivenessFile(null);
        setAddressProofFile(null);

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

  const accountMeta = useMemo(() => getAccountStatusMeta(user, kyc), [user, kyc]);
  const StatusIcon = accountMeta.icon;

  const hasKycSubmission = Boolean(kyc?._id || kyc?.status || kyc?.submittedAt);
  const canShowKycForm =
    !hasKycSubmission || String(kyc?.status || "").toLowerCase() === "rejected";

  return (
    <div>
      <PageHeader title="Verificação de conta" subtitle="Envie documentos e acompanhe o status do KYC" />

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
            border: `1px solid ${accountMeta.border}`,
            borderRadius: 18,
            padding: isMobile ? 16 : 18,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: accountMeta.bg,
                border: `1px solid ${accountMeta.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accountMeta.color,
                flexShrink: 0,
              }}
            >
              <StatusIcon size={20} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.white,
                  marginBottom: 4,
                }}
              >
                {accountMeta.label}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.6,
                  maxWidth: 620,
                }}
              >
                {accountMeta.description}
              </div>
            </div>
          </div>

          {kycLoading ? (
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                whiteSpace: "nowrap",
              }}
            >
              Carregando...
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            style={{
              background: "rgba(255,77,79,0.10)",
              border: "1px solid rgba(255,77,79,0.22)",
              borderRadius: 14,
              padding: "12px 14px",
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
              padding: "12px 14px",
              fontSize: 13,
              color: C.green,
              lineHeight: 1.5,
            }}
          >
            {success}
          </div>
        ) : null}

        {hasKycSubmission ? (
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: isMobile ? 16 : 18,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: C.white,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FileCheck size={16} />
              Último envio de KYC
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>
                  Status
                </div>
                <div style={{ fontSize: 13, color: C.white, fontWeight: 700 }}>
                  {kyc?.status || "—"}
                </div>
              </div>

              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>
                  Documento
                </div>
                <div style={{ fontSize: 13, color: C.white, fontWeight: 700 }}>
                  {kyc?.documentNumber || "—"}
                </div>
              </div>

              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>
                  Tipo
                </div>
                <div style={{ fontSize: 13, color: C.white, fontWeight: 700 }}>
                  {String(kyc?.documentType || "").toUpperCase() || "—"}
                </div>
              </div>
            </div>

            {kyc?.rejectionReason ? (
              <div
                style={{
                  marginTop: 12,
                  background: "rgba(255,77,79,0.06)",
                  border: "1px solid rgba(255,77,79,0.16)",
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Motivo da rejeição
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.white,
                    lineHeight: 1.6,
                  }}
                >
                  {kyc.rejectionReason}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {canShowKycForm ? (
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: isMobile ? 16 : 18,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: C.white,
                marginBottom: 6,
              }}
            >
              Enviar documentos
            </div>

            <div
              style={{
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.6,
                marginBottom: 18,
              }}
            >
              Envie seus documentos com boa qualidade para acelerar a análise da equipe OrionPay.
            </div>

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

            <div style={{ marginBottom: 14 }}>
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

              <div style={{ position: "relative" }}>
                <select
                  value={kycType}
                  onChange={(e) => setKycType(e.target.value)}
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.white,
                    padding: "0 42px 0 14px",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: 14,
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option value="cpf" style={{ background: C.card, color: C.white }}>
                    CPF
                  </option>
                  <option value="cnpj" style={{ background: C.card, color: C.white }}>
                    CNPJ
                  </option>
                  <option value="other" style={{ background: C.card, color: C.white }}>
                    Outro
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  color={C.muted}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <UploadCard
                title="Documento"
                helper="JPG, PNG ou PDF. Máximo de 8MB."
                file={documentFile}
                onChange={setDocumentFile}
                isMobile={isMobile}
              />

              <UploadCard
                title="Selfie com documento"
                helper="Envie uma selfie segurando o documento na mão. JPG, PNG ou PDF. Máximo de 8MB."
                file={livenessFile}
                onChange={setLivenessFile}
                isMobile={isMobile}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <UploadCard
                title="Comprovante de endereço"
                helper="Envie um comprovante recente, de preferência emitido nos últimos 90 dias. JPG, PNG ou PDF. Máximo de 8MB."
                file={addressProofFile}
                onChange={setAddressProofFile}
                isMobile={isMobile}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Btn
                fullWidth
                onClick={handleSubmitKyc}
                disabled={kycSubmitting}
              >
                {kycSubmitting ? "Enviando documentos..." : "Enviar para análise"}
              </Btn>
            </div>
          </div>
        ) : (
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: isMobile ? 16 : 18,
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.7,
            }}
          >
            {String(kyc?.status || "").toLowerCase() === "approved" &&
            Boolean(user?.twofaEnabled ?? user?.twofa)
              ? "Sua conta já está ativa para operar."
              : ["pending", "under_review"].includes(
                  String(kyc?.status || "").toLowerCase()
                )
              ? "Seu envio atual já está em análise. Assim que houver revisão, o status será atualizado aqui."
              : "No momento não é possível reenviar documentos."}
          </div>
        )}
      </div>
    </div>
  );
}