import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/SiteNavbar.css";

function SiteNavbar() {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteLogado, setClienteLogado] = useState(null);

  useEffect(() => {
    // Atualiza o estado local com base no contexto ou localStorage
    if (user) {
      setClienteLogado(user);
    } else {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        setClienteLogado(JSON.parse(localUser));
      } else {
        setClienteLogado(null);
      }
    }
  }, [user, location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null); // Atualiza o contexto
    setClienteLogado(null);
    navigate("/login");
  };

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
              <>
                <Nav.Link as={Link} to="/login">
                  📝 Login
                </Nav.Link>
                <Nav.Link as={Link} to="/cadastro">
                  👤 Cadastro
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default SiteNavbar;
