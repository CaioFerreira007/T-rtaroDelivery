import React, { useState, useContext, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosConfig from "../Services/axiosConfig";

function EditarPerfil() {
  const navigate = useNavigate();
  const { usuariologado, setUsuarioLogado } = useContext(AuthContext);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
  });
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (usuariologado) {
      setForm({
        nome: usuariologado.nome || "",
        telefone: usuariologado.telefone || "",
      });
      setCarregando(false);
    }
  }, [usuariologado]);

  const formatarTelefone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  // Função genérica para qualquer campo
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((formAtual) => ({
      ...formAtual,
      [name]: value,
    }));
  };

  // Função específica para o telefone, que formata E atualiza o estado corretamente
  const handleTelefoneChange = (e) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setForm((formAtual) => ({
      ...formAtual,
      telefone: valorFormatado,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso(false);
    setCarregando(true);

    try {
      const response = await axiosConfig.put("/cliente/perfil", form);
      const usuarioAtualizado = { ...response.data, tipo: response.data.role };

      setUsuarioLogado(usuarioAtualizado);
      localStorage.setItem("user", JSON.stringify(usuarioAtualizado));

      setSucesso(true);
      setTimeout(() => navigate("/perfil"), 2000);
    } catch (err) {
      // Tenta pegar a mensagem de erro específica do backend
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        setErro(firstError[0]);
      } else {
        setErro(
          err.response?.data?.message ||
            err.response?.data ||
            "Erro ao atualizar os dados."
        );
      }
    } finally {
      setCarregando(false);
    }
  };

  if (carregando && !sucesso) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Carregando perfil...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">✏️ Editar Conta</h2>

      {sucesso && (
        <Alert variant="success" className="text-center">
          Dados atualizados com sucesso! 🎉 Redirecionando...
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
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="email"
            value={form.email}
            name="email"
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="tel"
            name="telefone"
            placeholder="(21) 99999-9999"
            value={form.telefone}
            onChange={handleTelefoneChange} // <-- Usa a função corrigida
            maxLength={15}
            required
          />
        </Form.Group>

        <Button
          type="submit"
          variant="success"
          className="w-100 mt-3"
          disabled={carregando}
        >
          {carregando ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            "💾 Salvar Alterações"
          )}
        </Button>
      </Form>
    </Container>
  );
}

export default EditarPerfil;
