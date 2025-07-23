import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../styles/Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simula cadastro no localStorage (pode usar banco depois)
    const novoUsuario = { nome, email };
    localStorage.setItem("usuarioLogado", JSON.stringify(novoUsuario));
    setConfirmado(true);

    // limpa campos depois de cadastrar
    setNome("");
    setEmail("");
    setSenha("");
  };

  return (
    <Container className="mt-5 cadastro-container fade-in">
      <h2 className="text-center mb-4">📝 Criar Conta</h2>

      {confirmado && (
        <Alert variant="success" className="text-center">
          Conta criada com sucesso! Bem-vindo(a), {nome}! 🎉
        </Alert>
      )}

      {!confirmado && (
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

          <Button type="submit" variant="success" className="w-100 mt-3">
            ✅ Criar Conta
          </Button>
        </Form>
      )}
    </Container>
  );
}

export default Cadastro;
