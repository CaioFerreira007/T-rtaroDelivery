import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { validarLogin } from "../utils/auth";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const usuario = validarLogin(email, senha);

    if (usuario) {
      localStorage.setItem("clienteLogado", JSON.stringify(usuario));
      navigate("/"); // ajuste conforme sua rota
    } else {
      setErro(true);
    }
  };

  return (
    <Container className="mt-5 login-container fade-in">
      <h2 className="text-center mb-4">🔐 Entrar</h2>

      {erro && (
        <Alert variant="danger" className="text-center">
          E-mail ou senha inválidos! Tente novamente.
        </Alert>
      )}

      <Form onSubmit={handleLogin}>
        <Form.Group className="mb-3">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mt-3">
          ✅ Entrar
        </Button>
      </Form>

      <p className="text-center mt-4">
        Ainda não tem conta?{" "}
        <Link
          to="/cadastro"
          style={{ color: "#28a745", textDecoration: "underline" }}
        >
          Cadastre-se aqui
        </Link>
      </p>
    </Container>
  );
}

export default Login;
