import axiosConfig from "./axiosConfig";

// Função de Login
export const login = async (email, senha) => {
  const { data } = await axiosConfig.post("/auth/login", { email, senha });

  if (data.token && data.user) {
    // Formata o usuário para o padrão do frontend ('tipo')
    const usuarioFormatado = {
      ...data.user,
      tipo: data.user.role?.toUpperCase().trim(),
    };

    // Salva tudo no localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(usuarioFormatado));

    // Retorna o usuário formatado para o AuthContext
    return usuarioFormatado;
  }

  throw new Error("Resposta da API inválida após o login.");
};

// Função de Registro
export const register = async (dadosCadastro) => {
  const { data } = await axiosConfig.post("/auth/register", dadosCadastro);

  if (data.token && data.user) {
    const usuarioFormatado = {
      ...data.user,
      tipo: data.user.role?.toUpperCase().trim(),
    };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(usuarioFormatado));
    return usuarioFormatado;
  }

  throw new Error("Resposta da API inválida após o registro.");
};

// Função de Logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Adicione aqui outras funções de auth se necessário (esqueci-senha, etc.)
