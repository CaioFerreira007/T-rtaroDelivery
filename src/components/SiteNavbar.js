import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/SiteNavbar.css";

function SiteNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="md" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          🔥 Tártaro Delivery
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">
              🏠 Início
            </Nav.Link>
            <Nav.Link as={Link} to="/menu">
              📋 Cardápio
            </Nav.Link>
            <Nav.Link as={Link} to="/cadastro">
              📝 Cadastro
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default SiteNavbar;
