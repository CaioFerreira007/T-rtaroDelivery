// PedidoService.js
import axiosConfig from "./axiosConfig";

export async function buscarMeusPedidos() {
  try {
    const response = await axiosConfig.get("/pedido/meus");
    console.log(" Pedidos recebidos:", response.data);
    return response.data;
  } catch (error) {
    console.error(" Erro ao buscar meus pedidos:", error);
    console.error("Status:", error.response?.status);
    console.error("Mensagem:", error.response?.data);

    throw new Error(
      error.response?.data?.message || error.message || "Erro ao buscar pedidos"
    );
  }
}

export async function buscarDetalhesPedido(pedidoId) {
  try {
    console.log(` Buscando detalhes do pedido ${pedidoId}...`);
    const response = await axiosConfig.get(`/pedido/${pedidoId}`);
    console.log(` Detalhes do pedido ${pedidoId}:`, response.data);
    console.log(` Itens encontrados:`, response.data.itens?.length || 0);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido ${pedidoId}:`, error);
    console.error("Status HTTP:", error.response?.status);
    console.error("Dados do erro:", error.response?.data);
    console.error("Mensagem:", error.message);

    // Mensagens específicas por tipo de erro
    if (error.response?.status === 403) {
      throw new Error(
        "Você não tem permissão para ver os detalhes deste pedido."
      );
    }

    if (error.response?.status === 404) {
      throw new Error("Pedido não encontrado.");
    }

    if (error.response?.status === 401) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (error.response?.status === 500) {
      throw new Error(
        error.response?.data?.error ||
          "Erro no servidor ao buscar detalhes do pedido."
      );
    }

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Não foi possível carregar os itens do pedido."
    );
  }
}
