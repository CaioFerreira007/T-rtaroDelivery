import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import HamburguerCard from "../components/HamburguerCard";
import { adicionarAoCarrinho as salvarNoLocalStorage } from "../utils/carrinho";
import BarraCarrinho from "../components/BarraCarrinho";
import "../styles/Home.css";

function Menu() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [animar, setAnimar] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const navigate = useNavigate();

  useEffect(() => {
    setAnimar(true);
    // 👇 Carrega produtos da API
    axios
      .get("/api/produtos")
      .then((res) => setProdutos(res.data))
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  useEffect(() => {
    if (carrinho.length === 0) setMostrarCarrinho(false);
  }, [carrinho]);

  const categorias = [
    "Todos",
    "Artesanais",
    "Tradicionais",
    "Bebidas",
    "Combos",
    "Batatas",
    "Molhos Adicionais",
  ];

  const produtosFiltrados =
    filtro === "Todos"
      ? produtos
      : produtos.filter((item) => item.categoria === filtro);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prevCarrinho) => {
      const existente = prevCarrinho.find((item) => item.id === produto.id);
      const atualizado = existente
        ? prevCarrinho.map((item) =>
            item.id === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item
          )
        : [...prevCarrinho, { ...produto, quantidade: 1 }];

      salvarNoLocalStorage(produto);
      return atualizado;
    });
  };

  const atualizarQuantidade = (id, operacao) => {
    setCarrinho((prevCarrinho) =>
      prevCarrinho
        .map((item) => {
          if (item.id === id) {
            const novaQtde =
              operacao === "+" ? item.quantidade + 1 : item.quantidade - 1;
            if (novaQtde < 1) return null;
            return { ...item, quantidade: novaQtde };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    setMostrarCarrinho(false);
    localStorage.removeItem("carrinho");
  };

  const finalizarPedido = () => {
    if (carrinho.length > 0) {
      navigate("/checkout");
    } else {
      alert(
        "Adicione pelo menos um produto ao carrinho antes de finalizar! 🍔"
      );
    }
  };

  return (
    <Container
      className={`menu-container mt-5 mb-5 ${animar ? "fade-in" : ""}`}
    >
      <h2 className="text-center mb-4">🍔 Cardápio Tártaro Delivery</h2>

      <div className="mb-4 d-flex flex-wrap gap-2 justify-content-center">
        {categorias.map((cat) => (
          <Button
            key={cat}
            variant={cat === filtro ? "success" : "outline-success"}
            onClick={() => setFiltro(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <Row className="gy-4">
        {produtosFiltrados.map((item) => (
          <Col key={item.id} xs={12} sm={6} lg={4}>
            <HamburguerCard {...item} onAdd={() => adicionarAoCarrinho(item)} />
          </Col>
        ))}
      </Row>

      <Button
        className="btn-ver-carrinho"
        variant="success"
        onClick={() => {
          if (carrinho.length > 0) {
            setMostrarCarrinho(true);
          } else {
            alert(
              "Seu carrinho está vazio! 🍟 Adicione produtos para visualizar."
            );
          }
        }}
      >
        🛒 Ver Carrinho ({carrinho.length})
      </Button>

      {mostrarCarrinho && (
        <div className="painel-carrinho">
          <BarraCarrinho
            carrinho={carrinho}
            atualizarQuantidade={atualizarQuantidade}
            limparCarrinho={limparCarrinho}
            onClose={() => setMostrarCarrinho(false)}
          />
          <div className="text-end p-3">
            <Button variant="success" onClick={finalizarPedido}>
              🛵 Finalizar Pedido
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}

export default Menu;
