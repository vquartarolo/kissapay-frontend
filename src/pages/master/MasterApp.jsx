import { useState, useEffect } from "react";
import { LayoutDashboard, Users, FileCheck, ArrowUpRight, List } from "lucide-react";
import { MASTER_CSS_VARS } from "../../master/theme/colors";
import SidebarMaster from "../../master/layouts/SidebarMaster";
import MasterLogin       from "./MasterLogin";
import MasterDashboard   from "./MasterDashboard";
import MasterUsers       from "./MasterUsers";
import MasterKYC         from "./MasterKYC";
import MasterWithdrawals from "./MasterWithdrawals";
import MasterTransactions from "./MasterTransactions";
import { masterValidate } from "../../services/master.service";

const NAV = [
  { id: "dashboard",    label: "Visão Geral", icon: LayoutDashboard },
  { id: "users",        label: "Usuários",    icon: Users            },
  { id: "kyc",          label: "KYC",         icon: FileCheck        },
  { id: "withdrawals",  label: "Saques",      icon: ArrowUpRight     },
  { id: "transactions", label: "Transações",  icon: List             },
];

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: var(--m-bg); color: var(--m-text-primary); }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--m-bg); }
  ::-webkit-scrollbar-thumb { background: var(--m-border-strong); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--m-text-dim); }
  input::placeholder { color: var(--m-text-dim); }
  button { transition: opacity 0.15s, transform 0.15s; }
  button:active { transform: scale(0.97); }
  @keyframes m-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .m-page { animation: m-fadein 0.22s ease forwards; }
  @keyframes m-spin { to { transform: rotate(360deg); } }
  select option { background: #141417; color: #fff; }
`;

function renderPage(page) {
  switch (page) {
    case "dashboard":    return <MasterDashboard />;
    case "users":        return <MasterUsers />;
    case "kyc":          return <MasterKYC />;
    case "withdrawals":  return <MasterWithdrawals />;
    case "transactions": return <MasterTransactions />;
    default:             return <MasterDashboard />;
  }
}

export default function MasterApp() {
  const [token,    setToken]    = useState("bypass");
  const [page,     setPage]     = useState("dashboard");
  const [theme,    setTheme]    = useState(() => localStorage.getItem("master-theme") || "dark");
  const [kycBadge, setKycBadge] = useState(4);
  const [validating, setValidating] = useState(false);

  // Inject CSS vars on theme change
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.setAttribute("data-master-theme", "light");
    } else {
      html.removeAttribute("data-master-theme");
    }
    localStorage.setItem("master-theme", theme);
  }, [theme]);

  // Token validation disabled — bypass mode
  // useEffect(() => {
  //   if (!token) { setValidating(false); return; }
  //   masterValidate(token)
  //     .then(ok => { if (!ok) setToken(""); })
  //     .catch(() => setToken(""))
  //     .finally(() => setValidating(false));
  // }, []);

  function handleToggleTheme() {
    setTheme(t => t === "dark" ? "light" : "dark");
  }

  function handleAuth(t) {
    setToken(t);
  }

  if (validating) {
    return (
      <>
        <style>{MASTER_CSS_VARS + BASE_STYLES}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid rgba(212,175,55,0.2)", borderTopColor: "#D4AF37",
            animation: "m-spin 0.7s linear infinite",
          }} />
        </div>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <style>{MASTER_CSS_VARS + BASE_STYLES}</style>
        <MasterLogin onAuth={handleAuth} />
      </>
    );
  }

  return (
    <>
      <style>{MASTER_CSS_VARS + BASE_STYLES}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>

        <SidebarMaster
          nav={NAV}
          activePage={page}
          onNavigate={setPage}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          kycBadge={kycBadge}
        />

        <main style={{
          flex: 1,
          padding: "32px 36px",
          overflowX: "hidden",
          minWidth: 0,
          minHeight: "100vh",
        }}>
          <div
            className="m-page"
            key={page}
            style={{ maxWidth: 1080 }}
          >
            {renderPage(page)}
          </div>
        </main>
      </div>
    </>
  );
}
