import React from "react";
import { Carousel, Card, Button } from "react-bootstrap";
import { FaShoppingCart } from "react-icons/fa";
import "../styles/HamburguerCard.css"; // Certifique-se de que o caminho está correto

function HamburguerCard({ nome, descricao, preco, imagens, onAdd }) {
  const urlBase = "http://localhost:5120/imagens/";

  const listaImagens = Array.isArray(imagens)
    ? imagens
        .filter((url) => typeof url === "string" && url.trim() !== "")
        .map((url) => (url.startsWith("http") ? url : `${urlBase}${url}`))
    : [];

  const precoFormatado = isNaN(Number(preco))
    ? "0.00"
    : Number(preco).toFixed(2);

  return (
    <Card className="mb-4 shadow-sm rounded h-100 hamburguer-card">
      {/* 🖼️ Carrossel de imagens preenchido e responsivo */}
      <div className="imagem-container">
        {listaImagens.length > 0 ? (
          <Carousel fade interval={null} className="carousel-wrapper">
            {listaImagens.map((img, index) => (
              <Carousel.Item key={index} className="carousel-item">
                <img
                  src={img}
                  alt={`${nome} ${index + 1}`}
                  className="produto-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/imagens/fallback.jpg";
                    e.target.style.border = "2px solid red";
                  }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="imagem-fallback">
            <span>Imagem não disponível</span>
          </div>
        )}
      </div>

      {/* 📦 Conteúdo do card */}
      <Card.Body className="d-flex flex-column conteudo-card">
        <Card.Title className="titulo-card">{nome}</Card.Title>
        <Card.Text className="descricao-card">{descricao}</Card.Text>
        <div className="mt-auto d-flex justify-content-between align-items-center rodape-card">
          <span className="preco-card">R$ {precoFormatado}</span>
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
