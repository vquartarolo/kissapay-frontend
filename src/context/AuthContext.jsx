import { createContext, useContext, useState, useEffect } from "react";
import { getMe, getWallet } from "../services/user.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    if (!token) {
      setUser(null);
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const walletData = await getWallet();
      setWallet(walletData);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [token]);

  function saveToken(t) {
    localStorage.setItem("token", t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setWallet(null);
  }

  async function refreshWallet() {
    try {
      const walletData = await getWallet();
      setWallet(walletData);
      return walletData;
    } catch (err) {
      console.error("Erro ao atualizar wallet:", err);
      setWallet(null);
      return null;
    }
  }

  async function refreshProfile() {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
    }

    try {
      const walletData = await getWallet();
      setWallet(walletData);
    } catch (err) {
      console.error("Erro ao atualizar wallet no refreshProfile:", err);
      setWallet(null);
    }
  }

  // Merge parcial no user sem refetch — útil para updates otimistas
  function patchUser(fields) {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        wallet,
        loading,
        saveToken,
        logout,
        refreshWallet,
        refreshProfile,
        patchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}