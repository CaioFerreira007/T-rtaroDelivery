import React from "react";
import { Carousel, Card, Button } from "react-bootstrap";
import { FaShoppingCart } from "react-icons/fa";

// Componente que exibe um hambúrguer individual
function HamburguerCard({ nome, descricao, preco, imagens, onAdd }) {
  // Garante que 'imagens' seja sempre um array
  const listaImagens = Array.isArray(imagens) ? imagens : [imagens];

  // 🔒 Fallback para preço inválido
  const precoFormatado = isNaN(Number(preco))
    ? "0.00"
    : Number(preco).toFixed(2);

  return (
    <Card className="mb-4 shadow-sm rounded h-100">
      <Card.Body className="d-flex flex-column">
        {/* Carrossel de imagens */}
        <div style={{ minHeight: "260px", overflow: "hidden" }}>
          {listaImagens[0] ? (
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
          ) : (
            <div
              style={{
                height: "260px",
                backgroundColor: "#eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
              }}
            >
              <span>Imagem não disponível</span>
            </div>
          )}
        </div>

        {/* Conteúdo do card */}
        <Card.Title className="mt-3">{nome}</Card.Title>
        <Card.Text>{descricao}</Card.Text>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fw-bold fs-5">R$ {precoFormatado}</span>
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
