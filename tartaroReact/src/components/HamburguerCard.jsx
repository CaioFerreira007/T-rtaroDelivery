import React from "react";
import { Carousel, Card, Button } from "react-bootstrap";
import { FaShoppingCart, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/HamburguerCard.css";

function HamburguerCard({ id, nome, descricao, preco, imagens, onAdd, role }) {
  const urlBase = "http://localhost:5120/imagens/";
  const navigate = useNavigate();
  const isAdmin = role === "ADM";

  const listaImagens = Array.isArray(imagens)
    ? imagens
        .filter((url) => typeof url === "string" && url.trim() !== "")
        .map((url) => (url.startsWith("http") ? url : `${urlBase}${url}`))
    : [];

  const precoFormatado = isNaN(Number(preco))
    ? "0.00"
    : Number(preco).toFixed(2);

  const handleEditar = () => {
    if (id) {
      navigate(`/admin/produtos/editar/${id}`);
    } else {
      alert("⚠️ Produto sem ID. Não é possível editar.");
    }
  };

  return (
    <Card className="hamburguer-card">
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

      <Card.Body className="conteudo-card">
        <Card.Title className="titulo-card">{nome}</Card.Title>
        <Card.Text className="descricao-card">{descricao}</Card.Text>
        <div className="rodape-card">
          <span className="preco-card">R$ {precoFormatado}</span>
          {isAdmin ? (
            <Button variant="warning" onClick={handleEditar}>
              <FaEdit className="me-2" />
              Editar Produto
            </Button>
          ) : (
            <Button variant="success" onClick={onAdd}>
              <FaShoppingCart className="me-2" />
              Adicionar
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default HamburguerCard;
