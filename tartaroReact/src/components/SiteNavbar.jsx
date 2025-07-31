import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/SiteNavbar.css";

function SiteNavbar() {
  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteLogado, setClienteLogado] = useState(null);

  useEffect(() => {
    if (usuarioLogado) {
      setClienteLogado(usuarioLogado);
    } else {
      try {
        const localUser = localStorage.getItem("user");
        if (localUser) {
          setClienteLogado(JSON.parse(localUser));
        } else {
          setClienteLogado(null);
        }
      } catch (error) {
        console.error("Erro ao ler usuário do localStorage:", error);
        setClienteLogado(null);
      }
    }
  }, [usuarioLogado, location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUsuarioLogado(null);
    setClienteLogado(null);
    navigate("/login");
  };

  const isADM = clienteLogado?.tipo?.toUpperCase() === "ADM";

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

            {clienteLogado ? (
              <NavDropdown
                title={`👤 ${clienteLogado.nome}`}
                id="perfil-dropdown"
              >
                <NavDropdown.Item as={Link} to="/perfil">
                  🔎 Ver Dados
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/editar-perfil">
                  ✏️ Editar Conta
                </NavDropdown.Item>
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
