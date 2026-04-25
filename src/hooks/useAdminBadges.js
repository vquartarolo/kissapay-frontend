import { useCallback, useEffect, useState } from "react";
import {
  getAdminKycList,
  getPendingCashouts,
  listApprovals,
  getSecurityStats,
} from "../services/admin.service";

function extractCount(r) {
  if (!r || r.status !== "fulfilled") return 0;
  const v = r.value;
  if (!v) return 0;
  if (Array.isArray(v))              return v.length;
  if (typeof v.total === "number")   return v.total;
  if (Array.isArray(v.items))        return v.items.length;
  if (Array.isArray(v.data))         return v.data.length;
  return 0;
}

export default function useAdminBadges(enabled = true) {
  const [badges, setBadges] = useState({ kyc: 0, withdrawals: 0, approvals: 0, security: 0 });

  const fetch = useCallback(async () => {
    if (!enabled) return;
    try {
      const [kycR, cashR, apprR, secR] = await Promise.allSettled([
        getAdminKycList("pending"),
        getPendingCashouts(),
        listApprovals({ status: "pending", limit: 1 }),
        getSecurityStats(),
      ]);
      setBadges({
        kyc:         extractCount(kycR),
        withdrawals: extractCount(cashR),
        approvals:   extractCount(apprR),
        security:    secR.status === "fulfilled" ? (secR.value?.unresolved ?? 0) : 0,
      });
    } catch {}
  }, [enabled]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, [fetch]);

  return badges;
}
