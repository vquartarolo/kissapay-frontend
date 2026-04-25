import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import C from "./constants/colors";
import useIsMobile from "./hooks/useIsMobile";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";

import DashboardPage from "./pages/Dashboard";
import RecebimentosPage from "./pages/Recebimentos";
import CriarPixPage from "./pages/CriarPix";
import CriarCriptoPage from "./pages/CriarCripto";
import SacarPage from "./pages/Sacar";
import HistoricoPage from "./pages/Historico";
import ApiKeysPage from "./pages/ApiKeys";
import LoginPage from "./pages/Login";
import VerifyEmailPage from "./pages/VerifyEmail";

import ConfiguracoesHome from "./pages/configuracoes/ConfiguracoesHome";
import ConfiguracoesVerificacao from "./pages/configuracoes/ConfiguracoesVerificacao";
import ConfiguracoesSeguranca from "./pages/configuracoes/ConfiguracoesSeguranca";
import ConfiguracoesDados from "./pages/configuracoes/ConfiguracoesDados";
import IntegracoesHub from "./pages/configuracoes/integracoes/IntegracoesHub";
import IntegracaoDetalhe from "./pages/configuracoes/integracoes/IntegracaoDetalhe";
import DominiosPage from "./pages/dominios/DominiosPage";

import WalletPage from "./pages/Wallet";
import ProdutosList from "./pages/produtos/ProdutosList";
import ProdutoForm from "./pages/produtos/ProdutoForm";
import CheckoutBuilder from "./pages/builder/CheckoutBuilder";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import PayPage from "./pages/PayPage";
import CheckoutsList from "./pages/checkouts/CheckoutsList";
import AdminKycPage from "./pages/admin/AdminKyc";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawals";
import AdminManagePage from "./pages/admin/AdminManage";
import AdminAuditPage from "./pages/admin/AdminAudit";
import AdminConfigPage from "./pages/admin/AdminConfig";
import AdminDashboardPage from "./pages/admin/AdminDashboard";
import AdminApprovalsPage   from "./pages/admin/AdminApprovals";
import AdminAccountingPage  from "./pages/admin/AdminAccounting";
import AdminCompliancePage  from "./pages/admin/AdminCompliance";

// Domínios próprios da plataforma — nunca tratados como domínios de clientes
const _OWN_HOSTNAMES = new Set(["localhost", "127.0.0.1", "siteorionpay.vercel.app"]);
const _IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;
const _h = window.location.hostname;
const IS_CUSTOM_DOMAIN =
  !_OWN_HOSTNAMES.has(_h) && !_IP_REGEX.test(_h) && !_h.endsWith(".vercel.app");

const GLOBAL_STYLES = `
  :root {
    --c-bg:            #09090B;
    --c-sidebar:       #0B0B0E;
    --c-card:          #141417;
    --c-card-soft:     #1C1C21;
    --c-input-deep:    #07090D;
    --c-border:        rgba(255,255,255,0.07);
    --c-border-strong: rgba(255,255,255,0.14);
    --c-text-primary:   #FFFFFF;
    --c-text-secondary: #E8EEF5;
    --c-text-muted:     #5A6A7E;
    --c-text-dim:       #2D3A48;
  }
  :root[data-theme="light"] {
    --c-bg:            #F1F5F9;
    --c-sidebar:       #FFFFFF;
    --c-card:          #FFFFFF;
    --c-card-soft:     #F8FAFC;
    --c-input-deep:    #FFFFFF;
    --c-border:        rgba(0,0,0,0.08);
    --c-border-strong: rgba(0,0,0,0.16);
    --c-text-primary:   #0F172A;
    --c-text-secondary: #1E293B;
    --c-text-muted:     #64748B;
    --c-text-dim:       #94A3B8;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--c-bg);
    color: var(--c-text-primary);
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--c-bg); }
  ::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--c-text-dim); }

  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

  input, select, textarea { color: var(--c-text-primary); }
  input::placeholder, textarea::placeholder { color: var(--c-text-dim); }

  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.4);
    cursor: pointer;
  }

  button { cursor: pointer; }
  button:active { transform: scale(0.98); }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .page { animation: fadeIn 0.22s ease forwards; }
`;

function AdminRoute({ user, isMobile, allowAuditOnly = false, children }) {
  const role = String(user?.role || "").toLowerCase();
  const allowedRoles = ["moderator", "super_moderator", "admin", "master"];
  const auditRoles = ["admin", "master"];

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowAuditOnly && !auditRoles.includes(role)) {
    return <Navigate to="/admin/kyc" replace />;
  }

  return children(isMobile);
}

function AppRoutes({ isMobile, user }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<DashboardPage isMobile={isMobile} />} />
      <Route path="/recebimentos" element={<RecebimentosPage isMobile={isMobile} />} />
      <Route path="/wallet" element={<WalletPage isMobile={isMobile} />} />
      <Route path="/produtos" element={<ProdutosList isMobile={isMobile} />} />
      <Route path="/produtos/novo" element={<ProdutoForm isMobile={isMobile} />} />
      <Route path="/produtos/:id" element={<ProdutoForm isMobile={isMobile} />} />
      <Route path="/checkouts" element={<CheckoutsList isMobile={isMobile} />} />
      <Route path="/builder/new" element={<CheckoutBuilder />} />
      <Route path="/builder/:checkoutId" element={<CheckoutBuilder />} />
      <Route path="/cobrancas/pix" element={<CriarPixPage isMobile={isMobile} />} />
      <Route path="/cobrancas/cripto" element={<CriarCriptoPage isMobile={isMobile} />} />
      <Route path="/saque/cripto" element={<SacarPage isMobile={isMobile} />} />
      <Route path="/saque/pix" element={<SacarPage isMobile={isMobile} />} />
      <Route path="/historico-saques" element={<HistoricoPage isMobile={isMobile} />} />
      <Route path="/api-keys" element={<ApiKeysPage isMobile={isMobile} />} />
      <Route path="/configuracoes" element={<ConfiguracoesHome isMobile={isMobile} />} />
      <Route path="/configuracoes/dados" element={<ConfiguracoesDados isMobile={isMobile} />} />
      <Route path="/configuracoes/seguranca" element={<ConfiguracoesSeguranca isMobile={isMobile} />} />
      <Route path="/configuracoes/verificacao" element={<ConfiguracoesVerificacao isMobile={isMobile} />} />
      <Route path="/integracoes" element={<IntegracoesHub isMobile={isMobile} />} />
      <Route path="/integracoes/:id" element={<IntegracaoDetalhe isMobile={isMobile} />} />
      <Route path="/dominios" element={<DominiosPage isMobile={isMobile} />} />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute user={user} isMobile={isMobile}>
            {(mobile) => <AdminDashboardPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/kyc"
        element={
          <AdminRoute user={user} isMobile={isMobile}>
            {(mobile) => <AdminKycPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <AdminRoute user={user} isMobile={isMobile}>
            {(mobile) => <AdminWithdrawalsPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/manage"
        element={
          <AdminRoute user={user} isMobile={isMobile}>
            {(mobile) => <AdminManagePage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <AdminRoute user={user} isMobile={isMobile} allowAuditOnly>
            {(mobile) => <AdminAuditPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/config"
        element={
          <AdminRoute user={user} isMobile={isMobile} allowAuditOnly>
            {(mobile) => <AdminConfigPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <AdminRoute user={user} isMobile={isMobile}>
            {(mobile) => <AdminApprovalsPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/accounting"
        element={
          <AdminRoute user={user} isMobile={isMobile}>
            {(mobile) => <AdminAccountingPage isMobile={mobile} />}
          </AdminRoute>
        }
      />
      <Route
        path="/admin/compliance"
        element={
          <AdminRoute user={user} isMobile={isMobile} allowAuditOnly>
            {(mobile) => <AdminCompliancePage isMobile={mobile} />}
          </AdminRoute>
        }
      />

      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const { token, loading, user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isVerifyEmailPage = location.pathname === "/verify-email";
  const isBuilderPage = location.pathname.startsWith("/builder");
  const isCheckoutPage = location.pathname.startsWith("/c/");
  const isPayPage = location.pathname.startsWith("/pay/");

  useEffect(() => {
    if (location.pathname === "/") return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  if (loading) {
    return (
      <ThemeProvider>
        <style>{GLOBAL_STYLES}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.bg,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `3px solid ${C.border}`,
              borderTopColor: C.green,
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </ThemeProvider>
    );
  }

  if (isVerifyEmailPage) {
    return (
      <ThemeProvider>
        <style>{GLOBAL_STYLES}</style>
        <VerifyEmailPage />
      </ThemeProvider>
    );
  }

  // Domínio customizado de cliente — serve apenas a CheckoutPage, sem autenticação ou sidebar
  if (IS_CUSTOM_DOMAIN) {
    return (
      <ThemeProvider>
        <style>{GLOBAL_STYLES}</style>
        <Routes>
          <Route path="/" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  if (isCheckoutPage) {
    return (
      <ThemeProvider>
        <style>{GLOBAL_STYLES}</style>
        <Routes>
          <Route path="/c/:slug" element={<CheckoutPage />} />
        </Routes>
      </ThemeProvider>
    );
  }

  if (isPayPage) {
    return (
      <ThemeProvider>
        <style>{GLOBAL_STYLES}</style>
        <Routes>
          <Route path="/pay/:id" element={<PayPage />} />
        </Routes>
      </ThemeProvider>
    );
  }

  if (!token) {
    return (
      <ThemeProvider>
        <style>{GLOBAL_STYLES}</style>
        <LoginPage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", display: "flex" }}>
        {!isMobile && !isBuilderPage && <Sidebar />}

        <main
          style={{
            flex: 1,
            padding: isBuilderPage ? 0 : isMobile ? "20px 18px 90px" : "32px 36px",
            overflowX: "hidden",
            minWidth: 0,
          }}
        >
          <div
            className="page"
            key={location.pathname}
            style={{
              maxWidth: isBuilderPage
                ? "100%"
                : location.pathname.startsWith("/admin")
                  ? (isMobile ? "100%" : 1280)
                  : (isMobile ? "100%" : 1080),
            }}
          >
            <AppRoutes isMobile={isMobile} user={user} />
          </div>
        </main>

        {isMobile && <BottomNav />}
      </div>
    </ThemeProvider>
  );
}
