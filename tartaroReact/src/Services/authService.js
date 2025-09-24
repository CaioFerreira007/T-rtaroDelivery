import axiosConfig from "./axiosConfig";

export const login = async (email, senha) => {
  try {
    console.log("=== INICIANDO LOGIN ===");
    console.log("Email:", email);

    const response = await axiosConfig.post("/auth/login", { 
      email: email.trim().toLowerCase(), 
      senha 
    });

    console.log("Resposta do login:", response.data);

    if (response.data && response.data.token && response.data.user) {
      const usuarioFormatado = {
        id: response.data.user.id,
        nome: response.data.user.nome,
        email: response.data.user.email,
        telefone: response.data.user.telefone,
        tipo: response.data.user.role?.toUpperCase().trim() || "CLIENTE",
      };

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(usuarioFormatado));
      
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      console.log("Login bem-sucedido:", usuarioFormatado);
      return usuarioFormatado;
    }

    throw new Error("Resposta da API inválida após o login.");
  } catch (error) {
    console.error("Erro no login:", error);
    
    if (error.response) {
      const errorMessage = error.response.data;
      throw new Error(typeof errorMessage === 'string' ? errorMessage : "E-mail ou senha incorretos.");
    }
    
    throw new Error("Erro de conexão. Verifique sua internet.");
  }
};

export const register = async (dadosCadastro) => {
  try {
    // Validações do frontend
    if (!dadosCadastro.nome || dadosCadastro.nome.trim().length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres.");
    }

    if (!dadosCadastro.email || !isValidEmail(dadosCadastro.email)) {
      throw new Error("Email inválido.");
    }

    if (!dadosCadastro.senha || dadosCadastro.senha.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres.");
    }

    // Processar telefone - remover formatação
    let telefoneNumeros = "";
    if (dadosCadastro.telefone) {
      telefoneNumeros = dadosCadastro.telefone.replace(/\D/g, "");
    }
    
    // Validar telefone - deve ter 11 dígitos (DDD + 9 dígitos)
    if (!telefoneNumeros || telefoneNumeros.length !== 11) {
      throw new Error("Telefone deve ter 11 dígitos (DDD + número). Ex: 21987654321");
    }

    const dadosParaEnvio = {
      nome: dadosCadastro.nome.trim(),
      email: dadosCadastro.email.toLowerCase().trim(),
      telefone: telefoneNumeros,
      senha: dadosCadastro.senha
    };

    console.log("Enviando dados para registro:", { 
      ...dadosParaEnvio, 
      senha: "***",
      telefoneOriginal: dadosCadastro.telefone
    });

    const response = await axiosConfig.post("/auth/register", dadosParaEnvio);

    console.log("Resposta do registro:", response.data);

    if (response.data && response.data.token && response.data.user) {
      const usuarioFormatado = {
        id: response.data.user.id,
        nome: response.data.user.nome,
        email: response.data.user.email,
        telefone: response.data.user.telefone,
        tipo: response.data.user.role?.toUpperCase().trim() || "CLIENTE",
      };
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(usuarioFormatado));
      
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      
      console.log("Usuário cadastrado:", usuarioFormatado);
      return usuarioFormatado;
    }

    throw new Error("Resposta da API inválida após o registro.");
  } catch (error) {
    console.error("Erro no registro:", error);
    
    if (error.response) {
      const errorMessage = error.response.data;
      throw new Error(typeof errorMessage === 'string' ? errorMessage : "Erro no servidor.");
    }
    
    // Se é um erro que já foi tratado acima (validações), mantém a mensagem
    if (error.message && !error.response) {
      throw error;
    }
    
    throw new Error("Erro de conexão. Verifique sua internet.");
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Erro ao obter usuário do localStorage:", error);
    return null;
  }
};

export const updateCurrentUser = (userData) => {
  try {
    const currentUser = getCurrentUser();
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

// Função auxiliar para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};