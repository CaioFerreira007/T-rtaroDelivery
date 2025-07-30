import React, { useContext, useEffect, useState } from "react";
import { Container, Card, Spinner } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

function Perfil() {
  const { user } = useContext(AuthContext);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    if (user) {
      setCliente(user);
    } else {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        setCliente(JSON.parse(localUser));
      }
    }
  }, []); // ✅ dependências aqui — executa uma vez ao montar o componente

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">👤 Seus Dados</h2>
      {!cliente ? (
        <div className="text-center">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <p>
              <strong>Nome:</strong> {cliente?.nome}
            </p>
            <p>
              <strong>E-mail:</strong> {cliente?.email}
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default Perfil;
