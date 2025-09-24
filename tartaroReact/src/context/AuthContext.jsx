import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginService, register as registerService, logout as logoutService } from '../Services/authService';
import axiosConfig from '../Services/axiosConfig';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // Função para carregar o usuário do localStorage na primeira vez que a página abre
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        axiosConfig.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      // Limpa dados corrompidos
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const userData = await loginService(email, password);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (registerData) => {
    const userData = await registerService(registerData);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
    delete axiosConfig.defaults.headers.common['Authorization'];
    // Redirecionar para home ou login, pode ser feito no componente que chama o logout
  }, []);

  // O "value" é o que os componentes filhos poderão acessar
  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.tipo === 'ADM',
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};