// src/services/produtoService.js

import axiosConfig from "./axiosConfig";

export const getProdutos = async (page = 1, pageSize = 10) => {
  const { data } = await axiosConfig.get(
    `/produtos?page=${page}&pageSize=${pageSize}`
  );
  return data;
};

export const getProdutoById = async (id) => {
  const { data } = await axiosConfig.get(`/produtos/${id}`);
  return data;
};

export const createProduto = async (formData) => {
  const { data } = await axiosConfig.post("/produtos", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const updateProduto = async (id, formData) => {
  const { data } = await axiosConfig.put(`/produtos/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
