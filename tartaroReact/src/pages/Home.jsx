import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext"; // Importa o contexto
import { getProdutos } from "../Services/produtoService"; // Importa o serviço
import HamburguerCard from "../components/HamburguerCard";
import "../styles/Home.css";

function Home() {
  const { usuariologado } = useContext(AuthContext); // Usa o contexto
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [filtro, setFiltro] = useState("Todos");

  // Carrega produtos da API usando o serviço
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

  // O resto da sua lógica (adicionarAoCarrinho, atualizarQuantidade, etc.) continua a mesma
  // ...

  const categorias = ["Todos", "Artesanais" /* ... */];

  const produtosFiltrados =
    filtro === "Todos"
      ? produtos
      : produtos.filter((item) => item.categoria === filtro);

  return (
    <Container className="menu-container mt-5 mb-5 fade-in">
      <h1 className="text-center mb-4">🍔 Cardápio Tártaro Delivery</h1>

      {/* A lógica de renderização dos filtros e produtos continua a mesma */}
      {/* O componente HamburguerCard já usa o AuthContext internamente para decidir se mostra o botão de editar, então não precisa passar a role como prop. */}

      <Row className="gy-4">
        {produtosFiltrados.map((item) => (
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
        ))}
      </Row>

      {/* O resto do JSX continua o mesmo */}
      {/* ... */}
    </Container>
  );
}

export default Home;
