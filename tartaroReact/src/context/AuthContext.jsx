import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout } from "../Services/authService";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");
      if (token && userString) {
        setUsuarioLogado(JSON.parse(userString));
      }
    } catch (error) {
      console.error("Erro ao carregar dados de autenticação do localStorage:", error);
      apiLogout(); // Limpa localStorage se estiver corrompido
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, senha) => {
    const usuario = await apiLogin(email, senha);
    setUsuarioLogado(usuario);
    return usuario;
  };

  const register = async (dadosCadastro) => {
    const { user } = await apiRegister(dadosCadastro);
    setUsuarioLogado(user);
    return user;
  };

  const logout = () => {
    apiLogout();
    setUsuarioLogado(null);
  };

  const atualizarUsuario = useCallback((novosDados) => {
    const usuarioAtualizado = { ...usuarioLogado, ...novosDados };
    localStorage.setItem("user", JSON.stringify(usuarioAtualizado));
    setUsuarioLogado(usuarioAtualizado);
  }, [usuarioLogado]);

  const value = {
    usuarioLogado,
    loading,
    login,
    register,
    logout,
    atualizarUsuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};