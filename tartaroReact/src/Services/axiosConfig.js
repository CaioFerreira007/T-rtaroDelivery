import axios from "axios";

// Função para buscar o token salvo (se existir)
const getToken = () => localStorage.getItem("token");

// Criação da instância Axios com configurações base
const axiosConfig = axios.create({
  baseURL: "https://tartarodelivery.com.br/api",
  withCredentials: true, // IMPORTANTE: Necessário para CORS com credenciais
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar token JWT automaticamente
axiosConfig.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da requisição para debug
    console.log(`[AXIOS] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data && config.method !== 'get') {
      console.log('[AXIOS] Dados enviados:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error("Erro ao configurar requisição:", error);
    return Promise.reject(error);
  }
);

// Interceptor para capturar erros globais
axiosConfig.interceptors.response.use(
  (response) => {
    // Log da resposta para debug
    console.log(`[AXIOS] Resposta ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const data = error.response?.data;

    // Log detalhado do erro
    console.error(`[AXIOS] Erro ${status} em ${url}:`, {
      status,
      data,
      message: error.message,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data
      }
    });

    // Tratamento específico para diferentes códigos de erro
    switch (status) {
      case 401:
        console.warn("Token expirado ou inválido. Limpando dados de auth...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        
        // Redirecionar para login apenas se não estiver já na página de login/cadastro
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/cadastro' &&
            window.location.pathname !== '/') {
          window.location.href = "/login";
        }
        break;
        
      case 403:
        console.warn("Acesso negado - permissões insuficientes");
        break;
        
      case 404:
        console.warn(`Endpoint não encontrado: ${url}`);
        break;
        
      case 500:
        console.error("Erro interno do servidor");
        break;
        
      case 0:
      case undefined:
        console.error("Erro de conexão/rede - servidor pode estar fora do ar");
        break;
        
      default:
        console.error(`Erro HTTP ${status}`);
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;