import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuariologado, setUsuarioLogado] = useState(null);

  // Carregar usuário inicial do localStorage
  useEffect(() => {
    try {
      const localUser = localStorage.getItem("user");
      const parsedUser = JSON.parse(localUser);

      if (parsedUser && typeof parsedUser === "object" && parsedUser.tipo) {
        setUsuarioLogado(parsedUser);
      } else {
        setUsuarioLogado(null);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário do localStorage:", error);
      setUsuarioLogado(null);
    }
  }, []);

  // Sincronizar se localStorage mudar em outra aba
  useEffect(() => {
    const syncUser = () => {
      const localUser = localStorage.getItem("user");
      try {
        const parsedUser = JSON.parse(localUser);
        setUsuarioLogado(parsedUser);
      } catch {
        setUsuarioLogado(null);
      }
    };

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  return (
    <AuthContext.Provider value={{ usuariologado, setUsuarioLogado }}>
      {children}
    </AuthContext.Provider>
  );
};
