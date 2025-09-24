import axiosConfig from "./axiosConfig";

export const getProdutos = async (page = 1, pageSize = 10) => {
  try {
    const { data } = await axiosConfig.get(
      `/produtos?page=${page}&pageSize=${pageSize}`
    );

    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.items)) {
      return data.items;
    }

    console.warn("Resposta inesperada de getProdutos:", data);
    return [];
  } catch (error) {
    console.error("Erro em getProdutos:", error);
    return [];
  }
};

export const getProdutoById = async (id) => {
  try {
    const { data } = await axiosConfig.get(`/produtos/${id}`);
    return data;
  } catch (error) {
    console.error("Erro em getProdutoById:", error);
    return null;
  }
};

export const createProduto = async (formData) => {
  try {
    const { data } = await axiosConfig.post("/produtos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    console.error("Erro em createProduto:", error);
    return null;
  }
};

export const updateProduto = async (id, formData) => {
  try {
    const { data } = await axiosConfig.put(`/produtos/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    console.error("Erro em updateProduto:", error);
    return null;
  }
};
