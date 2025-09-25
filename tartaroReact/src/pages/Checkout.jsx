import React, { useEffect, useState } from "react";
import { Container, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [carregandoCarrinho, setCarregandoCarrinho] = useState(true);
  const navigate = useNavigate();
  const { usuarioLogado, loading: authLoading } = useAuth();

  useEffect(() => {
    // Roda apenas depois que a autenticação foi verificada e temos um usuário
    if (usuarioLogado) {
      const carrinhoKey = `carrinho_${usuarioLogado.id}`;
      const itensCarrinho = JSON.parse(localStorage.getItem(carrinhoKey)) || [];

      if (Array.isArray(itensCarrinho) && itensCarrinho.length > 0) {
        setCarrinho(itensCarrinho);
        const valorTotal = itensCarrinho.reduce(
          (acc, item) => acc + (Number(item.preco) || 0) * (Number(item.quantidade) || 1),
          0
        );
        setTotal(valorTotal);
      } else {
        setCarrinho([]);
        setTotal(0);
      }
      setCarregandoCarrinho(false);
    }
  }, [usuarioLogado]);

  const handleConfirmarPedido = () => {
    if (usuarioLogado) {
      localStorage.removeItem(`carrinho_${usuarioLogado.id}`);
    }
    setPedidoConfirmado(true);
    setCarrinho([]);
    setTotal(0);
    setTimeout(() => navigate("/home"), 2500);
  };

  if (authLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Verificando autenticação...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">🧾 Checkout</h2>
      {carregandoCarrinho ? (
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
                  Quantidade: {item.quantidade} | Valor: R$ {(item.preco * item.quantidade).toFixed(2)}
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