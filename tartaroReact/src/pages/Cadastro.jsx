import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const { setUsuarioLogado } = useContext(AuthContext);
  const navigate = useNavigate();

  // Função para formatar o telefone com máscara
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

  const handleTelefoneChange = (e) => {
    const formatted = formatarTelefone(e.target.value);
    setTelefone(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem!");
      return;
    }

    // Validação básica do telefone
    const telefoneNumeros = telefone.replace(/\D/g, "");
    if (telefoneNumeros.length !== 11) {
      setErro("Por favor, insira um telefone válido com DDD!");
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
          body: JSON.stringify({ nome, email, telefone, senha }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro ao criar conta.");
      }

      const data = await response.json();

      // Debug: vamos ver o que o backend está retornando
      console.log("Resposta do backend:", data);
      console.log("Dados enviados:", { nome, email, telefone, senha: "***" });

      // 🔒 Autenticação automática
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          nome: data.nome || nome,
          email: data.email || email,
          telefone: data.telefone || telefone, // usa o telefone do backend ou o que foi digitado
          tipo: "cliente",
        })
      );

      setUsuarioLogado({
        nome: data.nome || nome,
        email: data.email || email,
        telefone: data.telefone || telefone, // usa o telefone do backend ou o que foi digitado
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
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="tel"
            placeholder="(21) 99999-9999"
            value={telefone}
            onChange={handleTelefoneChange}
            maxLength={15}
            required
          />
          <Form.Text className="text-muted">
            Digite seu telefone com DDD
          </Form.Text>
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
