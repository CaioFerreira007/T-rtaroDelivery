import axiosConfig from "./axiosConfig";

export const getProdutos = async (page = 1, pageSize = 100) => {
  try {
    const { data } = await axiosConfig.get(
      `/produtos?page=${page}&pageSize=${pageSize}`
    );

<<<<<<< HEAD
    // console.log(" Resposta bruta do getProdutos:", data);

    //  Caso a API já retorne um array diretamente
=======
    console.log(" Resposta bruta do getProdutos:", data);

>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
    if (Array.isArray(data)) {
      return data;
    }

<<<<<<< HEAD
    //  Caso a API use 'items'
=======
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
    if (data && Array.isArray(data.items)) {
      return data.items;
    }

<<<<<<< HEAD
    //  Caso a API use 'data.items'
=======
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
    if (data?.data && Array.isArray(data.data.items)) {
      return data.data.items;
    }

<<<<<<< HEAD
    // 4️Caso a API use 'produtos'
=======
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
    if (data?.produtos && Array.isArray(data.produtos)) {
      return data.produtos;
    }

<<<<<<< HEAD
    // 5️ Caso a API use 'data' como array
=======
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    console.warn(" Resposta inesperada de getProdutos:", data);
    return [];
  } catch (error) {
<<<<<<< HEAD
    console.error(" Erro em getProdutos:", error);
=======
    console.error("Erro em getProdutos:", error);
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
    return [];
  }
};

export const getProdutoById = async (id) => {
  try {
    const { data } = await axiosConfig.get(`/produtos/${id}`);
    return data;
  } catch (error) {
    console.error(" Erro em getProdutoById:", error);
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
    console.error(" Erro em createProduto:", error);
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
    console.error(" Erro em updateProduto:", error);
    return null;
  }
};
