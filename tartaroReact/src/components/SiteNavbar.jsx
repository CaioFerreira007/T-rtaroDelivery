import { Navbar, Nav, Container, NavDropdown, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Caminho correto para o contexto
import "../styles/SiteNavbar.css";

function SiteNavbar() {
  // Pega os valores do nosso novo AuthContext padronizado
  const { usuarioLogado, logout, loading } = useAuth(); // <-- MUDANÇA AQUI
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // <-- MUDANÇA AQUI: Usa a função de logout simplificada
    navigate("/login");
  };

  // Lógica para verificar se o usuário é admin, agora dentro do componente
  const isAdmin = usuarioLogado?.tipo === "ADM"; // <-- MUDANÇA AQUI

  // Mostra um spinner enquanto o contexto está carregando o estado inicial do usuário
  if (loading) {
    return (
      <Navbar bg="dark" variant="dark" expand="md" fixed="top">
        <Container>
          <Navbar.Brand as={Link} to="/home">
            🔥 Tártaro Delivery
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Spinner animation="border" size="sm" variant="light" />
          </Nav>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar bg="dark" variant="dark" expand="md" fixed="top" className="custom-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/home" className="brand-logo">
          🔥 Tártaro Delivery
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/home" className="nav-link-custom">
              🏠 Início
            </Nav.Link>

            {/* Links de admin, usam a nova variável 'isAdmin' */}
            {isAdmin && ( // <-- MUDANÇA AQUI
              <>
                <Nav.Link as={Link} to="/admin/cadastro-produto" className="nav-link-custom admin-link">
                  ➕ Cadastrar Produto
                </Nav.Link>
                <Nav.Link as={Link} to="/dashboard" className="nav-link-custom admin-link">
                  📊 Dashboard
                </Nav.Link>
              </>
            )}

            {/* Verifica 'usuarioLogado' para mostrar o menu ou o botão de login */}
            {usuarioLogado ? ( // <-- MUDANÇA AQUI
              <NavDropdown
                title={
                  <span className="user-dropdown-title">
                    👤 {usuarioLogado.nome} {/* <-- MUDANÇA AQUI */}
                    {isAdmin && <span className="admin-badge"> ADM</span>} {/* <-- MUDANÇA AQUI */}
                  </span>
                }
                id="perfil-dropdown"
                className="user-dropdown"
              >
                <NavDropdown.Item as={Link} to="/perfil">
                  🔎 Ver Perfil
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/editar-perfil">
                  ✏️ Editar Conta
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/meus-pedidos">
                  📦 Meus Pedidos
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item 
                  onClick={handleLogout}
                  className="logout-item"
                >
                  🚪 Sair
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login" className="nav-link-custom login-link">
                📝 Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default SiteNavbar;