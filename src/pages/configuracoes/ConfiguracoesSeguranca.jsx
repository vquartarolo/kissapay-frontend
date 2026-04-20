import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  Smartphone,
  X,
  Monitor,
  MapPin,
  RefreshCw,
  LogOut,
  CheckCircle2,
  LaptopMinimal,
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Trash2,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Btn from "../../components/ui/Btn";
import C from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { setup2FA, enable2FA, disable2FA } from "../../services/twofa.service";
import {
  getMySessionsGrouped,
  logoutOtherSessions,
  revokeSession,
} from "../../services/auth.service";

function sanitize2FACode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function formatAbsoluteDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatRelativeTime(value) {
  if (!value) return "-";

  const date = new Date(value).getTime();
  const now = Date.now();
  const diffMs = date - now;

  const divisions = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 30, unit: "day" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ];

  let duration = diffMs / 1000;
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }

    duration /= division.amount;
  }

  return "-";
}

function getSessionBadge(status) {
  if (status === "current") {
    return {
      label: "Sessão atual",
      color: C.green,
      bg: "rgba(0,196,106,0.10)",
      border: "rgba(0,196,106,0.20)",
      glow: "0 0 0 1px rgba(0,196,106,0.05)",
    };
  }

  if (status === "active") {
    return {
      label: "Ativa",
      color: "#AFC3D9",
      bg: "rgba(175,195,217,0.08)",
      border: "rgba(175,195,217,0.14)",
      glow: "none",
    };
  }

  return {
    label: "Encerrada",
    color: "#FFB3B8",
    bg: "rgba(255,77,79,0.08)",
    border: "rgba(255,77,79,0.16)",
    glow: "none",
  };
}

function getSessionIcon(deviceLabel = "") {
  const value = String(deviceLabel || "").toLowerCase();

  if (
    value.includes("android") ||
    value.includes("iphone") ||
    value.includes("ios") ||
    value.includes("mobile")
  ) {
    return Smartphone;
  }

  if (
    value.includes("windows") ||
    value.includes("mac") ||
    value.includes("linux") ||
    value.includes("desktop")
  ) {
    return Monitor;
  }

  return LaptopMinimal;
}

function TwoFactorCodeInput({ value, onChange, isMobile, theme }) {
  const inputRefs = useRef([]);

  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");
  const isLight = theme === "light";

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

    const nextFocusIndex = Math.min(Math.max(normalized.length - 1, 0), 5);
    inputRefs.current[nextFocusIndex]?.focus();
    inputRefs.current[nextFocusIndex]?.select?.();
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          fontSize: 12,
          color: isLight ? "#64748B" : C.muted,
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
              background: isLight ? "#FFFFFF" : C.inputDeep,
              border: `1px solid ${
                digit
                  ? "rgba(0,224,148,0.40)"
                  : isLight
                  ? "rgba(15,23,42,0.12)"
                  : C.border
              }`,
              borderRadius: 16,
              color: isLight ? "#0F172A" : C.white,
              fontSize: isMobile ? 20 : 22,
              fontWeight: 800,
              textAlign: "center",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              boxShadow: digit
                ? "0 0 0 3px rgba(0,224,148,0.08)"
                : isLight
                ? "0 1px 2px rgba(15,23,42,0.04)"
                : "none",
              transition: "all 0.15s ease",
              caretColor: C.green,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ riskLevel, riskReasons }) {
  if (riskLevel === "low" || !riskReasons?.length) return null;
  const isHigh = riskLevel === "high";
  const color = isHigh ? "#FF4D4F" : "#F59E0B";
  const bg = isHigh ? "rgba(255,77,79,0.10)" : "rgba(245,158,11,0.10)";
  const border = isHigh ? "rgba(255,77,79,0.22)" : "rgba(245,158,11,0.22)";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {riskReasons.map((reason) => (
        <div
          key={reason}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, color,
            background: bg, border: `1px solid ${border}`,
            borderRadius: 8, padding: "5px 10px",
          }}
        >
          <AlertTriangle size={12} />
          <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>{reason}</span>
        </div>
      ))}
    </div>
  );
}

function SessionGroupCard({ group, isMobile, onRevoke, revokeLoadingId }) {
  const [expanded, setExpanded] = useState(false);
  const badge = getSessionBadge(group.isCurrent ? "current" : "active");
  const Icon = getSessionIcon(group.deviceLabel);
  const relative = formatRelativeTime(group.lastSeenAt);
  const absolute = formatAbsoluteDate(group.lastSeenAt);

  const riskBorderColor =
    group.riskLevel === "high" ? "rgba(255,77,79,0.28)"
    : group.riskLevel === "medium" ? "rgba(245,158,11,0.24)"
    : C.border;

  const revokableInGroup = group.sessions.filter(
    (s) => !s.isCurrent && s.status !== "ended"
  );

  return (
    <div
      style={{
        background: group.isCurrent
          ? "radial-gradient(circle at top right, rgba(0,196,106,0.12), transparent 40%), linear-gradient(180deg, rgba(0,196,106,0.06), rgba(255,255,255,0.015))"
          : "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 40%), linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))",
        border: `1px solid ${group.isCurrent ? "rgba(0,196,106,0.22)" : riskBorderColor}`,
        borderRadius: 18,
        padding: isMobile ? 14 : 16,
        boxShadow: group.isCurrent
          ? "0 10px 30px rgba(0,196,106,0.08)"
          : "0 8px 20px rgba(0,0,0,0.25)",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0px)"; }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between",
        gap: 12, alignItems: "flex-start",
        flexDirection: isMobile ? "column" : "row",
      }}>
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 15, flexShrink: 0,
            background: group.isCurrent ? "rgba(0,196,106,0.10)" : "rgba(255,255,255,0.035)",
            border: group.isCurrent ? "1px solid rgba(0,196,106,0.18)" : `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: group.isCurrent ? C.green : C.muted,
          }}>
            <Icon size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: C.white,
              marginBottom: 2, lineHeight: 1.3, wordBreak: "break-word",
            }}>
              {group.deviceLabel || "Dispositivo desconhecido"}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 8 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, color: C.muted, background: C.cardSoft,
                border: `1px solid ${C.border}`, padding: "5px 9px", borderRadius: 999,
              }}>
                <MapPin size={12} />
                {group.locationLabel || "Local não identificado"}
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, color: C.muted, background: C.cardSoft,
                border: `1px solid ${C.border}`, padding: "5px 9px", borderRadius: 999,
              }}>
                <Globe size={12} />
                {group.ip || "-"}
              </div>

              {group.count > 1 && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 12, color: C.muted, background: C.cardSoft,
                  border: `1px solid ${C.border}`, padding: "5px 9px", borderRadius: 999,
                }}>
                  <Layers size={12} />
                  {group.count} conexões
                </div>
              )}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}>
              <div style={{
                background: C.cardSoft, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "9px 11px",
              }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Última atividade
                </div>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{relative}</div>
                <div style={{ color: C.muted, fontSize: 11 }}>{absolute}</div>
              </div>

              <div style={{
                background: C.cardSoft, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "9px 11px",
              }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Criada em
                </div>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>
                  {formatRelativeTime(group.createdAt)}
                </div>
                <div style={{ color: C.muted, fontSize: 11 }}>{formatAbsoluteDate(group.createdAt)}</div>
              </div>
            </div>

            <RiskBadge riskLevel={group.riskLevel} riskReasons={group.riskReasons} />
          </div>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          whiteSpace: "nowrap", padding: "7px 11px", borderRadius: 999, flexShrink: 0,
          background: group.isCurrent ? "rgba(0,196,106,0.12)" : badge.bg,
          border: `1px solid ${group.isCurrent ? "rgba(0,196,106,0.30)" : badge.border}`,
          color: group.isCurrent ? "#00ffae" : badge.color,
          fontSize: 12, fontWeight: 800,
          boxShadow: group.isCurrent ? "0 0 10px rgba(0,196,106,0.15)" : "none",
        }}>
          <CheckCircle2 size={13} />
          {group.isCurrent ? "Sessão atual" : "Ativa"}
        </div>
      </div>

      {(!group.isCurrent || group.count > 1) && (
        <div style={{
          display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap",
          paddingTop: 12, borderTop: `1px solid ${C.border}`,
        }}>
          {group.count > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 600, color: C.muted,
                background: C.cardSoft, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "6px 11px", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Ocultar" : `Ver ${group.count} sessões`}
            </button>
          )}

          {!group.isCurrent && (
            <button
              onClick={() =>
                group.sessions
                  .filter((s) => !s.isCurrent && s.status !== "ended")
                  .forEach((s) => onRevoke(s.id))
              }
              disabled={group.sessions.some((s) => revokeLoadingId === s.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 600, color: "#FF4D4F",
                background: "rgba(255,77,79,0.07)", border: "1px solid rgba(255,77,79,0.20)",
                borderRadius: 8, padding: "6px 11px", cursor: "pointer",
                fontFamily: "inherit",
                opacity: revokableInGroup.some((s) => revokeLoadingId === s.id) ? 0.6 : 1,
              }}
            >
              <LogOut size={13} />
              {group.count > 1 ? "Encerrar grupo" : "Encerrar sessão"}
            </button>
          )}
        </div>
      )}

      {expanded && group.count > 1 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {group.sessions.map((s) => {
            const sBadge = getSessionBadge(s.status);
            return (
              <div
                key={s.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: 8, padding: "9px 12px",
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.white }}>
                    {formatAbsoluteDate(s.lastSeenAt)}
                    {s.isCurrent && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: C.green, fontWeight: 700 }}>
                        • atual
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {formatRelativeTime(s.lastSeenAt)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: sBadge.color,
                    background: sBadge.bg, border: `1px solid ${sBadge.border}`,
                    borderRadius: 6, padding: "3px 8px",
                  }}>
                    {sBadge.label}
                  </div>

                  {!s.isCurrent && s.status !== "ended" && (
                    <button
                      onClick={() => onRevoke(s.id)}
                      disabled={revokeLoadingId === s.id}
                      style={{
                        fontSize: 11, fontWeight: 600, color: "#FF4D4F",
                        background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.18)",
                        borderRadius: 6, padding: "4px 9px", cursor: "pointer",
                        fontFamily: "inherit",
                        opacity: revokeLoadingId === s.id ? 0.5 : 1,
                      }}
                    >
                      {revokeLoadingId === s.id ? "..." : <><Trash2 size={11} style={{ marginRight: 4 }} />Encerrar</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mantido para compatibilidade, não usado diretamente na lista
function SessionCard({ session, isMobile }) {
  const badge = getSessionBadge(session.status);
  const Icon = getSessionIcon(session.deviceLabel);
  const relative = formatRelativeTime(session.lastSeenAt || session.createdAt);
  const absolute = formatAbsoluteDate(session.lastSeenAt || session.createdAt);

  return (
    <div
      style={{
        background:
          session.status === "current"
            ? "radial-gradient(circle at top right, rgba(0,196,106,0.12), transparent 40%), linear-gradient(180deg, rgba(0,196,106,0.06), rgba(255,255,255,0.015))"
            : "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 40%), linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))",
        border:
          session.status === "current"
            ? "1px solid rgba(0,196,106,0.22)"
            : `1px solid ${C.border}`,
        borderRadius: 18,
        padding: isMobile ? 14 : 16,
        boxShadow:
          session.status === "current"
            ? "0 10px 30px rgba(0,196,106,0.08)"
            : "0 8px 20px rgba(0,0,0,0.25)",
        transition: "all 0.25s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          session.status === "current"
            ? "0 14px 40px rgba(0,196,106,0.12)"
            : "0 12px 30px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow =
          session.status === "current"
            ? "0 10px 30px rgba(0,196,106,0.08)"
            : "0 8px 20px rgba(0,0,0,0.25)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background:
                session.status === "current"
                  ? "rgba(0,196,106,0.10)"
                  : "rgba(255,255,255,0.035)",
              border:
                session.status === "current"
                  ? "1px solid rgba(0,196,106,0.18)"
                  : `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: session.status === "current" ? C.green : C.muted,
              flexShrink: 0,
            }}
          >
            <Icon size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: C.white,
                marginBottom: 4,
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {session.deviceLabel || "Dispositivo desconhecido"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#6b7c93",
                marginTop: 2,
                marginBottom: 10,
              }}
            >
              Dispositivo reconhecido
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: C.muted,
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  padding: "7px 10px",
                  borderRadius: 999,
                }}
              >
                <MapPin size={13} />
                <span>{session.locationLabel || "Local não identificado"}</span>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: C.muted,
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  padding: "7px 10px",
                  borderRadius: 999,
                }}
              >
                <Globe size={13} />
                <span>{session.ip || "-"}</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                  }}
                >
                  Última atividade
                </div>
                <div
                  style={{
                    color: C.white,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  {relative}
                </div>
                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                  }}
                >
                  {absolute}
                </div>
              </div>

              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                  }}
                >
                  Criada em
                </div>
                <div
                  style={{
                    color: C.white,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  {formatRelativeTime(session.createdAt)}
                </div>
                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                  }}
                >
                  {formatAbsoluteDate(session.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            padding: "8px 12px",
            borderRadius: 999,
            background:
              session.status === "current"
                ? "rgba(0,196,106,0.12)"
                : badge.bg,
            border: `1px solid ${
              session.status === "current"
                ? "rgba(0,196,106,0.30)"
                : badge.border
            }`,
            color: session.status === "current" ? "#00ffae" : badge.color,
            fontSize: 12,
            fontWeight: 800,
            boxShadow:
              session.status === "current"
                ? "0 0 10px rgba(0,196,106,0.15)"
                : "none",
          }}
        >
          <CheckCircle2 size={14} />
          {badge.label}
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesSeguranca({ isMobile }) {
  const { user, refreshProfile } = useAuth();
  const { theme } = useTheme();

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twofaMode, setTwofaMode] = useState("enable");
  const [qrCode, setQrCode] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [twofaLoading, setTwofaLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [groups, setGroups] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsRefreshing, setSessionsRefreshing] = useState(false);
  const [logoutOthersLoading, setLogoutOthersLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState(null);

  const twofa = Boolean(user?.twofaEnabled ?? user?.twofa ?? false);
  const isDisableMode = twofaMode === "disable";
  const isLight = theme === "light";

  const modalSurface = isLight
    ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))"
    : "linear-gradient(180deg, rgba(10,16,28,0.98), rgba(7,11,20,0.98))";

  const modalTitleColor = isLight ? "#0F172A" : C.white;
  const modalTextColor = isLight ? "#64748B" : C.muted;
  const modalCardBg = isLight ? "#F8FAFC" : C.cardSoft;
  const modalCardBorder = isLight ? "rgba(15,23,42,0.08)" : C.border;
  const modalCloseBg = isLight ? "#FFFFFF" : C.cardSoft;
  const modalCloseColor = isLight ? "#475569" : C.muted;

  const allSessions = useMemo(
    () => groups.flatMap((g) => g.sessions),
    [groups]
  );

  const activeSessionsCount = useMemo(
    () => allSessions.filter((s) => s.status === "active").length,
    [allSessions]
  );

  const hasRevokableSessions = useMemo(
    () => allSessions.some((s) => !s.isCurrent && s.status !== "ended"),
    [allSessions]
  );

  const endedSessionsCount = useMemo(
    () => allSessions.filter((s) => s.status === "ended").length,
    [allSessions]
  );

  const currentSession = useMemo(
    () => allSessions.find((s) => s.status === "current") || null,
    [allSessions]
  );

  function clearMessages() {
    setError("");
    setSuccess("");
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

  const loadSessions = useCallback(async ({ silent = false } = {}) => {
    if (silent) setSessionsRefreshing(true);
    else setSessionsLoading(true);

    try {
      const res = await getMySessionsGrouped();
      if (res?.status) {
        setGroups(Array.isArray(res.groups) ? res.groups : []);
      } else {
        setError(res?.msg || "Erro ao carregar sessões da conta.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao carregar sessões da conta.");
    } finally {
      if (silent) setSessionsRefreshing(false);
      else setSessionsLoading(false);
    }
  }, []);

  async function handleRevokeSession(sessionId) {
    setRevokeLoadingId(sessionId);
    try {
      const res = await revokeSession(sessionId);
      if (res?.status) {
        await loadSessions({ silent: true });
      } else {
        setError(res?.msg || "Erro ao encerrar sessão.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao encerrar sessão.");
    } finally {
      setRevokeLoadingId(null);
    }
  }

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
        setError(res?.msg || "Erro ao iniciar configuração do 2FA.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.msg || "Erro ao iniciar configuração do 2FA."
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
        close2FAModal();
        await refreshProfile();
        await loadSessions({ silent: true });
        setSuccess("2FA ativado com sucesso. Outras sessões foram protegidas.");
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
        close2FAModal();
        await refreshProfile();
        await loadSessions({ silent: true });
        setSuccess(
          "2FA desativado com sucesso. Outras sessões foram encerradas."
        );
      } else {
        setError(res?.msg || "Código inválido.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao desativar 2FA.");
    } finally {
      setTwofaLoading(false);
    }
  }

  async function handleLogoutOtherSessions() {
    clearMessages();
    setLogoutOthersLoading(true);

    try {
      const res = await logoutOtherSessions();

      if (res?.status) {
        await loadSessions({ silent: true });
        setSuccess(
          res?.revokedCount > 0
            ? "Todas as outras sessões foram encerradas com sucesso."
            : "Nenhuma outra sessão ativa foi encontrada."
        );
      } else {
        setError(res?.msg || "Erro ao encerrar outras sessões.");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Erro ao encerrar outras sessões.");
    } finally {
      setLogoutOthersLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Segurança" subtitle="Autenticação de dois fatores e sessões ativas" />

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {success ? (
          <div
            style={{
              background: "rgba(0,196,106,0.10)",
              border: "1px solid rgba(0,196,106,0.20)",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 13,
              color: C.green,
            }}
          >
            {success}
          </div>
        ) : null}

        {error && !show2FAModal ? (
          <div
            style={{
              background: "rgba(255,77,79,0.10)",
              border: "1px solid rgba(255,77,79,0.22)",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 13,
              color: C.error,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            background:
              "radial-gradient(circle at top right, rgba(0,196,106,0.08), transparent 35%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
            border: `1px solid ${C.border}`,
            borderRadius: 22,
            padding: isMobile ? 16 : 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexDirection: isMobile ? "column" : "row",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: twofa
                  ? "rgba(0,196,106,0.10)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  twofa ? "rgba(0,196,106,0.20)" : C.border
                }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: twofa ? C.green : C.muted,
                flexShrink: 0,
                boxShadow: twofa ? "0 0 0 1px rgba(0,196,106,0.04)" : "none",
              }}
            >
              <ShieldCheck size={21} />
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
                Autenticação de duas etapas
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.6,
                  maxWidth: 640,
                }}
              >
                {twofa
                  ? "Sua conta já está protegida com Google Authenticator. Alterações sensíveis exigem confirmação adicional."
                  : "Ative o 2FA para elevar a segurança da sua conta e proteger operações sensíveis."}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: twofa
                ? "rgba(0,196,106,0.10)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                twofa ? "rgba(0,196,106,0.18)" : C.border
              }`,
              color: twofa ? C.green : C.muted,
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {twofa ? "2FA ativo" : "2FA inativo"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
              border: `1px solid ${C.border}`,
              borderRadius: 20,
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
              Gerenciar 2FA
            </div>

            <div
              style={{
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.6,
                marginBottom: 18,
              }}
            >
              Use o Google Authenticator para adicionar ou remover a autenticação em duas etapas da sua conta.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {twofa ? (
                <Btn
                  onClick={handleOpen2FADisable}
                  disabled={twofaLoading}
                  style={{
                    maxWidth: 320,
                    width: "100%",
                  }}
                >
                  Desativar 2FA
                </Btn>
              ) : (
                <Btn
                  onClick={handleOpen2FASetup}
                  disabled={twofaLoading}
                  style={{
                    maxWidth: 320,
                    width: "100%",
                  }}
                >
                  {twofaLoading ? "Preparando..." : "Ativar 2FA"}
                </Btn>
              )}
            </div>
          </div>

          <div
            style={{
              background:
                "radial-gradient(circle at top right, rgba(51,125,255,0.08), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: isMobile ? 16 : 18,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "12px 12px",
                }}
              >
                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Sessão atual
                </div>
                <div
                  style={{
                    color: C.white,
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {currentSession ? "Online" : "-"}
                </div>
              </div>

              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "12px 12px",
                }}
              >
                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Outras ativas
                </div>
                <div
                  style={{
                    color: C.white,
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {activeSessionsCount}
                </div>
              </div>

              <div
                style={{
                  background: C.cardSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "12px 12px",
                }}
              >
                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Encerradas
                </div>
                <div
                  style={{
                    color: C.white,
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {endedSessionsCount}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: "14px 14px",
                borderRadius: 16,
                background: C.cardSoft,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  color: C.white,
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Proteção da conta
              </div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 13,
                  lineHeight: 1.65,
                }}
              >
                A OrionPay agora mantém sessões reais por dispositivo, com IP,
                localização aproximada e histórico recente de atividade.
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))",
            border: `1px solid ${C.border}`,
            borderRadius: 22,
            padding: isMobile ? 16 : 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: isMobile ? "stretch" : "center",
              flexDirection: isMobile ? "column" : "row",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.white,
                  marginBottom: 4,
                }}
              >
                Sessões da conta
              </div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                  maxWidth: 720,
                }}
              >
                Veja onde sua conta está conectada, monitore a atividade recente
                e encerre todas as outras sessões com segurança.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Btn
                variant="secondary"
                onClick={() => loadSessions({ silent: true })}
                disabled={sessionsRefreshing || sessionsLoading}
                style={{
                  minWidth: isMobile ? "100%" : 170,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <RefreshCw
                    size={15}
                    style={{
                      animation:
                        sessionsRefreshing || sessionsLoading
                          ? "spin 1s linear infinite"
                          : "none",
                    }}
                  />
                  {sessionsRefreshing || sessionsLoading
                    ? "Atualizando..."
                    : "Atualizar"}
                </span>
              </Btn>

              <Btn
                onClick={handleLogoutOtherSessions}
                disabled={
                  logoutOthersLoading ||
                  sessionsLoading ||
                  !hasRevokableSessions
                }
                style={{
                  minWidth: isMobile ? "100%" : 240,
                  fontSize: 13,
                  letterSpacing: 0.2,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <LogOut size={15} />
                  {logoutOthersLoading
                    ? "Encerrando..."
                    : "Sair de todas as outras sessões"}
                </span>
              </Btn>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {sessionsLoading ? (
              Array.from({ length: isMobile ? 2 : 3 }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: isMobile ? 14 : 16,
                    minHeight: 122,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
                      animation: "shimmer 1.6s infinite",
                    }}
                  />
                </div>
              ))
            ) : groups.length === 0 ? (
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: isMobile ? 18 : 24,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    margin: "0 auto 12px",
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.muted,
                  }}
                >
                  <ShieldCheck size={24} />
                </div>

                <div
                  style={{
                    color: C.white,
                    fontSize: 16,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Nenhuma sessão encontrada
                </div>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    lineHeight: 1.65,
                    maxWidth: 520,
                    margin: "0 auto",
                  }}
                >
                  Quando houver atividade autenticada na sua conta, as sessões
                  aparecerão aqui com dispositivo, IP e localização aproximada.
                </div>
              </div>
            ) : (
              groups.map((group) => (
                <SessionGroupCard
                  key={group.groupKey}
                  group={group}
                  isMobile={isMobile}
                  onRevoke={handleRevokeSession}
                  revokeLoadingId={revokeLoadingId}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {show2FAModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: isLight ? "rgba(15,23,42,0.35)" : "rgba(0,0,0,0.74)",
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
                background: modalSurface,
                border: `1px solid ${
                  isDisableMode
                    ? isLight
                      ? "rgba(255,77,79,0.18)"
                      : "rgba(255,77,79,0.20)"
                    : isLight
                    ? "rgba(0,224,148,0.16)"
                    : "rgba(0,224,148,0.16)"
                }`,
                borderRadius: 24,
                width: "100%",
                maxWidth: isDisableMode ? 520 : 620,
                padding: isMobile ? 14 : 18,
                boxSizing: "border-box",
                boxShadow: isLight
                  ? "0 30px 90px rgba(15,23,42,0.18)"
                  : isDisableMode
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
                  border: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : C.border}`,
                  background: modalCloseBg,
                  color: modalCloseColor,
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
                  <Smartphone size={20} />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 20 : 24,
                      fontWeight: 800,
                      color: modalTitleColor,
                      lineHeight: 1.1,
                      marginBottom: 4,
                    }}
                  >
                    {isDisableMode ? "Desativar 2FA" : "Ativar 2FA"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: modalTextColor,
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

              {isDisableMode ? (
                <>
                  <TwoFactorCodeInput
                    value={twofaCode}
                    onChange={(value) => setTwofaCode(sanitize2FACode(value))}
                    isMobile={isMobile}
                    theme={theme}
                  />

                  <div
                    style={{
                      marginTop: 8,
                      textAlign: "center",
                      fontSize: 12,
                      color: modalTextColor,
                      lineHeight: 1.5,
                    }}
                  >
                    Digite o código atual do Google Authenticator.
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "190px 1fr",
                      gap: 12,
                      alignItems: "stretch",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        background: modalCardBg,
                        border: `1px solid ${modalCardBorder}`,
                        borderRadius: 16,
                        padding: 12,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 190,
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
                              width: 145,
                              height: 145,
                              display: "block",
                              maxWidth: "100%",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            color: modalTextColor,
                            fontSize: 13,
                            textAlign: "center",
                          }}
                        >
                          QR Code indisponível.
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
                          background: modalCardBg,
                          border: `1px solid ${modalCardBorder}`,
                          borderRadius: 16,
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: modalTextColor,
                            marginBottom: 6,
                            fontWeight: 600,
                          }}
                        >
                          Chave manual
                        </div>

                        <div
                          style={{
                            color: modalTitleColor,
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

                      <TwoFactorCodeInput
                        value={twofaCode}
                        onChange={(value) => setTwofaCode(sanitize2FACode(value))}
                        isMobile={isMobile}
                        theme={theme}
                      />
                    </div>
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
                    ? "Confirmar desativação"
                    : "Confirmar ativação"}
                </Btn>

                <Btn variant="secondary" fullWidth onClick={close2FAModal}>
                  Cancelar
                </Btn>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
}