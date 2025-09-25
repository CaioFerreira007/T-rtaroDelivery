import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, logout as logoutService, isAuthenticated } from '../services/authService';

// Criar o Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await isAuthenticated();
        
        if (isAuth) {
          // Recuperar dados do usuário do localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            setUsuarioLogado(user);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Limpar dados inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email, senha) => {
    try {
      setIsLoading(true);
      const response = await loginService(email, senha);
      
      if (response.user) {
        setUsuarioLogado(response.user);
        setIsLoggedIn(true);
        
        // Salvar no localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Sempre limpar o estado local, mesmo se houver erro no servidor
      setUsuarioLogado(null);
      setIsLoggedIn(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = (userData) => {
    setUsuarioLogado(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('user');
      setIsLoggedIn(false);
    }
  };

  // Valor do contexto
  const contextValue = {
    // Estados
    usuarioLogado,
    isLoading,
    isLoggedIn,
    
    // Funções principais
    login,
    logout,
    
    // Funções de compatibilidade (para diferentes padrões de nomenclatura)
    setUsuarioLogado: updateUser,
    setUser: updateUser,
    user: usuarioLogado,
    
    // Funções auxiliares
    updateUser,
    
    // Verificações
    isAuthenticated: () => isLoggedIn && usuarioLogado
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

// Exportar o Context também para uso com useContext
export { AuthContext };

// Exportar como default o Provider
export default AuthProvider;