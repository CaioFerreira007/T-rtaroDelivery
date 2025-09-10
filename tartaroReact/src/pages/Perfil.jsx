import React, { useContext } from "react";
import { Container, Card, Spinner, Alert } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Perfil() {
  const { usuariologado } = useContext(AuthContext);

  if (usuariologado === null) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-2">Carregando seus dados...</p>
      </Container>
    );
  }

  if (!usuariologado) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="warning">
          Não foi possível carregar seus dados. Por favor, faça o login.
        </Alert>
        <Link to="/login" className="btn btn-primary">
          Ir para Login
        </Link>
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
              <p className="mb-1">{usuariologado.nome || "Não informado"}</p>
            </div>

            <div className="col-12 mb-3">
              <strong>E-mail:</strong>
              <p className="mb-1">{usuariologado.email || "Não informado"}</p>
            </div>

            <div className="col-12 mb-3">
              <strong>Telefone:</strong>
              <p className="mb-1">
                {usuariologado.telefone || "Não informado"}
              </p>
            </div>
          </div>
          <hr />
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Perfil;
