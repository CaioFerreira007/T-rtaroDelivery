import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Card, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axiosConfig from "../services/axiosConfig";

export default function AlterarSenha() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const [tokenValido, setTokenValido] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function validarToken() {
      try {
        const response = await axiosConfig.get(
          `/auth/validar-token-reset/${token}`
        );
        setTokenValido(true);
        setFormData((prev) => ({ ...prev, email: response.data.email }));
      } catch (err) {
        setTokenValido(false);
        setErro(
          err.response?.data ||
            "Token inválido ou expirado. Solicite um novo link."
        );
      }
    }

    if (token) {
      validarToken();
    } else {
      setTokenValido(false);
      setErro("Token não fornecido na URL.");
    }
  }, [token]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    if (formData.novaSenha !== formData.confirmarSenha) {
      setErro("As senhas não conferem.");
      setCarregando(false);
      return;
    }
    if (formData.novaSenha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      setCarregando(false);
      return;
    }

    try {
      await axiosConfig.post("/auth/alterar-senha", {
        token: token,
        email: formData.email,
        novaSenha: formData.novaSenha,
      });

      setSucesso(true);
      setTimeout(() => navigate("/login"), 5000);
    } catch (err) {
      setErro(err.response?.data || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  // Estado de Carregamento (validando token)
  if (tokenValido === null) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Validando token...</p>
      </Container>
    );
  }

  // Estado de Token Inválido
  if (tokenValido === false) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="danger">
          <h4>❌ Token Inválido</h4>
          <p>{erro}</p>
        </Alert>
        <Button variant="primary" onClick={() => navigate("/esqueci-senha")}>
          Solicitar Novo Link
        </Button>
      </Container>
    );
  }

  // Estado de Sucesso
  if (sucesso) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="success">
          <h4>✅ Senha Alterada com Sucesso!</h4>
          <p>
            Você será redirecionado para a tela de login em alguns segundos.
          </p>
        </Alert>
        <Button variant="primary" onClick={() => navigate("/login")}>
          Ir para Login Agora
        </Button>
      </Container>
    );
  }

  // Estado Principal: Formulário para alterar a senha
  return (
    <Container className="mt-5 login-container fade-in">
      <Card>
        <Card.Header as="h4" className="text-center">
          🔑 Nova Senha
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nova Senha</Form.Label>
              <Form.Control
                type="password"
                name="novaSenha"
                value={formData.novaSenha}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Digite a nova senha"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirmar Nova Senha</Form.Label>
              <Form.Control
                type="password"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Confirme a nova senha"
                isInvalid={
                  formData.confirmarSenha &&
                  formData.novaSenha !== formData.confirmarSenha
                }
              />
            </Form.Group>

            {erro && (
              <Alert variant="danger" className="text-center">
                {erro}
              </Alert>
            )}

            <Button
              type="submit"
              variant="success"
              className="w-100"
              disabled={carregando}
            >
              {carregando ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                "Salvar Nova Senha"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
