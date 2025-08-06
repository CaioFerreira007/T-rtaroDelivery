// axiosConfig.js
import axios from "axios";

// 🔐 Função para buscar o token salvo (se existir)
const getToken = () => localStorage.getItem("token");

// 🌐 Criação da instância Axios com configurações base
const axiosConfig = axios.create({
  baseURL: "http://localhost:5120/api", // ⚠️ Troque para URL de produção quando necessário
  timeout: 10000, // ⏱ Tempo limite de 10 segundos
  // ❌ Não defina Content-Type aqui — o Axios cuidará disso automaticamente
});

// 🔄 Interceptor de requisição: adiciona token JWT automaticamente
axiosConfig.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Erro ao configurar requisição:", error);
    return Promise.reject(error);
  }
);

// 🚨 Interceptor de resposta: captura erros globais
axiosConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 💡 Exemplo: redirecionar para login se token expirou
    if (status === 401 || status === 403) {
      console.warn("Acesso negado. Redirecionando para login...");
      // window.location.href = "/login"; // descomente se quiser redirecionar automaticamente
    }

    console.error("AXIOS ERRO →", error.response || error);
    return Promise.reject(error);
  }
);

export default axiosConfig;
