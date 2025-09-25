import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { getProdutos } from "../services/produtoService";
import HamburguerCard from "../components/HamburguerCard";
import BarraCarrinho from "../components/BarraCarrinho";

import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const { usuarioLogado, isLoggedIn, isInitialized } = useAuth();
  
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [finalizandoPedido, setFinalizandoPedido] = useState(false);

  // Função para obter carrinho específico do usuário
  const obterCarrinhoUsuario = useCallback((userId) => {
    try {
      if (!userId) return [];
      const carrinhoKey = `carrinho_${userId}`;
      const carrinhoSalvo = localStorage.getItem(carrinhoKey);
      const carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
      
      // Validar estrutura do carrinho
      return Array.isArray(carrinho) ? carrinho.filter(item => 
        item && item.id && item.nome && typeof item.preco === 'number' && item.quantidade > 0
      ) : [];
    } catch (error) {
      console.error("Erro ao ler carrinho do localStorage:", error);
      return [];
    }
  }, []);

  // Função para salvar carrinho específico do usuário
  const salvarCarrinhoUsuario = useCallback((userId, carrinhoData) => {
    try {
      if (!userId) return;
      const carrinhoKey = `carrinho_${userId}`;
      localStorage.setItem(carrinhoKey, JSON.stringify(carrinhoData));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
    }
  }, []);

  // Função para limpar carrinho do usuário
  const limparCarrinhoUsuario = useCallback((userId) => {
    try {
      if (!userId) return;
      const carrinhoKey = `carrinho_${userId}`;
      localStorage.removeItem(carrinhoKey);
    } catch (error) {
      console.error("Erro ao limpar carrinho do localStorage:", error);
    }
  }, []);

  // Carregar produtos
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        setError("");
        const listaProdutos = await getProdutos();
        
        if (Array.isArray(listaProdutos)) {
          setProdutos(listaProdutos);
        } else {
          console.warn("API retornou dados inválidos para produtos:", listaProdutos);
          setProdutos([]);
          setError("Formato de dados inválido recebido do servidor.");
        }
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        setProdutos([]);
        
        let mensagemErro = "Erro ao carregar produtos.";
        if (!err.response) {
          mensagemErro = "Erro de conexão. Verifique sua internet.";
        } else if (err.response.status >= 500) {
          mensagemErro = "Erro no servidor. Tente novamente mais tarde.";
        }
        setError(mensagemErro);
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, []);

  // Inicializar carrinho quando usuário estiver disponível
  useEffect(() => {
    if (isInitialized && usuarioLogado?.id) {
      const carrinhoUsuario = obterCarrinhoUsuario(usuarioLogado.id);
      setCarrinho(carrinhoUsuario);
    } else if (isInitialized && !usuarioLogado) {
      setCarrinho([]);
    }
  }, [usuarioLogado, isInitialized, obterCarrinhoUsuario]);

  // Salvar carrinho sempre que ele for atualizado
  useEffect(() => {
    if (usuarioLogado?.id) {
      salvarCarrinhoUsuario(usuarioLogado.id, carrinho);
      
      // Fechar carrinho se estiver vazio
      if (carrinho.length === 0) {
        setMostrarCarrinho(false);
      }
    }
  }, [carrinho, usuarioLogado, salvarCarrinhoUsuario]);

  // Monitorar mudanças de usuário entre abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        // Recarregar carrinho se usuário mudou
        if (usuarioLogado?.id) {
          const carrinhoAtualizado = obterCarrinhoUsuario(usuarioLogado.id);
          setCarrinho(carrinhoAtualizado);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [usuarioLogado, obterCarrinhoUsuario]);

  const adicionarAoCarrinho = useCallback((produto) => {
    if (!usuarioLogado) {
      alert("Faça login para adicionar itens ao carrinho.");
      navigate("/login");
      return;
    }

    // Validar produto
    if (!produto || !produto.id || !produto.nome || typeof produto.preco !== 'number') {
      console.error("Produto inválido:", produto);
      return;
    }

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
  }, [usuarioLogado, navigate]);

  const atualizarQuantidade = useCallback((produtoId, operacao) => {
    setCarrinho((prevCarrinho) =>
      prevCarrinho
        .map((item) => {
          if (item.id === produtoId) {
            const novaQtde = operacao === "+" ? item.quantidade + 1 : item.quantidade - 1;
            return novaQtde > 0 ? { ...item, quantidade: novaQtde } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
    setMostrarCarrinho(false);
  }, []);

  const finalizarPedido = useCallback(async () => {
    if (!usuarioLogado?.id || carrinho.length === 0) return;

    try {
      setFinalizandoPedido(true);
      
      // Aqui você pode integrar com um serviço de pedidos real
      console.log("Finalizando pedido para usuário:", usuarioLogado.id);
      console.log("Itens do pedido:", carrinho);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpar carrinho após sucesso
      limparCarrinhoUsuario(usuarioLogado.id);
      setCarrinho([]);
      setMostrarCarrinho(false);

      alert("Pedido realizado com sucesso! 🎉");
      
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setFinalizandoPedido(false);
    }
  }, [usuarioLogado, carrinho, limparCarrinhoUsuario]);

  // Mostrar loading durante inicialização
  if (!isInitialized) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Carregando...</p>
      </Container>
    );
  }

  const categorias = [
    "Todos",
    "Artesanais", 
    "Tradicionais",
    "Bebidas",
    "Combos",
    "Batatas",
    "Molhos Adicionais",
  ];

  const produtosFiltrados = filtro === "Todos" 
    ? produtos 
    : produtos.filter((item) => item.categoria === filtro);

  const totalItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <Container className="menu-container mt-5 mb-5 fade-in">
      <h1 className="text-center mb-4">🍔 Cardápio Tártaro Delivery</h1>

      {!isLoggedIn && (
        <Alert variant="info" className="text-center">
          <Alert.Heading>Bem-vindo!</Alert.Heading>
          <p>Para uma experiência completa, faça login e adicione itens ao seu carrinho.</p>
          <Button variant="outline-primary" onClick={() => navigate("/login")}>
            Fazer Login
          </Button>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="text-center" dismissible onClose={() => setError("")}>
          <Alert.Heading>Erro</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </Alert>
      )}

      <div className="mb-4 d-flex flex-wrap gap-2 justify-content-center">
        {categorias.map((cat) => (
          <Button
            key={cat}
            variant={cat === filtro ? "success" : "outline-success"}
            onClick={() => setFiltro(cat)}
            disabled={loading}
          >
            {cat}
          </Button>
        ))}
      </div>

      <Row className="gy-4">
        {loading ? (
          <Col xs={12} className="text-center">
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-3">Carregando produtos...</p>
          </Col>
        ) : produtosFiltrados.length === 0 && !error ? (
          <Col xs={12} className="text-center">
            <Alert variant="warning">
              <h4>Nenhum produto encontrado</h4>
              <p>Não há produtos disponíveis nesta categoria no momento.</p>
            </Alert>
          </Col>
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
                disabled={!isLoggedIn}
              />
            </Col>
          ))
        )}
      </Row>

      {totalItensCarrinho > 0 && (
        <Button
          className="btn-ver-carrinho position-fixed"
          style={{ 
            bottom: '20px', 
            right: '20px', 
            zIndex: 1000,
            borderRadius: '50px',
            padding: '15px 25px',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          variant="success"
          onClick={() => setMostrarCarrinho(true)}
          disabled={finalizandoPedido}
        >
          🛒 Ver Carrinho ({totalItensCarrinho})
        </Button>
      )}

      {mostrarCarrinho && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 1050 
          }}
          onClick={() => setMostrarCarrinho(false)}
        >
          <div 
            className="position-absolute end-0 top-0 h-100 bg-white"
            style={{ 
              width: '100%', 
              maxWidth: '400px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <BarraCarrinho
              carrinho={carrinho}
              atualizarQuantidade={atualizarQuantidade}
              limparCarrinho={limparCarrinho}
              onClose={() => setMostrarCarrinho(false)}
              onFinalizarPedido={finalizarPedido}
              loading={finalizandoPedido}
            />
          </div>
        </div>
      )}
    </Container>
  );
}

export default Home;