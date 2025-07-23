import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../styles/BarraCarrinho.css"; // Estilos personalizados

function BarraCarrinho({ carrinho, atualizarQuantidade, limparCarrinho }) {
  const navigate = useNavigate();

  const total = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  if (carrinho.length === 0) return null;

  return (
    <div className="barra-carrinho fixed-bottom bg-white border-top shadow p-3">
      {/* Detalhes dos produtos */}
      {carrinho.map((item) => (
        <div
          key={item.id}
          className="d-flex justify-content-between align-items-center mb-2"
        >
          <div className="text-truncate me-2">
            <strong>{item.nome}</strong>
            <br />
            <small>R$ {item.preco.toFixed(2)} cada</small>
          </div>

          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => atualizarQuantidade(item.id, "-")}
            >
              –
            </Button>
            <span className="mx-2 fw-bold">{item.quantidade}</span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => atualizarQuantidade(item.id, "+")}
            >
              +
            </Button>
          </div>

          <span className="fw-bold text-success ms-3">
            R$ {(item.preco * item.quantidade).toFixed(2)}
          </span>
        </div>
      ))}

      <hr className="my-2" />

      {/* Total + Botões de ação */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Total: R$ {total.toFixed(2)}</strong>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-danger" onClick={limparCarrinho}>
            ❌ Cancelar
          </Button>
          <Button variant="success" onClick={() => navigate("/checkout")}>
            💳 Ir para pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BarraCarrinho;
