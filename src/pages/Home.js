import React from "react";
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css"; // arquivo de estilo

function Home() {
  const navigate = useNavigate();

  return (
    <Container className="home-container text-center fade-in">
      <h1 className="mb-3">🍔 Tártaro Delivery</h1>
      <p className="lead mb-4">Os hambúrgueres mais épicos da mitologia!</p>

      <Button variant="success" size="lg" onClick={() => navigate("/menu")}>
        Ver Cardápio
      </Button>

      <div className="mt-5">
        <p>📍 Entregamos em Duque de Caxias e região</p>
        <p>⏰ Funcionamento: Terça a Domingo das 18h às 23h</p>
        <a
          href="https://wa.me/seunumero"
          target="_blank"
          rel="noreferrer"
          className="btn btn-success d-inline-flex align-items-center gap-2 mt-2"
        >
          💬 Fale conosco no WhatsApp
        </a>
      </div>
    </Container>
  );
}

export default Home;
