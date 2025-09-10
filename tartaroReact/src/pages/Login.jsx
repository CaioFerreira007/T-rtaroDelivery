import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { login as loginService } from "../Services/authService";

import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false); // Adicionado para feedback no botão
  const navigate = useNavigate();
  const { setUsuarioLogado } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const usuario = await loginService(email, senha);
      setUsuarioLogado(usuario);
      navigate("/home");
    } catch (err) {
      const mensagem = err.response?.data || "Email ou senha inválidos.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Container className="mt-5 login-container fade-in">
      <h2 className="text-center mb-4">🔐 Entrar</h2>

      {erro && (
        <Alert variant="danger" className="text-center">
          {typeof erro === "string" ? erro : "Ocorreu um erro."}
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
            autoComplete="email"
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
            autoComplete="current-password"
          />
        </Form.Group>

        <Button
          type="submit"
          variant="success"
          className="w-100 mt-3"
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "✅ Entrar"}
        </Button>
      </Form>

      <p className="text-center mt-3">
        <Link
          to="/esqueci-senha"
          style={{ color: "#28a745", textDecoration: "underline" }}
        >
          Esqueci minha senha
        </Link>
      </p>

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
