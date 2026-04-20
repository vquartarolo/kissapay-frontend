// ─── useIntegrations ─────────────────────────────────────────────────────────
// Hook para gerenciar o estado das integrações.
// Por ora usa localStorage. Quando o backend estiver pronto, trocar as
// funções load/save para chamadas à API (ver BACKEND_API_DOCS.md).

import { useState, useCallback } from "react";

const STORAGE_KEY = "orionpay_integrations";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage quota exceeded — fail silently
  }
}

/**
 * Retorna:
 *   config        — { [integrationId]: { enabled: bool, fields: { [key]: string } } }
 *   getIntegration(id) — dados de uma integração específica
 *   saveIntegration(id, fields, enabled) — salva campos e status
 *   toggleEnabled(id) — ativa / desativa sem alterar campos
 *   countActive()  — número de integrações com enabled=true e ao menos 1 campo preenchido
 */
export default function useIntegrations() {
  const [config, setConfig] = useState(() => loadFromStorage());

  const getIntegration = useCallback(
    (id) => config[id] ?? { enabled: false, fields: {} },
    [config]
  );

  const saveIntegration = useCallback((id, fields, enabled) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        [id]: {
          enabled: enabled ?? prev[id]?.enabled ?? false,
          fields:  { ...(prev[id]?.fields ?? {}), ...fields },
        },
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const toggleEnabled = useCallback((id) => {
    setConfig((prev) => {
      const current = prev[id] ?? { enabled: false, fields: {} };
      const next = {
        ...prev,
        [id]: { ...current, enabled: !current.enabled },
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const countActive = useCallback(() => {
    return Object.values(config).filter(
      (v) => v.enabled && Object.values(v.fields ?? {}).some((f) => String(f).trim() !== "")
    ).length;
  }, [config]);

  const isConfigured = useCallback(
    (id) => {
      const c = config[id];
      if (!c) return false;
      return Object.values(c.fields ?? {}).some((f) => String(f).trim() !== "");
    },
    [config]
  );

  return { config, getIntegration, saveIntegration, toggleEnabled, countActive, isConfigured };
}
