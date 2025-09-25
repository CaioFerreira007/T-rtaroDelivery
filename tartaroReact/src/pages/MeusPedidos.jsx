import React, { useEffect, useState } from "react";
import { Container, Card, Alert, Spinner, Badge, Row, Button,Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { buscarMeusPedidos } from "../Services/PedidoService";

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { isLoggedIn, isInitialized } = useAuth();

  useEffect(() => {
    // Redirecionar se não estiver logado
    if (isInitialized && !isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }

    if (isLoggedIn) {
      const carregarPedidos = async () => {
        try {
          setLoading(true);
          setErro("");
          const pedidosData = await buscarMeusPedidos();
          setPedidos(Array.isArray(pedidosData) ? pedidosData : []);
        } catch (err) {
          console.error("Erro ao carregar pedidos:", err);
          setErro(err.message || "Erro ao carregar pedidos.");
        } finally {
          setLoading(false);
        }
      };

      carregarPedidos();
    }
  }, [isLoggedIn, isInitialized, navigate]);

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'warning';
      case 'confirmado': return 'info';
      case 'preparando': return 'primary';
      case 'saiu_para_entrega': return 'secondary';
      case 'entregue': return 'success';
      case 'cancelado': return 'danger';
      default: return 'secondary';
    }
  };

  const formatarData = (dataString) => {
    try {
      return new Date(dataString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Data inválida";
    }
  };

  if (!isInitialized || loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Carregando pedidos...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Meus Pedidos</h2>

      {erro && (
        <Alert variant="danger" dismissible onClose={() => setErro("")}>
          <Alert.Heading>Erro</Alert.Heading>
          <p>{erro}</p>
        </Alert>
      )}

      {pedidos.length === 0 && !erro ? (
        <Alert variant="info" className="text-center">
          <Alert.Heading>Nenhum pedido encontrado</Alert.Heading>
          <p>Você ainda não fez nenhum pedido. Que tal dar uma olhada no nosso cardápio?</p>
          <Button variant="success" onClick={() => navigate("/home")}>
            Ver Cardápio
          </Button>
        </Alert>
      ) : (
        <Row>
          {pedidos.map((pedido) => (
            <Col key={pedido.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Pedido #{pedido.id}</small>
                  <Badge bg={getStatusVariant(pedido.status)}>
                    {pedido.status}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Card.Text>
                    <strong>Data:</strong><br />
                    <small>{formatarData(pedido.dataPedido)}</small>
                  </Card.Text>
                  
                  {pedido.pagamento && (
                    <Card.Text>
                      <strong>Total:</strong> R$ {pedido.pagamento.valorTotal.toFixed(2)}<br />
                      <small>via {pedido.pagamento.formaPagamento}</small>
                    </Card.Text>
                  )}

                  {pedido.itens && pedido.itens.length > 0 && (
                    <Card.Text>
                      <strong>Itens:</strong>
                      <ul className="list-unstyled mt-2">
                        {pedido.itens.map((item) => (
                          <li key={item.id} className="small">
                            • {item.produto?.nome || 'Item não identificado'} x {item.quantidade}
                          </li>
                        ))}
                      </ul>
                    </Card.Text>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}