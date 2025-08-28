import axiosConfig from "axios";

export async function buscarMeusPedidos() {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("Usuário não autenticado.");

  const response = await axiosConfig.get(
    "http://localhost:5000/api/pedido/meus",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
