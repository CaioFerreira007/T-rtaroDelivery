
import React, { useContext } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../Services/authService"; // Importa o logout do serviço
import "../styles/SiteNavbar.css";

function SiteNavbar() {
  // 1. A única fonte da verdade sobre o usuário é o contexto!
  const { usuariologado, setUsuarioLogado } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Chama a função do serviço que limpa o localStorage
    setUsuarioLogado(null); // Atualiza o contexto
    navigate("/login");
  };

  const isADM = usuariologado?.tipo === "ADM";

  return (
    <Navbar bg="dark" variant="dark" expand="md" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/home">
          🔥 Tártaro Delivery
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/home">
              🏠 Início
            </Nav.Link>

            {isADM && (
              <Nav.Link as={Link} to="/admin/cadastro-produto">
                ➕ Cadastrar Produto
              </Nav.Link>
            )}

            {usuariologado ? (
              <NavDropdown
                title={`👤 ${usuariologado.nome}`}
                id="perfil-dropdown"
              >
                <NavDropdown.Item as={Link} to="/perfil">
                  🔎 Ver Dados
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/editar-perfil">
                  ✏️ Editar Conta
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/meus-pedidos" >Meus Pedidos</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  🚪 Sair
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">
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
