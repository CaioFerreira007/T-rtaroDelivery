import axiosConfig from "./axiosConfig";

export const getProdutos = async (page = 1, pageSize = 100) => {
  try {
    const { data } = await axiosConfig.get(
      `/produtos?page=${page}&pageSize=${pageSize}`
    );

    console.log("📦 Resposta bruta do getProdutos:", data);

    // 1️⃣ Caso a API já retorne um array diretamente
    if (Array.isArray(data)) {
      return data;
    }

    // 2️⃣ Caso a API use 'items'
    if (data && Array.isArray(data.items)) {
      return data.items;
    }

    // 3️⃣ Caso a API use 'data.items'
    if (data?.data && Array.isArray(data.data.items)) {
      return data.data.items;
    }

    // 4️⃣ Caso a API use 'produtos'
    if (data?.produtos && Array.isArray(data.produtos)) {
      return data.produtos;
    }

    // 5️⃣ Caso a API use 'data' como array
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    console.warn("⚠️ Resposta inesperada de getProdutos:", data);
    return [];
  } catch (error) {
    console.error("❌ Erro em getProdutos:", error);
    return [];
  }
};

export const getProdutoById = async (id) => {
  try {
    const { data } = await axiosConfig.get(`/produtos/${id}`);
    return data;
  } catch (error) {
    console.error("❌ Erro em getProdutoById:", error);
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
    console.error("❌ Erro em createProduto:", error);
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
    console.error("❌ Erro em updateProduto:", error);
    return null;
  }
};