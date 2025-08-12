import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import axiosConfig from "../Services/axiosConfig";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { setUsuarioLogado } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const resposta = await axiosConfig.post("/auth/login", { email, senha });

      console.log("STATUS →", resposta.status);
      console.log("DATA →", resposta.data);

      if (resposta.status === 200 && resposta.data?.token) {
        const user = resposta.data.user;
        const rawRole = user.role;
        const role =
          typeof rawRole === "string" ? rawRole.toUpperCase().trim() : "";

        console.log("ROLE recebido →", role);

        // ✅ Formata o usuário para incluir 'tipo'
        const usuarioFormatado = {
          ...user,
          tipo: role, // ← compatível com os componentes
          token: resposta.data.token,
        };

        // ✅ Salva no localStorage
        localStorage.setItem("user", JSON.stringify(usuarioFormatado));
        localStorage.setItem("token", resposta.data.token);
        localStorage.setItem("role", role); // ← ESSENCIAL para Home.jsx

        // ✅ Atualiza contexto
        setUsuarioLogado(usuarioFormatado);

        // ✅ Redireciona
        navigate("/home");
      } else {
        setErro("Login inválido ou resposta incompleta da API.");
      }
    } catch (err) {
      console.log("ERRO →", err.response || err);

      const mensagem =
        err.response?.data?.mensagem ||
        err.message ||
        "Erro ao conectar com o servidor.";

      setErro(mensagem);
    }
  };

  return (
    <Container className="mt-5 login-container fade-in">
      <h2 className="text-center mb-4">🔐 Entrar</h2>

      {erro && (
        <Alert variant="danger" className="text-center">
          {"Email ou senha inválidos"}
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
