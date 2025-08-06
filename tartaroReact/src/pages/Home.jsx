import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import axiosConfig from "../Services/axiosConfig";

import HamburguerCard from "../components/HamburguerCard";
import { adicionarAoCarrinho as salvarNoLocalStorage } from "../utils/carrinho";
import BarraCarrinho from "../components/BarraCarrinho";
import "../styles/Home.css";

function Home() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [animar, setAnimar] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const [role, setRole] = useState(""); // ✅ Novo estado

  // Helper para lidar com PascalCase e camelCase
  const getField = (item, field) => {
    if (item[field] !== undefined) return item[field];
    const lc = field.charAt(0).toLowerCase() + field.slice(1);
    return item[lc] !== undefined ? item[lc] : undefined;
  };

  // Carrega role do usuário
  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toUpperCase()?.trim();
    setRole(storedRole);
  }, []);

  // Carrega produtos da API
  useEffect(() => {
    setAnimar(true);
    const token = localStorage.getItem("token");

    axiosConfig
      .get("/produtos", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        let lista = [];

        if (Array.isArray(res.data)) {
          lista = res.data;
        } else if (Array.isArray(res.data["$values"])) {
          lista = res.data["$values"];
        }

        setProdutos(lista);
      })
      .catch((err) => {
        console.error("Erro ao carregar produtos:", err);
      });
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
      : produtos.filter((item) => getField(item, "Categoria") === filtro);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prev) => {
      const id = getField(produto, "Id");
      const existe = prev.find((i) => getField(i, "Id") === id);

      const atualizado = existe
        ? prev.map((i) =>
            getField(i, "Id") === id
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          )
        : [...prev, { ...produto, quantidade: 1 }];

      salvarNoLocalStorage(produto);
      return atualizado;
    });
  };

  const atualizarQuantidade = (Id, operacao) => {
    setCarrinho((prev) =>
      prev
        .map((item) => {
          if (getField(item, "Id") === Id) {
            const novaQtde =
              operacao === "+" ? item.quantidade + 1 : item.quantidade - 1;
            return novaQtde > 0 ? { ...item, quantidade: novaQtde } : null;
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

  return (
    <Container
      className={`menu-container mt-5 mb-5 ${animar ? "fade-in" : ""}`}
    >
      <h1 className="text-center mb-4">🍔 Cardápio Tártaro Delivery</h1>

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
        {produtosFiltrados.length === 0 && (
          <p className="text-center text-muted w-100">
            Nenhum produto encontrado.
          </p>
        )}

        {produtosFiltrados.map((item) => {
          const id = getField(item, "Id");
          const nome = getField(item, "Nome") || getField(item, "nome");
          const descricao =
            getField(item, "Descricao") || getField(item, "descricao");
          const preco = getField(item, "Preco") || getField(item, "preco");
          const rawImgs = getField(item, "ImagemUrls");
          const imagens = Array.isArray(rawImgs)
            ? rawImgs.filter((u) => typeof u === "string" && u.trim())
            : [];

          return (
            <Col key={id} xs={12} sm={6} lg={4}>
              <HamburguerCard
                id={id}
                nome={nome}
                descricao={descricao}
                preco={preco}
                imagens={imagens}
                onAdd={() => adicionarAoCarrinho(item)}
                role={role} // ✅ Aqui!
              />
            </Col>
          );
        })}
      </Row>

      <Button
        className="btn-ver-carrinho"
        variant="success"
        onClick={() => {
          if (carrinho.length > 0) setMostrarCarrinho(true);
          else
            alert(
              "Seu carrinho está vazio! 🍟 Adicione produtos para visualizar."
            );
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
        </div>
      )}
    </Container>
  );
}

export default Home;
