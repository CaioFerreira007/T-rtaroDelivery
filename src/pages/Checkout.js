import React, { useEffect, useState } from "react";
import { Container, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Checkout() {
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Tenta recuperar carrinho do localStorage
    const itensCarrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    if (Array.isArray(itensCarrinho) && itensCarrinho.length > 0) {
      setCarrinho(itensCarrinho);

      const valorTotal = itensCarrinho.reduce((acc, item) => {
        const preco = Number(item.preco) || 0;
        const qtd = Number(item.quantidade) || 1;
        return acc + preco * qtd;
      }, 0);

      setTotal(valorTotal);
    } else {
      setCarrinho([]);
      setTotal(0);
    }

    setCarregando(false);
  }, []);

  const handleConfirmarPedido = () => {
    // Simula envio de pedido
    localStorage.removeItem("carrinho");
    setPedidoConfirmado(true);
    setCarrinho([]);
    setTotal(0);
    setTimeout(() => navigate("/"), 2500);
  };

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">🧾 Checkout</h2>

      {carregando ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando carrinho...</p>
        </div>
      ) : pedidoConfirmado ? (
        <Alert variant="success" className="text-center">
          Pedido confirmado com sucesso! 🎉 Estamos preparando sua delícia!
        </Alert>
      ) : carrinho.length === 0 ? (
        <Alert variant="warning" className="text-center">
          Seu carrinho está vazio 😕
        </Alert>
      ) : (
        <>
          {carrinho.map((item, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <Card.Title>{item.nome}</Card.Title>
                <Card.Text>
                  Quantidade: {item.quantidade} | Valor: R${" "}
                  {(item.preco * item.quantidade).toFixed(2)}
                </Card.Text>
              </Card.Body>
            </Card>
          ))}

          <h4 className="text-end">💸 Total: R$ {total.toFixed(2)}</h4>

          <Button
            variant="success"
            className="w-100 mt-4"
            onClick={handleConfirmarPedido}
          >
            ✅ Confirmar Pedido
          </Button>
        </>
      )}
    </Container>
  );
}

export default Checkout;
