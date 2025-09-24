import { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";

import { getProdutos } from "../Services/produtoService";
import HamburguerCard from "../components/HamburguerCard";
import BarraCarrinho from "../components/BarraCarrinho";

import "../styles/Home.css";

function Home() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const [usuarioId, setUsuarioId] = useState(null);

  // Função para obter ID do usuário autenticado
  const obterUsuarioId = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return user.id ? String(user.id) : null;
      }
    } catch (error) {
      console.error("Erro ao obter dados do usuário:", error);
    }
    return null;
  };

  // Função para obter carrinho específico do usuário
  const obterCarrinhoUsuario = (userId) => {
    try {
      const carrinhoKey = `carrinho_${userId}`;
      const carrinhoSalvo = localStorage.getItem(carrinhoKey);
      return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
    } catch (error) {
      console.error("Erro ao ler carrinho do localStorage:", error);
      return [];
    }
  };

  // Função para salvar carrinho específico do usuário
  const salvarCarrinhoUsuario = (userId, carrinhoData) => {
    try {
      const carrinhoKey = `carrinho_${userId}`;
      localStorage.setItem(carrinhoKey, JSON.stringify(carrinhoData));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
    }
  };

  // Função para limpar carrinho do usuário após finalizar pedido
  const limparCarrinhoUsuario = (userId) => {
    try {
      const carrinhoKey = `carrinho_${userId}`;
      localStorage.removeItem(carrinhoKey);
    } catch (error) {
      console.error("Erro ao limpar carrinho do localStorage:", error);
    }
  };

  // Inicialização do componente
  useEffect(() => {
    const userId = obterUsuarioId();

    if (!userId) {
      console.warn("Usuário não autenticado");
      return;
    }

    setUsuarioId(userId);
    const carrinhoUsuario = obterCarrinhoUsuario(userId);
    setCarrinho(carrinhoUsuario);
  }, []);

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const listaProdutos = await getProdutos();
        setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        setProdutos([]);
      }
    };
    carregarProdutos();
  }, []);

  // Salva o carrinho sempre que ele for atualizado
  useEffect(() => {
    if (usuarioId) {
      salvarCarrinhoUsuario(usuarioId, carrinho);
      if (carrinho.length === 0) {
        setMostrarCarrinho(false);
      }
    }
  }, [carrinho, usuarioId]);

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

  const finalizarPedido = async () => {
    try {
      console.log("Pedido finalizado para usuário:", usuarioId);
      console.log("Itens do pedido:", carrinho);

      limparCarrinhoUsuario(usuarioId);
      setCarrinho([]);
      setMostrarCarrinho(false);

      alert("Pedido realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert("Erro ao finalizar pedido. Tente novamente.");
    }
  };

  const handleLogout = () => {
    if (usuarioId) {
      limparCarrinhoUsuario(usuarioId);
      setCarrinho([]);
      setUsuarioId(null);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        const novoUserId = obterUsuarioId();

        if (novoUserId !== usuarioId) {
          if (usuarioId) {
            limparCarrinhoUsuario(usuarioId);
          }

          setUsuarioId(novoUserId);
          if (novoUserId) {
            const carrinhoNovoUsuario = obterCarrinhoUsuario(novoUserId);
            setCarrinho(carrinhoNovoUsuario);
          } else {
            setCarrinho([]);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [usuarioId]);

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

      {!usuarioId && (
        <div className="alert alert-warning text-center">
          <p>Faça login para adicionar itens ao carrinho.</p>
        </div>
      )}

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
            onFinalizarPedido={finalizarPedido}
          />
        </div>
      )}
    </Container>
  );
}

export default Home;
