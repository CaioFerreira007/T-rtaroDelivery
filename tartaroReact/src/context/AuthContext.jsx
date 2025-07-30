import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    try {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        setUsuarioLogado(JSON.parse(localUser));
      }
    } catch (error) {
      console.error("Erro ao carregar usuário do localStorage:", error);
      setUsuarioLogado(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado }}>
      {children}
    </AuthContext.Provider>
  );
};
