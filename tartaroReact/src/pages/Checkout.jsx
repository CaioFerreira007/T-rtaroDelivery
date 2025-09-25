
import React, { useEffect, useState } from "react";
import { Container, Card, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [carregandoCarrinho, setCarregandoCarrinho] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const navigate = useNavigate();
  const { usuarioLogado, loading: authLoading, isLoggedIn, isInitialized } = useAuth();

  useEffect(() => {
    // Redirecionar se não estiver logado
    if (isInitialized && !isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }

    // Carregar carrinho apenas se usuário estiver disponível
    if (usuarioLogado?.id) {
      try {
        const carrinhoKey = `carrinho_${usuarioLogado.id}`;
        const itensCarrinho = JSON.parse(localStorage.getItem(carrinhoKey) || '[]');

        if (Array.isArray(itensCarrinho) && itensCarrinho.length > 0) {
          // Validar itens do carrinho
          const itensValidos = itensCarrinho.filter(item => 
            item && item.id && item.nome && typeof item.preco === 'number' && item.quantidade > 0
          );
          
          setCarrinho(itensValidos);
          const valorTotal = itensValidos.reduce(
            (acc, item) => acc + (item.preco * item.quantidade), 0
          );
          setTotal(valorTotal);
        } else {
          setCarrinho([]);
          setTotal(0);
        }
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        setCarrinho([]);
        setTotal(0);
      }
      setCarregandoCarrinho(false);
    }
  }, [usuarioLogado, isInitialized, isLoggedIn, navigate]);

  const handleConfirmarPedido = async () => {
    if (!usuarioLogado?.id || carrinho.length === 0) return;

    setConfirmando(true);
    try {
      // Simular processamento do pedido
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpar carrinho
      localStorage.removeItem(`carrinho_${usuarioLogado.id}`);
      setPedidoConfirmado(true);
      setCarrinho([]);
      setTotal(0);
      
      // Redirecionar após delay
      setTimeout(() => navigate("/home"), 3000);
    } catch (error) {
      console.error("Erro ao confirmar pedido:", error);
      alert("Erro ao confirmar pedido. Tente novamente.");
    } finally {
      setConfirmando(false);
    }
  };

  // Loading durante inicialização
  if (!isInitialized || authLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Verificando autenticação...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">Checkout - Finalizar Pedido</h2>
      
      {carregandoCarrinho ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Carregando carrinho...</p>
        </div>
      ) : pedidoConfirmado ? (
        <Alert variant="success" className="text-center">
          <Alert.Heading>Pedido Confirmado!</Alert.Heading>
          <p>Seu pedido foi confirmado com sucesso e está sendo preparado.</p>
          <hr />
          <p className="mb-0">Redirecionando para o cardápio...</p>
        </Alert>
      ) : carrinho.length === 0 ? (
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Carrinho Vazio</Alert.Heading>
          <p>Seu carrinho está vazio. Adicione alguns itens deliciosos!</p>
          <Button variant="success" onClick={() => navigate("/home")}>
            Ver Cardápio
          </Button>
        </Alert>
      ) : (
        <>
          <Row>
            <Col lg={8}>
              <h4 className="mb-3">Itens do Pedido</h4>
              {carrinho.map((item) => (
                <Card key={`${item.id}-${item.quantidade}`} className="mb-3">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col xs={8}>
                        <Card.Title className="mb-1">{item.nome}</Card.Title>
                        <Card.Text className="text-muted">
                          Quantidade: {item.quantidade} | Preço unitário: R$ {item.preco.toFixed(2)}
                        </Card.Text>
                      </Col>
                      <Col xs={4} className="text-end">
                        <strong>R$ {(item.preco * item.quantidade).toFixed(2)}</strong>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </Col>
            <Col lg={4}>
              <Card className="sticky-top">
                <Card.Header>
                  <h5 className="mb-0">Resumo do Pedido</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Subtotal:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Taxa de entrega:</span>
                    <span>Grátis</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <strong>Total:</strong>
                    <strong>R$ {total.toFixed(2)}</strong>
                  </div>
                  <Button
                    variant="success"
                    className="w-100"
                    size="lg"
                    onClick={handleConfirmarPedido}
                    disabled={confirmando || carrinho.length === 0}
                  >
                    {confirmando ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Confirmando...
                      </>
                    ) : (
                      "Confirmar Pedido"
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default Checkout;
