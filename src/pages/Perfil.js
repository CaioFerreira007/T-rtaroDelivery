import React from "react";
import { Container, Card } from "react-bootstrap";

function Perfil() {
  const cliente = JSON.parse(localStorage.getItem("clienteLogado"));

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">👤 Seus Dados</h2>
      <Card>
        <Card.Body>
          <p>
            <strong>Nome:</strong> {cliente?.nome}
          </p>
          <p>
            <strong>E-mail:</strong> {cliente?.email}
          </p>
          {/* Se quiser mostrar senha, use abaixo (não recomendado) */}
          {/* <p><strong>Senha:</strong> {cliente?.senha}</p> */}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Perfil;
