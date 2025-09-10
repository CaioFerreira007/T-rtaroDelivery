import { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";

import { getProdutos } from "../Services/produtoService";
import HamburguerCard from "../components/HamburguerCard";
import BarraCarrinho from "../components/BarraCarrinho";

import "../styles/Home.css";

function Home() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState(() => {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinho");
      return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
    } catch (error) {
      console.error("Erro ao ler carrinho do localStorage:", error);
      return [];
    }
  });
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const listaProdutos = await getProdutos();
        setProdutos(listaProdutos);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      }
    };
    carregarProdutos();
  }, []);

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    if (carrinho.length === 0) {
      setMostrarCarrinho(false);
    }
  }, [carrinho]);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prevCarrinho) => {
      const itemExistente = prevCarrinho.find((item) => item.id === produto.id);
      if (itemExistente) {
        return prevCarrinho.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prevCarrinho, { ...produto, quantidade: 1 }];
    });
  };

  const atualizarQuantidade = (produtoId, operacao) => {
    setCarrinho((prevCarrinho) =>
      prevCarrinho
        .map((item) => {
          if (item.id === produtoId) {
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
  };

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

  return (
    <Container className="menu-container mt-5 mb-5 fade-in">
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
        {produtos.length === 0 ? (
          <p className="text-center text-muted w-100">Carregando produtos...</p>
        ) : (
          produtosFiltrados.map((item) => (
            <Col key={item.id} xs={12} sm={6} lg={4}>
              <HamburguerCard
                id={item.id}
                nome={item.nome}
                descricao={item.descricao}
                preco={item.preco}
                imagens={item.imagemUrls}
                onAdd={() => adicionarAoCarrinho(item)}
              />
            </Col>
          ))
        )}
      </Row>

      {carrinho.length > 0 && (
        <Button
          className="btn-ver-carrinho"
          variant="success"
          onClick={() => setMostrarCarrinho(true)}
        >
          🛒 Ver Carrinho (
          {carrinho.reduce((acc, item) => acc + item.quantidade, 0)})
        </Button>
      )}

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
