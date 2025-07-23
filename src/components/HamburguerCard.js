import React from "react";
import { Carousel, Card, Button } from "react-bootstrap";
import { FaShoppingCart } from "react-icons/fa";

// Componente que exibe um hambúrguer individual
function HamburguerCard({ nome, descricao, preco, imagens, onAdd }) {
  const listaImagens = Array.isArray(imagens) ? imagens : [imagens];

  return (
    <Card className="mb-4 shadow-sm rounded h-100">
      <Card.Body className="d-flex flex-column">
        {/* Carrossel de imagens */}
        <div style={{ minHeight: "260px", overflow: "hidden" }}>
          <Carousel fade interval={null}>
            {listaImagens.map((img, index) => (
              <Carousel.Item key={index}>
                <img
                  src={img}
                  alt={`${nome} ${index + 1}`}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    aspectRatio: "4 / 3",
                    borderRadius: "10px",
                    backgroundColor: "#fff",
                  }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </div>

        {/* Conteúdo do card */}
        <Card.Title className="mt-3">{nome}</Card.Title>
        <Card.Text>{descricao}</Card.Text>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fw-bold fs-5">R$ {preco.toFixed(2)}</span>
          <Button variant="success" onClick={onAdd}>
            <FaShoppingCart className="me-2" />
            Adicionar
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default HamburguerCard;
