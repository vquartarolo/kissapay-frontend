import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight, CheckCircle2, Coins, Shield, Clock,
  Zap, AlertCircle, QrCode, User, Mail, Smartphone,
  Shuffle, CreditCard, Info,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import C from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { createPayout } from "../services/crypto.service";
import { createCashoutRequest } from "../services/cashout.service";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Btn from "../components/ui/Btn";
import PageHeader from "../components/ui/PageHeader";

// ── Cripto constants ──────────────────────────────────────────────
const REDES = { USDT: ["TRC20", "ERC20", "BEP20"], BTC: ["BTC", "Lightning"], ETH: ["ERC20"] };
const RATE  = 5.1;
const FEE   = 2;

function fmtBRL(v = 0) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ── CPF mask ──────────────────────────────────────────────────────
function maskCPF(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

// ── Phone helpers (libphonenumber-js) ─────────────────────────────
// Brasil é o país padrão quando não há "+" explícito.
const DEFAULT_COUNTRY = "BR";

function phoneRawToE164(displayValue) {
  const hasPlus = displayValue.startsWith("+");
  const digits = displayValue.replace(/\D/g, "");
  if (!digits) return "";
  // sem "+": assume Brasil → prepend +55
  const e164attempt = hasPlus ? `+${digits}` : `+55${digits}`;
  try {
    const phone = parsePhoneNumberFromString(e164attempt);
    if (phone?.isValid()) return phone.number; // E.164: "+5519982117771"
  } catch (_) {}
  return e164attempt;
}

function phoneFormatDisplay(rawInput) {
  const hasPlus = rawInput.startsWith("+");
  const digits = rawInput.replace(/\D/g, "");
  if (!digits) return hasPlus ? "+" : "";

  const candidate = hasPlus ? `+${digits}` : `+55${digits}`;
  try {
    const phone = parsePhoneNumberFromString(candidate);
    if (phone) return phone.formatInternational(); // "+55 19 98211-7771"
  } catch (_) {}
  // fallback enquanto o número está incompleto
  return hasPlus ? `+${digits}` : digits;
}

function phoneValidate(displayValue) {
  const hasPlus = displayValue.startsWith("+");
  const digits = displayValue.replace(/\D/g, "");
  if (!digits) return "Informe o número de telefone.";
  const candidate = hasPlus ? `+${digits}` : `+55${digits}`;
  try {
    const phone = parsePhoneNumberFromString(candidate);
    if (phone?.isValid()) return null;
    if (phone) {
      const country = phone.country ?? DEFAULT_COUNTRY;
      return `Número inválido para o país detectado (${country}).`;
    }
  } catch (_) {}
  return "Número de telefone inválido — verifique o DDD e os dígitos.";
}

// ── PIX key type definitions ──────────────────────────────────────
// sanitize: chamado em tempo real a cada keystroke
// rawValue: valor limpo enviado ao backend (sem máscara, formato E.164 para telefone)
// validate: validação no submit
// pasteSanitize: true → intercepta onPaste e aplica sanitize antes de inserir
const PIX_KEY_TYPES = [
  {
    id: "cpf",
    label: "CPF",
    icon: User,
    placeholder: "000.000.000-00",
    hint: "11 dígitos do CPF",
    inputMode: "numeric",
    pasteSanitize: true,
    sanitize: (v) => maskCPF(v),
    rawValue: (v) => v.replace(/\D/g, ""),
    validate: (v) =>
      v.replace(/\D/g, "").length === 11
        ? null
        : "CPF deve ter 11 dígitos",
  },
  {
    id: "email",
    label: "E-mail",
    icon: Mail,
    placeholder: "seu@email.com",
    hint: "E-mail cadastrado no banco",
    inputMode: "email",
    maxLength: 254,
    pasteSanitize: true,
    // remove quebras de linha/tab, limita 254 chars, mantém case original para exibição
    sanitize: (v) => v.replace(/[\r\n\t]/g, "").slice(0, 254),
    // normaliza para lowercase no envio ao backend
    rawValue: (v) => v.replace(/[\r\n\t]/g, "").trim().toLowerCase().slice(0, 254),
    validate: (v) => {
      const clean = v.replace(/[\r\n\t]/g, "").trim().toLowerCase();
      if (!clean) return "Informe o e-mail.";
      if (clean.length > 254) return "E-mail muito longo — máximo 254 caracteres.";
      if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(clean))
        return "E-mail inválido — verifique o formato.";
      return null;
    },
  },
  {
    id: "phone",
    label: "Telefone",
    icon: Smartphone,
    placeholder: "(11) 99999-9999",
    hint: "Brasil por padrão sem +",
    inputMode: "tel",
    pasteSanitize: true,
    sanitize: phoneFormatDisplay,
    rawValue: phoneRawToE164,
    validate: phoneValidate,
  },
  {
    id: "random",
    label: "Aleatória",
    icon: Shuffle,
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    hint: "Chave PIX aleatória do banco",
    inputMode: "text",
    pasteSanitize: false,
    sanitize: (v) => v,
    rawValue: (v) => v.trim(),
    validate: (v) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim())
        ? null
        : "UUID inválido — copie a chave exatamente como gerada pelo banco",
  },
];

// ── Info badge ────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color = C.muted }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────
function SuccessScreen({ details, onNew }) {
  return (
    <div>
      <div style={{ textAlign: "center", paddingTop: 8, maxWidth: 480 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(45,134,89,0.10)",
          border: `1px solid rgba(45,134,89,0.25)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <CheckCircle2 size={32} color={C.green} strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.white, marginBottom: 6, letterSpacing: "-0.025em" }}>
          Saque solicitado
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
          Solicitação criada com sucesso. O pagamento será processado após aprovação do administrador.
        </div>

        <Card style={{ textAlign: "left", marginBottom: 20 }}>
          {details.map((r, i) => (
            <div key={r.k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: i < details.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ fontSize: 13, color: C.muted }}>{r.k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{r.v}</span>
            </div>
          ))}
        </Card>
        <Btn fullWidth onClick={onNew} variant="outline">Novo saque</Btn>
      </div>
    </div>
  );
}

// ── PIX key type selector ─────────────────────────────────────────
function PixKeyTypeSelector({ selected, onSelect }) {
  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: C.muted,
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
      }}>
        Tipo de chave
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {PIX_KEY_TYPES.map((type) => {
          const Icon = type.icon;
          const active = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s ease",
                border: `1.5px solid ${active ? C.green : C.border}`,
                background: active ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.02)",
                outline: "none",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "rgba(45,134,89,0.20)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? "rgba(45,134,89,0.35)" : C.border}`,
                transition: "all 0.15s ease",
              }}>
                <Icon size={15} color={active ? C.green : C.muted} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: active ? C.white : C.muted,
                letterSpacing: "0.02em", transition: "color 0.15s ease",
              }}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── PIX key input (sanitiza em tempo real + onPaste blindado) ────
function PixKeyInput({ keyType, value, onChange, error }) {
  const def = PIX_KEY_TYPES.find((t) => t.id === keyType) || PIX_KEY_TYPES[0];

  function handleChange(e) {
    const sanitized = def.sanitize ? def.sanitize(e.target.value) : e.target.value;
    onChange(sanitized);
  }

  // Intercepta colar para tipos que precisam de sanitização antes de inserir
  function handlePaste(e) {
    if (!def.pasteSanitize) return;
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text") ?? "";
    const sanitized = def.sanitize ? def.sanitize(pasted) : pasted;
    onChange(sanitized);
  }

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
          Chave PIX — {def.label}
        </span>
        <span style={{ fontSize: 11, color: C.dim }}>{def.hint}</span>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: C.inputDeep,
        border: `1.5px solid ${error ? "rgba(229,72,77,0.5)" : value ? "rgba(45,134,89,0.35)" : C.border}`,
        borderRadius: 10, padding: "12px 14px",
        transition: "border-color 0.15s ease",
      }}>
        <def.icon size={15} color={error ? C.error : value ? C.green : C.muted} />
        <input
          type={def.id === "email" ? "email" : "text"}
          inputMode={def.inputMode ?? "text"}
          maxLength={def.maxLength}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={def.placeholder}
          autoComplete="off"
          spellCheck={false}
          style={{
            background: "none", border: "none", outline: "none",
            color: C.white, fontSize: 14, fontWeight: 500,
            width: "100%", fontFamily: "inherit",
          }}
        />
      </div>
      {error && (
        <div style={{ fontSize: 11, color: C.error, marginTop: 5, display: "flex", gap: 5, alignItems: "center" }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

// ── PIX SAQUE ────────────────────────────────────────────────────
function SacarPix({ isMobile }) {
  const { wallet, refreshWallet } = useAuth();
  const available = wallet?.balance?.available ?? 0;

  const [valor, setValor] = useState("");
  const [adjusted, setAdjusted] = useState(false);
  const [keyType, setKeyType] = useState("cpf");
  const [pixKey, setPixKey] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyError, setKeyError] = useState("");

  const valorNum = parseFloat(valor) || 0;
  const typeDef = PIX_KEY_TYPES.find((t) => t.id === keyType) || PIX_KEY_TYPES[0];

  // ── valor: sanitiza e aplica clamp automático ─────────────────
  function handleValorChange(raw) {
    // aceita apenas dígitos e um ponto decimal
    let clean = raw.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) clean = parts[0] + "." + parts.slice(1).join("");
    if (parts[1]?.length > 2) clean = parts[0] + "." + parts[1].slice(0, 2);

    const num = parseFloat(clean) || 0;

    if (num > available && available > 0) {
      setValor(String(available));
      setAdjusted(true);
    } else {
      setValor(clean);
      setAdjusted(false);
    }
  }

  function setQuickAmount(amount) {
    const num = Math.min(Number(amount), available);
    setValor(num > 0 ? String(num) : "");
    setAdjusted(num < Number(amount) && available > 0);
  }

  // ── key validation ────────────────────────────────────────────
  function validateKey() {
    if (!pixKey.trim()) {
      setKeyError("Informe a chave PIX.");
      return false;
    }
    const msg = typeDef.validate(pixKey);
    if (msg) { setKeyError(msg); return false; }
    setKeyError("");
    return true;
  }

  const canSubmit = valorNum > 0 && valorNum <= available && pixKey.trim().length >= 3 && !loading;

  function handleKeyTypeChange(type) {
    setKeyType(type);
    setPixKey("");
    setKeyError("");
  }

  // ── códigos de erro → campo de destino ───────────────────────
  // Campo da chave: erros de validação do tipo de chave
  const KEY_ERROR_CODES = new Set([
    "INVALID_CPF", "INVALID_EMAIL", "INVALID_PHONE", "INVALID_PIX_KEY",
  ]);
  // Campo do valor: erros relacionados ao montante
  const AMOUNT_ERROR_CODES = new Set([
    "INSUFFICIENT_BALANCE", "INVALID_AMOUNT",
  ]);

  // Mensagens amigáveis para códigos conhecidos (fallback para message do backend)
  const FRIENDLY_MESSAGES = {
    RATE_LIMIT:           "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
    COOLDOWN:             null, // backend já envia com tempo restante
    INTERNAL_ERROR:       "Ocorreu um erro ao processar o saque. Tente novamente.",
    INSUFFICIENT_BALANCE: "Saldo insuficiente para realizar o saque.",
    INVALID_AMOUNT:       "Informe um valor de saque válido.",
    AUTH_ERROR:           "Sua sessão expirou. Faça login novamente.",
  };

  // ── submit ────────────────────────────────────────────────────
  async function handleSacar() {
    setError("");
    if (!validateKey()) return;
    if (valorNum <= 0 || valorNum > available) return;

    // envia chave sem máscara (rawValue tira pontuação do CPF etc)
    const rawPixKey = typeDef.rawValue ? typeDef.rawValue(pixKey) : pixKey.trim();

    setLoading(true);
    try {
      const response = await createCashoutRequest({
        amount: valorNum,
        pixKey: rawPixKey,
        pixKeyType: keyType,
      });
      await refreshWallet();
      setDone(true);
    } catch (err) {
      const data = err?.response?.data ?? {};
      const code = data?.code ?? "";
      // message vem do backend já amigável; FRIENDLY_MESSAGES sobrescreve se mapeado
      const message = FRIENDLY_MESSAGES[code] !== undefined
        ? (FRIENDLY_MESSAGES[code] ?? data?.message ?? "Erro ao processar saque PIX.")
        : (data?.message ?? data?.msg ?? "Erro ao processar saque PIX.");

      if (KEY_ERROR_CODES.has(code)) {
        setKeyError(message);
      } else if (AMOUNT_ERROR_CODES.has(code)) {
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <SuccessScreen
      onNew={() => { setDone(false); setValor(""); setPixKey(""); setKeyError(""); setAdjusted(false); }}
      details={[
        { k: "Método",  v: "PIX" },
        { k: "Tipo",    v: typeDef.label },
        { k: "Chave",   v: pixKey },
        { k: "Valor",   v: `R$ ${fmtBRL(valorNum)}` },
        { k: "Status",  v: "Aguardando aprovação admin" },
      ]}
    />
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "start" }}>

      {/* ── form ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* valor */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Dados do saque
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Valor em reais</div>
            <div style={{
              display: "flex", alignItems: "center",
              background: C.inputDeep,
              border: `1.5px solid ${valorNum > 0 && valorNum <= available ? "rgba(45,134,89,0.35)" : C.border}`,
              borderRadius: 10, padding: "12px 14px",
              transition: "border-color 0.15s",
            }}>
              <span style={{ color: C.muted, fontSize: 14, marginRight: 8, fontWeight: 600 }}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={e => handleValorChange(e.target.value)}
                placeholder="0,00"
                style={{
                  background: "none", border: "none", color: C.white,
                  fontSize: 22, fontWeight: 800, outline: "none",
                  width: "100%", fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => setQuickAmount(available)}
                style={{
                  background: "none", border: "none", color: C.green,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Máx
              </button>
            </div>

            {/* aviso de ajuste automático (não é erro) */}
            {adjusted && (
              <div style={{
                fontSize: 11, color: C.green, marginTop: 5,
                display: "flex", gap: 5, alignItems: "center",
              }}>
                <Info size={11} />
                Valor ajustado para seu saldo disponível (R$ {fmtBRL(available)})
              </div>
            )}
          </div>

          {/* quick amounts */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[100, 500, 1000, 5000].map(v => {
              const clamped = Math.min(v, available);
              const active = valorNum === clamped && clamped > 0;
              return (
                <button
                  key={v}
                  onClick={() => setQuickAmount(v)}
                  disabled={available <= 0}
                  style={{
                    padding: "5px 10px", borderRadius: 7, cursor: available > 0 ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    background: active ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? C.green : C.border}`,
                    color: active ? C.green : C.muted,
                    fontSize: 12, fontWeight: 600,
                    opacity: available < v ? 0.45 : 1,
                  }}
                >
                  R$ {v.toLocaleString("pt-BR")}
                </button>
              );
            })}
          </div>
        </Card>

        {/* key type selector + input */}
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PixKeyTypeSelector selected={keyType} onSelect={handleKeyTypeChange} />
            <PixKeyInput
              keyType={keyType}
              value={pixKey}
              onChange={(v) => { setPixKey(v); setKeyError(""); }}
              error={keyError}
            />
          </div>
        </Card>

        {/* erro global (somente backend) */}
        {error && (
          <div style={{
            background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)",
            borderRadius: 9, padding: "10px 14px", fontSize: 13, color: C.error,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <Btn
          fullWidth
          onClick={handleSacar}
          disabled={!canSubmit}
          icon={<ArrowUpRight size={16} />}
        >
          {loading ? "Processando..." : "Solicitar saque via PIX"}
        </Btn>
      </div>

      {/* ── info panel ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Informações
          </div>
          <InfoRow icon={Clock}      label="Tempo estimado"  value="Após aprovação admin" />
          <InfoRow icon={Zap}        label="Taxa"             value="Grátis"  color={C.green} />
          <InfoRow icon={Shield}     label="Limite diário"    value="R$ 50.000" />
          <InfoRow icon={QrCode}     label="Método"           value="PIX Transferência" />
          <div style={{ borderBottom: "none" }}>
            <InfoRow icon={CreditCard} label="Aprovação"     value="Manual (admin)" color={C.warn} />
          </div>
        </Card>

        <Card variant="subtle">
          <div style={{ display: "flex", gap: 8 }}>
            <Shield size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Saques PIX são processados pela OrionPay após revisão administrativa e creditados na conta vinculada à chave informada.
            </span>
          </div>
        </Card>

        {/* resumo vivo — exibe valores limpos */}
        {(valorNum > 0 || pixKey) && (
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Resumo
            </div>
            {valorNum > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.muted }}>Valor</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>R$ {fmtBRL(valorNum)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: pixKey ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 12, color: C.muted }}>Tipo</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{typeDef.label}</span>
            </div>
            {pixKey && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 12, color: C.muted }}>Chave</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.white, maxWidth: "60%", wordBreak: "break-all", textAlign: "right" }}>
                  {pixKey.length > 24 ? pixKey.slice(0, 12) + "…" + pixKey.slice(-8) : pixKey}
                </span>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// ── CRIPTO SAQUE ─────────────────────────────────────────────────
function SacarCripto({ isMobile }) {
  const { wallet, refreshWallet } = useAuth();
  const available = wallet?.balance?.available ?? 0;

  const [moeda,    setMoeda]      = useState("USDT");
  const [rede,     setRede]       = useState("TRC20");
  const [valor,    setValor]      = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [done,     setDone]       = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  const valorNum  = parseFloat(valor) || 0;
  const usdt      = valorNum ? (valorNum / RATE).toFixed(2) : "0";
  const final_amt = valorNum ? (parseFloat(usdt) - FEE).toFixed(2) : "0";
  const invalid   = !valor || !walletAddr || walletAddr.length < 10 || valorNum <= 0 || valorNum > available;

  async function handleSacar() {
    setError("");
    setLoading(true);
    try {
      await createPayout({
        amount: parseFloat(final_amt), currency: moeda, network: rede,
        address: walletAddr, reference: `saque-${Date.now()}`,
      });
      await refreshWallet();
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao processar saque.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <SuccessScreen
      onNew={() => { setDone(false); setWalletAddr(""); setValor(""); }}
      details={[
        { k: "Moeda",       v: moeda },
        { k: "Rede",        v: rede },
        { k: "Valor BRL",   v: `R$ ${fmtBRL(valorNum)}` },
        { k: "Você recebe", v: `${final_amt} ${moeda}` },
        { k: "Carteira",    v: walletAddr.slice(0, 14) + "..." },
      ]}
    />
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "start" }}>
      <div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Configurar saque
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <Select label="Moeda" value={moeda}
                onChange={e => { setMoeda(e.target.value); setRede((REDES[e.target.value] || ["TRC20"])[0]); }}
                options={[
                  { value: "USDT", label: "USDT" },
                  { value: "BTC",  label: "Bitcoin" },
                  { value: "ETH",  label: "Ethereum" },
                ]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select label="Rede" value={rede} onChange={e => setRede(e.target.value)}
                options={(REDES[moeda] || ["TRC20"]).map(r => ({ value: r, label: r }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Valor em reais</div>
            <div style={{
              display: "flex", alignItems: "center",
              background: C.inputDeep, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px",
            }}>
              <span style={{ color: C.muted, fontSize: 14, marginRight: 8, fontWeight: 600 }}>R$</span>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)}
                style={{ background: "none", border: "none", color: C.white, fontSize: 22, fontWeight: 800, outline: "none", width: "100%", fontFamily: "inherit" }} />
              <button onClick={() => setValor(String(available))}
                style={{ background: "none", border: "none", color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                Max
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["500", "1000", "2000", "5000"].map(v => (
              <button key={v} onClick={() => setValor(v)} style={{
                padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
                background: valor === v ? "rgba(45,134,89,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${valor === v ? C.green : C.border}`,
                color: valor === v ? C.green : C.muted,
                fontSize: 12, fontWeight: 600,
              }}>R$ {v}</button>
            ))}
          </div>
        </Card>

        <Input label="Endereço da carteira" placeholder="Endereço da rede selecionada..." value={walletAddr} onChange={e => setWalletAddr(e.target.value)} />

        {walletAddr.length > 10 && (
          <div style={{
            background: "rgba(45,134,89,0.06)", border: "1px solid rgba(45,134,89,0.18)",
            borderRadius: 9, padding: "9px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center",
          }}>
            <Shield size={13} color={C.green} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.muted }}>Endereço validado na rede {rede}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)",
            borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.error,
            display: "flex", gap: 8,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <Btn fullWidth onClick={handleSacar} disabled={invalid || loading} icon={<ArrowUpRight size={16} />}>
          {loading ? "Processando..." : "Sacar agora"}
        </Btn>

        {valorNum > available && valor && (
          <div style={{ fontSize: 12, color: C.error, marginTop: 8, textAlign: "center" }}>
            Saldo insuficiente
          </div>
        )}
      </div>

      <div>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Resumo da conversão
          </div>
          <InfoRow icon={ArrowUpRight} label="Você envia"  value={valorNum > 0 ? `R$ ${fmtBRL(valorNum)}` : "—"} />
          <InfoRow icon={Coins}        label="Taxa de rede" value={`${FEE} ${moeda}`} color={C.warn} />
          <div style={{ padding: "12px 0 0" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Você recebe (aprox.)</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: valorNum > 0 ? C.white : C.dim, letterSpacing: "-0.025em" }}>
              {valorNum > 0 ? final_amt : "0,00"} <span style={{ fontSize: 14, color: C.muted }}>{moeda}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Informações
          </div>
          <InfoRow icon={Clock}  label="Tempo estimado"  value="Até 30 min" />
          <InfoRow icon={Zap}    label="Cotação hoje"     value={`R$ ${RATE.toFixed(2)} / USDT`} color={C.gold} />
          <InfoRow icon={Shield} label="Rede selecionada" value={rede} />
          <div style={{ borderBottom: "none" }}>
            <InfoRow icon={Coins} label="Taxa fixa" value={`${FEE} ${moeda}`} color={C.warn} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main Sacar page ───────────────────────────────────────────────
export default function SacarPage({ isMobile }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const isPix     = location.pathname === "/saque/pix";

  const { wallet } = useAuth();
  const available  = wallet?.balance?.available ?? 0;

  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, rgba(45,134,89,0.07) 0%, rgba(0,0,0,0) 60%)",
        border: `1px solid rgba(45,134,89,0.15)`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Saldo disponível
          </div>
          <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: C.white, letterSpacing: "-0.03em" }}>
            R$ {fmtBRL(available)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {[
            { label: "PIX",    path: "/saque/pix",   icon: QrCode },
            { label: "Cripto", path: "/saque/cripto", icon: Coins  },
          ].map(t => {
            const active = isPix ? t.path === "/saque/pix" : t.path === "/saque/cripto";
            return (
              <button key={t.label} onClick={() => navigate(t.path)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                border: `1px solid ${active ? C.green : C.border}`,
                background: active ? "rgba(45,134,89,0.15)" : "rgba(255,255,255,0.03)",
                color: active ? C.white : C.muted,
                transition: "all 0.15s",
              }}>
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <PageHeader
        title={isPix ? "Saque via PIX" : "Saque em Cripto"}
        subtitle={isPix
          ? "Transferência para qualquer chave PIX após aprovação administrativa"
          : "Converta saldo em USDT, BTC ou ETH"}
      />

      {isPix
        ? <SacarPix isMobile={isMobile} />
        : <SacarCripto isMobile={isMobile} />
      }
    </div>
  );
}
