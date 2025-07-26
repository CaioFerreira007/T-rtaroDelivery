import React, { useEffect, useState } from "react";
import { buscarMeusPedidos } from "../Services/PedidoService";

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    buscarMeusPedidos()
      .then(setPedidos)
      .catch((err) => alert("Erro ao carregar pedidos: " + err.message));
  }, []);

  return (
    <div>
      <h2>📦 Meus Pedidos</h2>
      {pedidos.length === 0 && <p>Você ainda não fez nenhum pedido.</p>}

      {pedidos.map((pedido) => (
        <div
          key={pedido.id}
          style={{ borderBottom: "1px solid #ccc", marginBottom: "1rem" }}
        >
          <p>
            <strong>Status:</strong> {pedido.status}
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {new Date(pedido.dataPedido).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p>
            <strong>Pagamento:</strong> R${" "}
            {pedido.pagamento?.valorTotal.toFixed(2)} via{" "}
            {pedido.pagamento?.formaPagamento}
          </p>
          <p>
            <strong>Itens:</strong>
          </p>
          <ul>
            {pedido.itens.map((item) => (
              <li key={item.id}>
                {item.produto?.nome} x {item.quantidade}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
