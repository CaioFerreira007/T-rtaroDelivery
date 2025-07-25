import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "../styles/SiteNavbar.css";

function SiteNavbar() {
  const [clienteLogado, setClienteLogado] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const cliente = JSON.parse(localStorage.getItem("clienteLogado"));
    setClienteLogado(cliente);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("clienteLogado");
    setClienteLogado(null);
  };

  return (
    <Navbar bg="dark" variant="dark" expand="md" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
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
