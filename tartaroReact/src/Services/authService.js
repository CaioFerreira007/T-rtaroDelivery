import axiosConfig from "./axiosConfig";

export const login = async (email, senha) => {
  try {
    // Validações locais primeiro
    if (!email || !senha) {
      throw new Error("Email e senha são obrigatórios.");
    }
    if (!isValidEmail(email)) {
      throw new Error("Email inválido.");
    }
    if (senha.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres.");
    }

    const { data } = await axiosConfig.post("/auth/login", { 
      email: email.trim().toLowerCase(), 
      senha 
    });

    if (data.token && data.user) {
      const usuarioFormatado = {
        id: data.user.id,
        nome: data.user.nome,
        email: data.user.email,
        telefone: data.user.telefone,
        tipo: data.user.role?.toUpperCase().trim() || "CLIENTE",
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(usuarioFormatado));
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      
      return usuarioFormatado;
    }
    throw new Error("Resposta da API inválida após o login.");
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      let msg = errorData?.message || (typeof errorData === 'string' && errorData) || error.message;
      if (status === 401 || status === 404) msg = "Email ou senha incorretos.";
      throw new Error(msg);
    }
    throw error;
  }
};

export const register = async (dadosCadastro) => {
  try {
    if (!dadosCadastro.nome || dadosCadastro.nome.trim().length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres.");
    if (!dadosCadastro.email || !isValidEmail(dadosCadastro.email)) throw new Error("Email inválido.");
    if (!dadosCadastro.senha || dadosCadastro.senha.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres.");

    const dadosParaEnvio = {
      nome: dadosCadastro.nome.trim(),
      email: dadosCadastro.email.toLowerCase().trim(),
      telefone: dadosCadastro.telefone.replace(/\D/g, ""),
      senha: dadosCadastro.senha,
      endereco: dadosCadastro.endereco.trim(),
    };

    const { data } = await axiosConfig.post("/auth/register", dadosParaEnvio);

    if (data.token && data.user) {
      const usuarioFormatado = {
        id: data.user.id,
        nome: data.user.nome,
        email: data.user.email,
        telefone: data.user.telefone,
        tipo: data.user.role?.toUpperCase().trim() || "CLIENTE",
      };
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(usuarioFormatado));
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      
      return { user: usuarioFormatado, token: data.token };
    }
    throw new Error("Resposta da API inválida após o registro.");
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      if (status === 409) throw new Error("Email ou telefone já cadastrado.");
      let msg = errorData?.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData?.message || (typeof errorData === 'string' && errorData));
      throw new Error(msg || "Erro ao realizar cadastro.");
    }
    throw error;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    console.log("Logout local realizado");
  } catch (error) {
    console.error("Erro no logout:", error);
  }
};

export const logoutFromServer = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await axiosConfig.post("/auth/logout", { token: refreshToken });
    }
  } catch (error) {
    console.error("Erro no logout do servidor:", error);
  } finally {
    logout();
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) {
    return false;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) {
      logout();
      return false;
    }
    return true;
  } catch (error) {
    logout();
    return false;
  }
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

export const updateCurrentUser = (userData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("Usuário não encontrado no localStorage");
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const refreshTokenValue = localStorage.getItem("refreshToken");
    if (!refreshTokenValue) throw new Error("Refresh token não encontrado");

    const { data } = await axiosConfig.post("/auth/refresh", { token: refreshTokenValue });
    if (data.token) {
      localStorage.setItem("token", data.token);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      return data.token;
    }
    throw new Error("Erro ao renovar token");
  } catch (error) {
    logout();
    const publicPaths = ['/login', '/cadastro', '/'];
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.href = "/login";
    }
    throw error;
  }
};

export const getToken = () => {
  return localStorage.getItem("token");
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (telefone) => {
  const nums = telefone.replace(/\D/g, "");
  if (nums.length < 10 || nums.length > 11) return false;
  const ddd = parseInt(nums.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (nums.length === 11) return nums.charAt(2) === '9';
  if (nums.length === 10) return nums.charAt(2) !== '9';
  return false;
};

export const testConnection = async () => {
  try {
    const response = await axiosConfig.get("/auth/test");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message, details: error.response?.data };
  }
};

export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
};

export const isTokenExpiringSoon = () => {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload?.exp) return false;
  const timeUntilExpiry = payload.exp - (Date.now() / 1000);
  return timeUntilExpiry < 900; // 15 minutos
};

export const testLogin = async () => {
  try {
    await login("teste@teste.com", "123456");
    return "Login de teste funcionou (inesperado)";
  } catch (error) {
    return `Erro esperado no login de teste: ${error.message}`;
  }
};