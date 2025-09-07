import React, { useContext, useEffect, useState } from "react";
import { Container, Card, Spinner, Alert } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

function Perfil() {
  const { usuariologado } = useContext(AuthContext);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDadosCliente = () => {
      try {
        // Primeiro tenta pegar do contexto
        if (usuariologado) {
          console.log("Dados do contexto:", usuariologado);
          setCliente(usuariologado);
          setLoading(false);
          return;
        }

        // Se não tiver no contexto, tenta pegar do localStorage
        const localUser = localStorage.getItem("user");
        if (localUser) {
          const userData = JSON.parse(localUser);
          console.log("Dados do localStorage:", userData);
          setCliente(userData);
          setLoading(false);
          return;
        }

        // Se não encontrou dados em lugar nenhum
        console.log("Nenhum dado de usuário encontrado");
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
        setLoading(false);
      }
    };

    carregarDadosCliente();
  }, [usuariologado]);

  // Debug: vamos ver o que está acontecendo
  console.log("Estado atual:", { usuariologado, cliente, loading });

  if (loading) {
    return (
      <Container className="mt-5 fade-in">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-2">Carregando seus dados...</p>
        </div>
      </Container>
    );
  }

  if (!cliente) {
    return (
      <Container className="mt-5 fade-in">
        <Alert variant="warning" className="text-center">
          <h5>⚠️ Dados não encontrados</h5>
          <p>
            Não foi possível carregar seus dados. Tente fazer login novamente.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">👤 Seus Dados</h2>

      <Card>
        <Card.Body>
          <div className="row">
            <div className="col-12 mb-3">
              <strong>Nome:</strong>
              <p className="mb-1">{cliente.nome || "Não informado"}</p>
            </div>

            <div className="col-12 mb-3">
              <strong>E-mail:</strong>
              <p className="mb-1">{cliente.email || "Não informado"}</p>
            </div>

            <div className="col-12 mb-3">
              <strong>Telefone:</strong>
              <p className="mb-1">{cliente.telefone || "Não informado"}</p>
            </div>
          </div>

          {/* Debug info - remova depois de resolver */}
          <details className="mt-3">
            <summary className="text-muted small">
              Debug Info (clique para expandir)
            </summary>
            <pre className="small text-muted mt-2">
              {JSON.stringify(cliente, null, 2)}
            </pre>
          </details>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Perfil;
