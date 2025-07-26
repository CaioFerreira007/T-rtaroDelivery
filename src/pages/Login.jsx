import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const resposta = await axios.post(
        "http://localhost:5120/api/Auth/login",
        {
          email,
          senha,
        }
      );

      // Salva os dados retornados pela API (ex: token, nome, id, etc.)
      localStorage.setItem("token", resposta.data.token);
      // Redireciona o usuário para a página principal
      navigate("/home");
    } catch (err) {
      if (err.response && err.response.data) {
        setErro(err.response.data.mensagem || "E-mail ou senha incorretos.");
      } else {
        setErro("Erro ao conectar com o servidor.");
      }
    }
  };

  return (
    <Container className="mt-5 login-container fade-in">
      <h2 className="text-center mb-4">🔐 Entrar</h2>

      {erro && (
        <Alert variant="danger" className="text-center">
          {erro}
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

      <p className="text-center mt-3">
        <Link
          to="/esqueci-senha"
          style={{ color: "#28a745", textDecoration: "underline" }}
        >
          Esqueci minha senha?
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
