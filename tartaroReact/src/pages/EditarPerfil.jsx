import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function EditarPerfil() {
  const navigate = useNavigate();
  const clienteAtual = JSON.parse(localStorage.getItem("clienteLogado")) || {};
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const [nome, setNome] = useState(clienteAtual?.nome || "");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState(clienteAtual?.email || "");
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const handleTelefoneChange = (e) => {
    const formatted = formatarTelefone(e.target.value);
    setTelefone(formatted);
  };

  const formatarTelefone = (value) => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, "");

    // Aplica a máscara (XX) XXXXX-XXXX
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    // Para números parciais
    if (cleaned.length >= 7) {
      const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{0,4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}${match[3] ? "-" + match[3] : ""}`;
      }
    } else if (cleaned.length >= 3) {
      const match = cleaned.match(/^(\d{2})(\d{1,5})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}`;
      }
    } else if (cleaned.length >= 1) {
      const match = cleaned.match(/^(\d{1,2})$/);
      if (match && match[1].length === 2) {
        return `(${match[1]}) `;
      }
      return match[1];
    }

    return cleaned;
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !nome || !telefone) {
      setErro("Todos os campos são obrigatórios.");
      return;
    }

    const atualizado = { nome, email, telefone };

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
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="tel"
            placeholder="(21) 99999-9999"
            value={telefone}
            onChange={handleTelefoneChange}
            maxLength={15}
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
