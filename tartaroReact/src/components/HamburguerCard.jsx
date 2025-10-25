import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Carousel, Card, Button, Spinner } from "react-bootstrap";
import { FaShoppingCart, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/HamburguerCard.css";

function HamburguerCard({
  id,
  nome,
  descricao,
  preco,
  imagens,
  onAdd,
  onDelete,
  disabled = false, // 🆕 PROP PARA DESABILITAR
}) {
  const { usuariologado } = useContext(AuthContext);
  const navigate = useNavigate();
  const [deletando, setDeletando] = useState(false);

  const role = usuariologado?.tipo || "";
  const isAdmin = role.toUpperCase().trim() === "ADM";

  const listaImagens = Array.isArray(imagens)
    ? imagens.filter((url) => typeof url === "string" && url.trim() !== "")
    : [];

  const precoFormatado = isNaN(Number(preco))
    ? "0.00"
    : Number(preco).toFixed(2);

  const handleEditar = () => {
    if (id) {
      navigate(`/admin/produtos/editar/${id}`);
    } else {
      alert("Produto sem ID. Não é possível editar.");
    }
  };

  const handleExcluir = async () => {
    if (
      window.confirm(
        `⚠️ Tem certeza que deseja excluir "${nome}"?\n\nEsta ação não pode ser desfeita!`
      )
    ) {
      setDeletando(true);
      try {
        await onDelete(id);
      } catch (error) {
        console.error("Erro ao excluir:", error);
      } finally {
        setDeletando(false);
      }
    }
  };

  const imagemFallback =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='60' fill='%23999'%3E🍔%3C/text%3E%3C/svg%3E";

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
                    e.target.src = imagemFallback;
                    console.warn(`Imagem não carregada: ${img}`);
                  }}
                  loading="lazy"
                />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="imagem-fallback">
            <img
              src={imagemFallback}
              alt={nome}
              className="produto-img"
              style={{ objectFit: "contain", padding: "20px" }}
            />
            <span
              style={{
                position: "absolute",
                bottom: "10px",
                fontSize: "12px",
                color: "#999",
              }}
            >
              Sem imagem
            </span>
          </div>
        )}
      </div>

      <Card.Body className="conteudo-card">
        <Card.Title className="titulo-card">{nome}</Card.Title>
        <Card.Text className="descricao-card">{descricao}</Card.Text>
        <div className="rodape-card">
          <span className="preco-card">R$ {precoFormatado}</span>
          {isAdmin ? (
            <div className="d-flex gap-2 w-100">
              <Button
                variant="warning"
                onClick={handleEditar}
                className="flex-grow-1"
                size="sm"
              >
                <FaEdit className="me-1" />
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={handleExcluir}
                disabled={deletando}
                size="sm"
              >
                {deletando ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FaTrash className="me-1" />
                    Excluir
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant={disabled ? "secondary" : "success"}
              onClick={onAdd}
              disabled={disabled} // 🆕 USAR PROP DISABLED
            >
              <FaShoppingCart className="me-2" />
              {disabled ? "Indisponível" : "Adicionar"}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default HamburguerCard;
