import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const { setUsuarioLogado } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem!");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5120/api/cliente/cadastro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nome, email, senha }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro ao criar conta.");
      }

      const data = await response.json();

      // 🔒 Autenticação automática
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          nome: data.nome,
          email: data.email,
          tipo: "cliente",
        })
      );

      setUsuarioLogado({
        nome: data.nome,
        email: data.email,
        tipo: "cliente",
      });

      // 🏠 Redireciona para a home
      navigate("/home");
    } catch (error) {
      setErro(error.message);
      console.error("Falha no cadastro:", error);
    }
  };

  return (
    <Container className="mt-5 cadastro-container fade-in">
      <h2 className="text-center mb-4">📝 Criar Conta</h2>

      {erro && (
        <Alert variant="danger" className="text-center">
          {erro}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome completo</Form.Label>
          <Form.Control
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Form.Group>

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
            placeholder="Crie uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Confirmar Senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Repita sua senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mt-3">
          ✅ Criar Conta
        </Button>
      </Form>
    </Container>
  );
}

export default Cadastro;
