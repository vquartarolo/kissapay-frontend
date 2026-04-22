import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Shield,
  Search,
  RefreshCw,
  UserCog,
  CircleDot,
  BadgeCheck,
  Percent,
  WalletCards,
  FileCheck2,
  ScrollText,
  Ban,
  ShieldCheck,
  ChevronRight,
  X,
  Landmark,
} from "lucide-react";
import C from "../../constants/colors";
import Card from "../../components/ui/Card";
import Btn from "../../components/ui/Btn";
import PageHeader from "../../components/ui/PageHeader";
import ModalPortal from "../../components/ModalPortal";
import {
  getAdminAccounts,
  getAdminAccountById,
  updateAdminAccountStatus,
  updateAdminAccountSplit,
  getAdminAccountSplit,
  getAdminAccountTransactions,
  getAdminAccountKyc,
  getAdminProviders,
  updateAdminAccountRouting,
} from "../../services/admin.service";

function fmtBRL(v = 0) {
  return Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserStatusPreset(status = "active") {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "blocked") {
    return { label: "Bloqueado", color: C.error, bg: "rgba(229,72,77,0.12)" };
  }
  if (normalized === "inactive") {
    return { label: "Inativo", color: C.gold, bg: "rgba(129,182,28,0.10)" };
  }
  return { label: "Ativo", color: C.green, bg: "rgba(45,134,89,0.12)" };
}

function getOnlinePreset(status = "offline") {
  return status === "online"
    ? { label: "Online", color: C.green, bg: "rgba(45,134,89,0.12)" }
    : { label: "Offline", color: C.muted, bg: "rgba(255,255,255,0.06)" };
}

function getAccountStatusLabel(value = "") {
  const map = {
    email_pending: "Email pendente",
    basic_user: "Usuário básico",
    kyc_pending: "KYC pendente",
    kyc_under_review: "KYC em análise",
    kyc_approved: "KYC aprovado",
    kyc_rejected: "KYC rejeitado",
    seller_active: "Seller ativo",
    suspended: "Suspenso",
  };

  return map[String(value || "")] || value || "—";
}

function getModalTheme(isDark) {
  return {
    overlayBg: isDark ? "rgba(0,0,0,0.60)" : "rgba(15,23,42,0.22)",
    modalBg: isDark ? "#111A23" : "#ffffff",
    modalBgSoft: isDark ? "#16202C" : "#f8fafc",
    headerBg: isDark ? "#111A23" : "#ffffff",
    contentBg: isDark ? "#0D1520" : "#f1f5f9",
    cardBg: isDark ? "#1B2736" : "#ffffff",
    inputBg: isDark ? "#0D1520" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    title: isDark ? "#FFFFFF" : "#0f172a",
    text: isDark ? "#5A6A7E" : "#5c6b82",
    muted: isDark ? "#5A6A7E" : "#7b8ba5",
    shadow: isDark
      ? "0 24px 60px rgba(0,0,0,0.50), 0 4px 16px rgba(0,0,0,0.30)"
      : "0 24px 60px rgba(15,23,42,0.16)",
    closeBg: isDark ? "#1B2736" : "#f8fafc",
    listRowBg: isDark ? "#16202C" : "#ffffff",
  };
}

function EmptyState({ text, loading, color }) {
  return (
    <div style={{ padding: "34px 18px", textAlign: "center" }}>
      {loading && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            margin: "0 auto 12px",
            border: "2px solid rgba(148,163,184,0.25)",
            borderTopColor: color || C.green,
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      <div style={{ fontSize: 13, color: color || C.muted }}>{text}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatusPill({ color, bg, children, borderColor }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 11px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
        border: `1px solid ${borderColor || "transparent"}`,
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({ icon, title, value, helper, accent = C.green }) {
  return (
    <Card style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: `${accent}14`,
            border: `1px solid ${accent}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 900,
          color: C.white,
          letterSpacing: "-0.03em",
          marginBottom: 7,
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 12, color: C.dim }}>{helper}</div>
    </Card>
  );
}

function SearchField({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: C.inputDeep,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "10px 12px",
        minWidth: 240,
      }}
    >
      <Search size={14} color={C.muted} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar nome, email, telefone ou documento..."
        style={{
          background: "none",
          border: "none",
          outline: "none",
          width: "100%",
          color: C.white,
          fontSize: 13,
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

const selectStyle = {
  background: C.inputDeep,
  border: `1px solid ${C.border}`,
  color: C.white,
  borderRadius: 12,
  padding: "11px 12px",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  cursor: "pointer",
  width: "100%",
};

const inputStyle = {
  width: "100%",
  background: C.inputDeep,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: "11px 12px",
  color: C.white,
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

function SmallInfo({ label, value, theme }) {
  return (
    <div
      style={{
        background: theme.modalBgSoft,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: "13px 14px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: theme.muted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 800,
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: theme.title,
          fontWeight: 800,
          wordBreak: "break-word",
          lineHeight: 1.45,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children, theme }) {
  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderTop: "1px solid rgba(45,134,89,0.22)",
        borderRadius: 18,
        padding: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        {icon}
        <div style={{ fontSize: 14, fontWeight: 800, color: theme.title, letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function TransactionDetailModal({ tx, onClose, isMobile, theme }) {
  if (!tx) return null;

  return (
    <ModalPortal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10001,
          background: theme.overlayBg,
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? 12 : 18,
          animation: "orionFadeIn 0.16s ease-out",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 700,
            maxHeight: "88vh",
            overflowY: "auto",
            overflowX: "hidden",
            background: theme.modalBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 22,
            boxShadow: theme.shadow,
            animation: "orionScaleIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: theme.headerBg,
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: theme.title, marginBottom: 4 }}>
                Detalhes da transação
              </div>
              <div style={{ fontSize: 12, color: theme.text }}>
                Operação, método, status, adquirente e valores.
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                border: `1px solid ${theme.border}`,
                width: 40,
                height: 40,
                borderRadius: 12,
                background: theme.closeBg,
                color: theme.muted,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 20, display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 10,
              }}
            >
              <SmallInfo label="ID externo" value={tx.externalReference || tx._id} theme={theme} />
              <SmallInfo label="Status" value={tx.status} theme={theme} />
              <SmallInfo label="Método" value={tx.method} theme={theme} />
              <SmallInfo label="Adquirente" value={tx.provider} theme={theme} />
              <SmallInfo label="Valor bruto" value={`R$ ${fmtBRL(tx.amount)}`} theme={theme} />
              <SmallInfo label="Taxa" value={`R$ ${fmtBRL(tx.fee)}`} theme={theme} />
              <SmallInfo
                label="Valor líquido"
                value={`R$ ${fmtBRL(tx.netAmount ?? tx.amount - (tx.fee || 0))}`}
                theme={theme}
              />
              <SmallInfo label="Data" value={fmtDate(tx.createdAt)} theme={theme} />
            </div>

            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "14px 15px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: theme.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                  marginBottom: 7,
                }}
              >
                Descrição
              </div>
              <div style={{ fontSize: 13, color: theme.title, fontWeight: 700, lineHeight: 1.6 }}>
                {tx.description || "Sem descrição"}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes orionFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes orionScaleIn {
            from { opacity: 0; transform: translateY(8px) scale(0.99); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </ModalPortal>
  );
}

export default function AdminManagePage({ isMobile }) {
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingSplit, setSavingSplit] = useState(false);
  const [savingRouting, setSavingRouting] = useState(false);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 18, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [kyc, setKyc] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [feedback, setFeedback] = useState("");

  const modalRef = useRef(null);

  const [splitForm, setSplitForm] = useState({
    pixInFixed: "",
    pixInPercentage: "",
    pixOutFixed: "",
    pixOutPercentage: "",
    cryptoInFixed: "",
    cryptoInPercentage: "",
    cryptoOutFixed: "",
    cryptoOutPercentage: "",
    retentionDays: "",
    retentionPercentage: "",
  });

  const [routingForm, setRoutingForm] = useState({
    chargeProvider: "",
    cashoutProvider: "",
  });

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const modalTheme = getModalTheme(isDark);

  function closePanel() {
    setSelectedId("");
    setSelected(null);
    setTransactions([]);
    setKyc(null);
    setSelectedTransaction(null);
    setFeedback("");
  }

  async function loadProviders() {
    try {
      const data = await getAdminProviders();
      const items = Array.isArray(data?.items) ? data.items : [];
      setProviders(items.length > 0 ? items : [{ value: "", label: "Padrão do sistema" }]);
    } catch (err) {
      console.error("Erro ao carregar adquirentes:", err);
      setProviders([{ value: "", label: "Padrão do sistema" }]);
    }
  }

  async function loadAccounts(page = 1, showLoading = true) {
    try {
      if (showLoading) setLoading(true);

      const data = await getAdminAccounts({
        search,
        status: statusFilter,
        page,
        limit: 18,
      });

      const items = Array.isArray(data?.items) ? data.items : [];
      setRows(items);
      setPagination(data?.pagination || { page: 1, limit: 18, total: 0, totalPages: 1 });

      if (selectedId) {
        const exists = items.some((item) => item.id === selectedId);
        if (!exists) closePanel();
      }
    } catch (err) {
      console.error("Erro ao carregar contas:", err);
      setRows([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function openAccount(id) {
    try {
      setDetailsLoading(true);
      setFeedback("");
      setSelectedTransaction(null);
      setSelectedId(id);

      const [detailRes, splitRes, txRes, kycRes] = await Promise.all([
        getAdminAccountById(id),
        getAdminAccountSplit(id),
        getAdminAccountTransactions(id, { page: 1, limit: 12 }),
        getAdminAccountKyc(id),
      ]);

      const detail = detailRes?.account || null;

      setSelected({
        ...detail,
        wallet: detailRes?.wallet || null,
        onlineStatus: detailRes?.onlineStatus || "offline",
      });

      const split = splitRes?.split || detail?.split || null;
      const retention = splitRes?.retention || detail?.retention || null;
      setSplitForm({
        pixInFixed:          String(split?.cashIn?.pix?.fixed ?? 0),
        pixInPercentage:     String(split?.cashIn?.pix?.percentage ?? 0),
        pixOutFixed:         String(split?.cashOut?.pix?.fixed ?? 0),
        pixOutPercentage:    String(split?.cashOut?.pix?.percentage ?? 0),
        cryptoInFixed:       String(split?.cashIn?.crypto?.fixed ?? 0),
        cryptoInPercentage:  String(split?.cashIn?.crypto?.percentage ?? 0),
        cryptoOutFixed:      String(split?.cashOut?.crypto?.fixed ?? 0),
        cryptoOutPercentage: String(split?.cashOut?.crypto?.percentage ?? 0),
        retentionDays:       String(retention?.days ?? 0),
        retentionPercentage: String(retention?.percentage ?? 0),
      });

      const routing = splitRes?.routing || detail?.routing || {};
      setRoutingForm({
        chargeProvider:  routing.chargeProvider || "",
        cashoutProvider: routing.cashoutProvider || "",
      });

      setTransactions(Array.isArray(txRes?.items) ? txRes.items : []);
      setKyc(kycRes?.kyc || detailRes?.latestKyc || null);
    } catch (err) {
      console.error("Erro ao abrir conta:", err);
      setFeedback("Erro ao abrir os detalhes da conta.");
      closePanel();
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadAccounts(1, true);
    }, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return undefined;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (selectedTransaction) {
          setSelectedTransaction(null);
          return;
        }
        closePanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, selectedTransaction]);

  useEffect(() => {
    if (!selectedId || !modalRef.current) return undefined;

    const modalNode = modalRef.current;
    const selectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const focusables = Array.from(modalNode.querySelectorAll(selectors));
    if (focusables.length > 0) {
      setTimeout(() => {
        focusables[0]?.focus?.();
      }, 20);
    }

    function trapFocus(e) {
      if (e.key !== "Tab") return;

      const activeFocusables = Array.from(modalNode.querySelectorAll(selectors));
      if (activeFocusables.length === 0) return;

      const first = activeFocusables[0];
      const last = activeFocusables[activeFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    modalNode.addEventListener("keydown", trapFocus);
    return () => {
      modalNode.removeEventListener("keydown", trapFocus);
    };
  }, [selectedId, detailsLoading, selectedTransaction]);

  async function handleStatusChange(nextStatus) {
    if (!selectedId) return;

    try {
      setSavingStatus(true);
      setFeedback("");

      const res = await updateAdminAccountStatus(selectedId, nextStatus);
      setFeedback(res?.msg || "Status atualizado com sucesso.");

      await loadAccounts(pagination.page || 1, false);
      await openAccount(selectedId);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao atualizar o status da conta.");
    } finally {
      setSavingStatus(false);
    }
  }

  function validateSplitForm() {
    const pctKeys = ["pixInPercentage", "pixOutPercentage", "cryptoInPercentage", "cryptoOutPercentage", "retentionPercentage"];
    for (const key of pctKeys) {
      const v = Number(splitForm[key]);
      if (isNaN(v) || v < 0 || v > 100) return "Percentuais devem ser entre 0 e 100.";
    }
    const fixedKeys = ["pixInFixed", "pixOutFixed", "cryptoInFixed", "cryptoOutFixed"];
    for (const key of fixedKeys) {
      const v = Number(splitForm[key]);
      if (isNaN(v) || v < 0) return "Taxas fixas não podem ser negativas.";
    }
    if (Number(splitForm.retentionDays) < 0 || isNaN(Number(splitForm.retentionDays))) {
      return "Dias de retenção não podem ser negativos.";
    }
    return null;
  }

  async function handleSaveSplit() {
    if (!selectedId) return;

    const validationError = validateSplitForm();
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    try {
      setSavingSplit(true);
      setFeedback("");

      await updateAdminAccountSplit(selectedId, {
        cashIn: {
          pix:    { fixed: Number(splitForm.pixInFixed || 0),    percentage: Number(splitForm.pixInPercentage || 0) },
          crypto: { fixed: Number(splitForm.cryptoInFixed || 0), percentage: Number(splitForm.cryptoInPercentage || 0) },
        },
        cashOut: {
          pix:    { fixed: Number(splitForm.pixOutFixed || 0),    percentage: Number(splitForm.pixOutPercentage || 0) },
          crypto: { fixed: Number(splitForm.cryptoOutFixed || 0), percentage: Number(splitForm.cryptoOutPercentage || 0) },
        },
        retention: {
          days:       Number(splitForm.retentionDays || 0),
          percentage: Number(splitForm.retentionPercentage || 0),
        },
      });

      setFeedback("Taxas, saídas e retenção atualizadas com sucesso.");

      await loadAccounts(pagination.page || 1, false);
      await openAccount(selectedId);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao salvar as taxas.");
    } finally {
      setSavingSplit(false);
    }
  }

  async function handleSaveRouting() {
    if (!selectedId) return;

    try {
      setSavingRouting(true);
      setFeedback("");

      const res = await updateAdminAccountRouting(selectedId, routingForm);
      setFeedback(res?.msg || "Adquirentes atualizados com sucesso.");

      await openAccount(selectedId);
    } catch (err) {
      setFeedback(err?.response?.data?.msg || "Erro ao salvar os adquirentes.");
    } finally {
      setSavingRouting(false);
    }
  }

  const totalAvailable = useMemo(
    () => rows.reduce((acc, item) => acc + Number(item?.balance || 0), 0),
    [rows]
  );

  const totalVolume = useMemo(
    () => rows.reduce((acc, item) => acc + Number(item?.totalVolume || 0), 0),
    [rows]
  );

  const blockedCount = useMemo(
    () => rows.filter((item) => String(item?.status) === "blocked").length,
    [rows]
  );

  const onlineCount = useMemo(
    () => rows.filter((item) => String(item?.onlineStatus) === "online").length,
    [rows]
  );

  const selectedStatusPreset = getUserStatusPreset(selected?.status);
  const selectedOnlinePreset = getOnlinePreset(selected?.onlineStatus);

  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 12px",
          borderRadius: 999,
          marginBottom: 14,
          border: "1px solid rgba(45,134,89,0.20)",
          background: "rgba(45,134,89,0.07)",
          color: C.green,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <Shield size={12} />
        Área Administrativa
      </div>

      <PageHeader
        title="Gerenciar"
        subtitle="Central premium de contas com bloqueio, taxa PIX/Cripto, adquirentes, documentos e transações."
        right={
          <Btn
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={() => loadAccounts(pagination.page || 1, true)}
          >
            Atualizar
          </Btn>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <MetricCard
          icon={<UserCog size={15} />}
          title="Contas listadas"
          value={String(rows.length)}
          helper="Total na página atual"
          accent={C.green}
        />
        <MetricCard
          icon={<CircleDot size={15} />}
          title="Online"
          value={String(onlineCount)}
          helper="Atividade recente detectada"
          accent={C.green}
        />
        <MetricCard
          icon={<Ban size={15} />}
          title="Bloqueadas"
          value={String(blockedCount)}
          helper="Contas com status bloqueado"
          accent={C.error}
        />
        <MetricCard
          icon={<WalletCards size={15} />}
          title="Saldo em conta"
          value={`R$ ${fmtBRL(totalAvailable)}`}
          helper="Soma dos saldos na página"
          accent={C.gold}
        />
        <MetricCard
          icon={<Percent size={15} />}
          title="Volume processado"
          value={`R$ ${fmtBRL(totalVolume)}`}
          helper="Transações aprovadas"
          accent={C.green}
        />
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.55,
            color: String(feedback).toLowerCase().includes("erro") ? C.error : C.green,
            background: String(feedback).toLowerCase().includes("erro")
              ? "rgba(229,72,77,0.08)"
              : "rgba(45,134,89,0.08)",
            border: `1px solid ${
              String(feedback).toLowerCase().includes("erro")
                ? "rgba(229,72,77,0.20)"
                : "rgba(45,134,89,0.20)"
            }`,
          }}
        >
          {feedback}
        </div>
      ) : null}

      <Card style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
              Lista de contas
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Clique em uma conta para abrir o painel privativo central com fundo desfocado.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SearchField value={search} onChange={setSearch} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...selectStyle, width: 140 }}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="blocked">Bloqueados</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {!isMobile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px 150px",
              gap: 12,
              padding: "10px 18px 10px 16px",
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
              fontSize: 10,
              fontWeight: 800,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            <span>Conta</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>Saldo</span>
            <span>Status</span>
            <span>Conta operacional</span>
          </div>
        )}

        {loading ? (
          <EmptyState text="Carregando contas..." loading />
        ) : rows.length === 0 ? (
          <EmptyState text="Nenhuma conta encontrada." />
        ) : (
          rows.map((item, index) => {
            const userStatus = getUserStatusPreset(item.status);
            const onlineStatus = getOnlinePreset(item.onlineStatus);
            const isActive = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                className="orion-row"
                onClick={() => openAccount(item.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: isActive ? "rgba(45,134,89,0.04)" : "transparent",
                  border: "none",
                  borderLeft: isActive ? "2px solid rgba(45,134,89,0.45)" : "2px solid transparent",
                  borderBottom: index < rows.length - 1 ? `1px solid rgba(255,255,255,0.05)` : "none",
                  padding: "16px 18px 16px 14px",
                  display: isMobile ? "flex" : "grid",
                  gridTemplateColumns: "1fr 120px 120px 150px",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s ease, border-left-color 0.15s ease",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 4 }}>
                    {item?.name || "Conta sem nome"}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                    {item?.email || "Sem email"}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusPill color={onlineStatus.color} bg={onlineStatus.bg}>
                      {onlineStatus.label}
                    </StatusPill>
                    {item?.twofaEnabled ? (
                      <StatusPill color={C.green} bg="rgba(45,134,89,0.12)">
                        2FA
                      </StatusPill>
                    ) : null}
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, color: C.white, fontVariantNumeric: "tabular-nums" }}>
                  {`R$ ${fmtBRL(item?.balance || 0)}`}
                </div>

                <div>
                  <StatusPill color={userStatus.color} bg={userStatus.bg}>
                    {userStatus.label}
                  </StatusPill>
                </div>

                <div style={{ fontSize: 12, color: C.muted }}>
                  {getAccountStatusLabel(item?.accountStatus)}
                </div>
              </button>
            );
          })
        )}
      </Card>

      {selectedId ? (
        <ModalPortal>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) closePanel();
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: modalTheme.overlayBg,
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? 10 : 24,
              animation: "orionFadeIn 0.16s ease-out",
            }}
          >
            <div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              style={{
                width: "100%",
                maxWidth: 1120,
                height: isMobile ? "calc(100vh - 20px)" : "min(92vh, 920px)",
                background: modalTheme.contentBg,
                border: `1px solid ${modalTheme.border}`,
                borderRadius: isMobile ? 20 : 24,
                boxShadow: modalTheme.shadow,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "orionScaleIn 0.2s ease-out",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: isMobile ? 16 : 22,
                  borderBottom: `1px solid ${modalTheme.border}`,
                  flexShrink: 0,
                  background: modalTheme.headerBg,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 140,
                    height: 100,
                    background: "linear-gradient(135deg, transparent 55%, rgba(129,182,28,0.05) 100%)",
                    borderTopRightRadius: isMobile ? 20 : 24,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 900,
                      color: modalTheme.title,
                      marginBottom: 5,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    Painel privativo da conta
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: modalTheme.text,
                      lineHeight: 1.55,
                      maxWidth: 760,
                    }}
                  >
                    Visão operacional com ações administrativas, taxas, adquirentes, KYC e transações detalhadas.
                  </div>
                </div>

                <button
                  onClick={closePanel}
                  style={{
                    border: `1px solid ${modalTheme.border}`,
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: modalTheme.closeBg,
                    color: modalTheme.muted,
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: isMobile ? 14 : 20,
                  backgroundColor: modalTheme.contentBg,
                  backgroundImage: "radial-gradient(circle, rgba(45,134,89,0.045) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {detailsLoading || !selected ? (
                  <EmptyState text="Carregando detalhes da conta..." loading color={modalTheme.text} />
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div
                      style={{
                        padding: isMobile ? "16px" : "18px",
                        borderRadius: 18,
                        background: modalTheme.cardBg,
                        border: `1px solid ${modalTheme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: modalTheme.title,
                              marginBottom: 5,
                              wordBreak: "break-word",
                              letterSpacing: "-0.03em",
                            }}
                          >
                            {selected.name || "Conta"}
                          </div>
                          <div style={{ fontSize: 13, color: modalTheme.text, wordBreak: "break-word" }}>
                            {selected.email || "Sem email"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <StatusPill
                            color={selectedStatusPreset.color}
                            bg={selectedStatusPreset.bg}
                            borderColor={modalTheme.border}
                          >
                            {selectedStatusPreset.label}
                          </StatusPill>
                          <StatusPill
                            color={selectedOnlinePreset.color}
                            bg={selectedOnlinePreset.bg}
                            borderColor={modalTheme.border}
                          >
                            {selectedOnlinePreset.label}
                          </StatusPill>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                          gap: 12,
                          marginTop: 16,
                        }}
                      >
                        <SmallInfo label="Telefone" value={selected.phone || "—"} theme={modalTheme} />
                        <SmallInfo label="Documento" value={selected.document || "—"} theme={modalTheme} />
                        <SmallInfo label="Role" value={selected.role || "user"} theme={modalTheme} />
                        <SmallInfo
                          label="Conta operacional"
                          value={getAccountStatusLabel(selected.accountStatus)}
                          theme={modalTheme}
                        />
                        <SmallInfo
                          label="Saldo disponível"
                          value={`R$ ${fmtBRL(selected?.wallet?.balance?.available || 0)}`}
                          theme={modalTheme}
                        />
                        <SmallInfo label="Pix key" value={selected.pixKey || "—"} theme={modalTheme} />
                        <SmallInfo
                          label="Adquirente de cobrança"
                          value={routingForm.chargeProvider || "Padrão do sistema"}
                          theme={modalTheme}
                        />
                        <SmallInfo
                          label="Adquirente de saque"
                          value={routingForm.cashoutProvider || "Padrão do sistema"}
                          theme={modalTheme}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <button
                        onClick={() =>
                          handleStatusChange(selected.status === "blocked" ? "active" : "blocked")
                        }
                        disabled={savingStatus}
                        style={{
                          border: selected.status === "blocked"
                            ? "1px solid rgba(52,160,101,0.25)"
                            : "1px solid rgba(229,72,77,0.22)",
                          borderRadius: 14,
                          padding: "14px 16px",
                          background: selected.status === "blocked"
                            ? "linear-gradient(160deg, #34A065 0%, #2D8659 60%, #246B47 100%)"
                            : "linear-gradient(160deg, #F05A5E 0%, #E5484D 60%, #C73D42 100%)",
                          boxShadow: selected.status === "blocked"
                            ? "0 4px 12px rgba(45,134,89,0.14), 0 1px 3px rgba(0,0,0,0.22)"
                            : "0 4px 12px rgba(229,72,77,0.14), 0 1px 3px rgba(0,0,0,0.22)",
                          color: "#FFFFFF",
                          fontWeight: 900,
                          fontFamily: "inherit",
                          cursor: savingStatus ? "not-allowed" : "pointer",
                          opacity: savingStatus ? 0.65 : 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          minHeight: 50,
                          fontSize: 14,
                        }}
                      >
                        {selected.status === "blocked" ? <ShieldCheck size={15} /> : <Ban size={15} />}
                        {savingStatus
                          ? "Salvando..."
                          : selected.status === "blocked"
                            ? "Desbloquear conta"
                            : "Bloquear conta"}
                      </button>

                      <button
                        onClick={() => handleStatusChange("inactive")}
                        disabled={savingStatus}
                        style={{
                          border: "1px solid rgba(129,182,28,0.22)",
                          borderRadius: 14,
                          padding: "14px 16px",
                          background: "linear-gradient(160deg, #96CC20 0%, #81B61C 60%, #6A9A14 100%)",
                          boxShadow: "0 4px 12px rgba(129,182,28,0.12), 0 1px 3px rgba(0,0,0,0.22)",
                          color: "#FFFFFF",
                          fontWeight: 900,
                          fontFamily: "inherit",
                          cursor: savingStatus ? "not-allowed" : "pointer",
                          opacity: savingStatus ? 0.65 : 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          minHeight: 50,
                          fontSize: 14,
                        }}
                      >
                        <BadgeCheck size={15} />
                        {savingStatus ? "Salvando..." : "Marcar como inativa"}
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: 14,
                      }}
                    >
                      <SectionCard
                        icon={<Percent size={16} color={C.green} />}
                        title="Taxas da conta"
                        theme={modalTheme}
                      >
                        <div style={{ display: "grid", gap: 16 }}>
                          {[
                            { label: "PIX", inFixed: "pixInFixed", inPct: "pixInPercentage", outFixed: "pixOutFixed", outPct: "pixOutPercentage" },
                            { label: "Cripto", inFixed: "cryptoInFixed", inPct: "cryptoInPercentage", outFixed: "cryptoOutFixed", outPct: "cryptoOutPercentage" },
                          ].map(({ label, inFixed, inPct, outFixed, outPct }) => (
                            <div key={label}>
                              <div style={{ fontSize: 14, fontWeight: 900, color: modalTheme.title, marginBottom: 10 }}>
                                {label}
                              </div>
                              <div style={{ display: "grid", gap: 8 }}>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: isMobile ? "1fr" : "80px 1fr 1fr",
                                    gap: 8,
                                    alignItems: "end",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: C.green,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.08em",
                                      paddingBottom: 6,
                                      paddingLeft: 2,
                                    }}
                                  >
                                    Entrada
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, color: modalTheme.muted, marginBottom: 5 }}>Taxa fixa (R$)</div>
                                    <input
                                      value={splitForm[inFixed]}
                                      onChange={(e) => setSplitForm((prev) => ({ ...prev, [inFixed]: e.target.value }))}
                                      style={{ ...inputStyle, background: modalTheme.inputBg, border: `1px solid ${modalTheme.border}`, color: modalTheme.title }}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, color: modalTheme.muted, marginBottom: 5 }}>Taxa percentual (%)</div>
                                    <input
                                      value={splitForm[inPct]}
                                      onChange={(e) => setSplitForm((prev) => ({ ...prev, [inPct]: e.target.value }))}
                                      style={{ ...inputStyle, background: modalTheme.inputBg, border: `1px solid ${modalTheme.border}`, color: modalTheme.title }}
                                    />
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: isMobile ? "1fr" : "80px 1fr 1fr",
                                    gap: 8,
                                    alignItems: "end",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: C.gold,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.08em",
                                      paddingBottom: 6,
                                      paddingLeft: 2,
                                    }}
                                  >
                                    Saída
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, color: modalTheme.muted, marginBottom: 5 }}>Taxa fixa (R$)</div>
                                    <input
                                      value={splitForm[outFixed]}
                                      onChange={(e) => setSplitForm((prev) => ({ ...prev, [outFixed]: e.target.value }))}
                                      style={{ ...inputStyle, background: modalTheme.inputBg, border: `1px solid ${modalTheme.border}`, color: modalTheme.title }}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, color: modalTheme.muted, marginBottom: 5 }}>Taxa percentual (%)</div>
                                    <input
                                      value={splitForm[outPct]}
                                      onChange={(e) => setSplitForm((prev) => ({ ...prev, [outPct]: e.target.value }))}
                                      style={{ ...inputStyle, background: modalTheme.inputBg, border: `1px solid ${modalTheme.border}`, color: modalTheme.title }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div
                            style={{
                              borderTop: `1px solid ${modalTheme.border}`,
                              paddingTop: 14,
                              marginTop: 2,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: C.gold,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: 10,
                              }}
                            >
                              Retenção
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                                gap: 8,
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 11, color: modalTheme.muted, marginBottom: 5 }}>Dias de retenção</div>
                                <input
                                  type="number"
                                  min="0"
                                  value={splitForm.retentionDays}
                                  onChange={(e) => setSplitForm((prev) => ({ ...prev, retentionDays: e.target.value }))}
                                  style={{ ...inputStyle, background: modalTheme.inputBg, border: `1px solid ${modalTheme.border}`, color: modalTheme.title }}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: 11, color: modalTheme.muted, marginBottom: 5 }}>Percentual retido (%)</div>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={splitForm.retentionPercentage}
                                  onChange={(e) => setSplitForm((prev) => ({ ...prev, retentionPercentage: e.target.value }))}
                                  style={{ ...inputStyle, background: modalTheme.inputBg, border: `1px solid ${modalTheme.border}`, color: modalTheme.title }}
                                />
                              </div>
                            </div>
                          </div>

                          <Btn
                            onClick={handleSaveSplit}
                            disabled={savingSplit}
                            icon={<Percent size={14} />}
                            style={{ width: isMobile ? "100%" : 220 }}
                          >
                            {savingSplit ? "Salvando taxas..." : "Salvar taxas"}
                          </Btn>
                        </div>
                      </SectionCard>

                      <SectionCard
                        icon={<Landmark size={16} color={C.gold} />}
                        title="Adquirentes da conta"
                        theme={modalTheme}
                      >
                        <div style={{ display: "grid", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, color: modalTheme.muted, marginBottom: 6 }}>Cobrança</div>
                            <select
                              value={routingForm.chargeProvider}
                              onChange={(e) =>
                                setRoutingForm((prev) => ({
                                  ...prev,
                                  chargeProvider: e.target.value,
                                }))
                              }
                              style={{
                                ...selectStyle,
                                background: modalTheme.inputBg,
                                border: `1px solid ${modalTheme.border}`,
                                color: modalTheme.title,
                              }}
                            >
                              {providers.map((p, index) => (
                                <option key={p.value || `charge-${index}`} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div style={{ fontSize: 12, color: modalTheme.muted, marginBottom: 6 }}>Saque</div>
                            <select
                              value={routingForm.cashoutProvider}
                              onChange={(e) =>
                                setRoutingForm((prev) => ({
                                  ...prev,
                                  cashoutProvider: e.target.value,
                                }))
                              }
                              style={{
                                ...selectStyle,
                                background: modalTheme.inputBg,
                                border: `1px solid ${modalTheme.border}`,
                                color: modalTheme.title,
                              }}
                            >
                              {providers.map((p, index) => (
                                <option key={p.value || `cashout-${index}`} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Btn
                            onClick={handleSaveRouting}
                            disabled={savingRouting}
                            variant="secondary"
                            icon={<Landmark size={14} />}
                            style={{ width: isMobile ? "100%" : 250 }}
                          >
                            {savingRouting ? "Salvando adquirentes..." : "Salvar adquirentes"}
                          </Btn>
                        </div>
                      </SectionCard>
                    </div>

                    <SectionCard
                      icon={<FileCheck2 size={16} color={C.green} />}
                      title="Documentos / KYC"
                      theme={modalTheme}
                    >
                      {!kyc ? (
                        <div style={{ fontSize: 13, color: modalTheme.text }}>
                          Nenhum KYC encontrado para esta conta.
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                              gap: 10,
                            }}
                          >
                            <SmallInfo label="Status" value={kyc.status} theme={modalTheme} />
                            <SmallInfo label="Enviado em" value={fmtDate(kyc.submittedAt || kyc.createdAt)} theme={modalTheme} />
                            <SmallInfo label="Documento" value={kyc.documentNumber} theme={modalTheme} />
                            <SmallInfo label="Tipo" value={String(kyc.documentType || "").toUpperCase()} theme={modalTheme} />
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                              gap: 8,
                            }}
                          >
                            {[
                              ["Documento", kyc.documentFile],
                              ["Selfie", kyc.selfieFile],
                              ["Selfie + documento", kyc.livenessFile],
                              ["Comprovante", kyc.addressProofFile],
                            ].map(([label, href]) => (
                              <a
                                key={label}
                                href={href || "#"}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: "rgba(45,134,89,0.08)",
                                  border: "1px solid rgba(45,134,89,0.18)",
                                  borderRadius: 14,
                                  padding: "11px 12px",
                                  color: href ? C.green : modalTheme.muted,
                                  textDecoration: "none",
                                  fontSize: 13,
                                  fontWeight: 800,
                                  pointerEvents: href ? "auto" : "none",
                                }}
                              >
                                {label}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      icon={<ScrollText size={16} color={C.gold} />}
                      title="Últimas transações"
                      theme={modalTheme}
                    >
                      {transactions.length === 0 ? (
                        <div style={{ fontSize: 13, color: modalTheme.text }}>
                          Nenhuma transação recente encontrada.
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 9 }}>
                          {transactions.map((tx) => (
                            <button
                              key={tx._id}
                              type="button"
                              onClick={() => setSelectedTransaction(tx)}
                              style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "1fr 120px 26px",
                                gap: 10,
                                alignItems: "center",
                                padding: "12px 13px",
                                borderRadius: 15,
                                border: `1px solid ${modalTheme.border}`,
                                background: modalTheme.listRowBg,
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "inherit",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: modalTheme.title,
                                    fontWeight: 800,
                                    marginBottom: 3,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {tx.externalReference || tx._id}
                                </div>
                                <div style={{ fontSize: 11, color: modalTheme.muted }}>
                                  {tx.method} • {tx.provider} • {fmtDate(tx.createdAt)}
                                </div>
                              </div>

                              <div style={{ fontSize: 13, color: modalTheme.title, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
                                {`R$ ${fmtBRL(tx.amount)}`}
                              </div>

                              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <ChevronRight size={15} color={modalTheme.muted} />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}
              </div>
            </div>

            <style>{`
              @keyframes orionFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes orionScaleIn {
                from { opacity: 0; transform: translateY(8px) scale(0.99); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .orion-row:hover {
                background: rgba(45,134,89,0.03) !important;
                border-left-color: rgba(45,134,89,0.35) !important;
              }
            `}</style>
          </div>
        </ModalPortal>
      ) : null}

      <TransactionDetailModal
        tx={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        isMobile={isMobile}
        theme={modalTheme}
      />
    </div>
  );
}