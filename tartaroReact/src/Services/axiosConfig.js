// axiosConfig.js
import axios from "axios";

// Função para buscar o token salvo (se existir)
const getToken = () => localStorage.getItem("token");

const axiosConfig = axios.create({
  baseURL: "http://localhost:5120/api", // ✅ Ajuste conforme sua API
  timeout: 10000, // ⏱ Tempo limite de 10 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token em todas as requisições
axiosConfig.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para capturar respostas com erro
axiosConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("AXIOS ERRO →", error.response || error);
    return Promise.reject(error);
  }
);

export default axiosConfig;
