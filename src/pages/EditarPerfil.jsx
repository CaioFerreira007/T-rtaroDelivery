import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function EditarPerfil() {
  const navigate = useNavigate();
  const clienteAtual = JSON.parse(localStorage.getItem("clienteLogado")) || {};
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const [nome, setNome] = useState(clienteAtual?.nome || "");
  const [email, setEmail] = useState(clienteAtual?.email || "");
  const [senha, setSenha] = useState(clienteAtual?.senha || "");
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !nome || !senha) {
      setErro("Todos os campos são obrigatórios.");
      return;
    }

    const atualizado = { nome, email, senha };

    const novaLista = usuarios.map((user) =>
      user.email === clienteAtual.email ? atualizado : user
    );

    localStorage.setItem("usuarios", JSON.stringify(novaLista));
    localStorage.setItem("clienteLogado", JSON.stringify(atualizado));
    setSucesso(true);
    setErro("");

    setTimeout(() => navigate("/perfil"), 1500);
  };

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">✏️ Editar Conta</h2>

      {sucesso && (
        <Alert variant="success" className="text-center">
          Dados atualizados com sucesso! 🎉
        </Alert>
      )}

      {erro && (
        <Alert variant="danger" className="text-center">
          {erro}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Senha</Form.Label>
          <Form.Control
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mt-3">
          💾 Salvar Alterações
        </Button>
      </Form>
    </Container>
  );
}

export default EditarPerfil;
