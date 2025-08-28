import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Card } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosConfig from "../Services/axiosConfig";

export default function AlterarSenha() {
  const { token } = useParams(); // Token vem da URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const [tokenValido, setTokenValido] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Valida o token ao carregar o componente
  useEffect(() => {
    if (token) {
      validarToken();
    } else {
      setTokenValido(false);
      setErro("Token não fornecido na URL.");
    }
  }, [token]);

  async function validarToken() {
    try {
      const response = await axiosConfig.get(
        `/cliente/validar-token-reset/${token}`
      );
      setTokenValido(true);
      setTokenInfo(response.data);
      setFormData((prev) => ({ ...prev, email: response.data.email }));
    } catch (err) {
      setTokenValido(false);
      setErro(
        err.response?.data ||
          "Token inválido ou expirado. Solicite um novo link de recuperação."
      );
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    // Validação das senhas
    if (formData.novaSenha !== formData.confirmarSenha) {
      setErro("As senhas não conferem.");
      setCarregando(false);
      return;
    }

    if (formData.novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setCarregando(false);
      return;
    }

    try {
      await axiosConfig.post("/cliente/alterar-senha", {
        token: token,
        email: formData.email,
        novaSenha: formData.novaSenha,
      });

      setSucesso(true);

      // Redireciona para login após 5 segundos
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      setErro(
        err.response?.data ||
          "Erro ao alterar senha. Tente novamente ou solicite um novo link."
      );
    } finally {
      setCarregando(false);
    }
  }

  // Token inválido
  if (tokenValido === false) {
    return (
      <Container className="mt-5 login-container fade-in">
        <Card className="text-center">
          <Card.Body>
            <Alert variant="danger">
              <h4>❌ Token Inválido</h4>
              <p>{erro}</p>
            </Alert>
            <div className="d-grid gap-2">
              <Button
                variant="primary"
                onClick={() => navigate("/recuperar-senha")}
              >
                Solicitar Novo Link
              </Button>
              <Link to="/login" className="btn btn-outline-secondary">
                Voltar ao Login
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Carregando validação do token
  if (tokenValido === null) {
    return (
      <Container className="mt-5 text-center">
        <Card>
          <Card.Body>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3 mb-0">Validando token...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Sucesso
  if (sucesso) {
    return (
      <Container className="mt-5 login-container fade-in">
        <Card className="text-center">
          <Card.Body>
            <Alert variant="success">
              <h4>✅ Senha Alterada com Sucesso!</h4>
              <p>
                Sua senha foi alterada com sucesso para:{" "}
                <strong>{formData.email}</strong>
              </p>
              <p>Você será redirecionado para o login em alguns segundos...</p>
            </Alert>
            <Button
              variant="primary"
              onClick={() => navigate("/login")}
              className="w-100"
            >
              Ir para Login Agora
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Formulário principal
  return (
    <Container className="mt-5 login-container fade-in">
      <Card>
        <Card.Header className="text-center">
          <h2 className="mb-0">🔑 Nova Senha</h2>
          {tokenInfo && (
            <small className="text-muted">
              Token expira em:{" "}
              {new Date(tokenInfo.expiraEm).toLocaleString("pt-BR")}
            </small>
          )}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                readOnly
                className="bg-light"
              />
              <Form.Text className="text-muted">
                E-mail associado ao token de recuperação
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nova Senha *</Form.Label>
              <Form.Control
                type="password"
                name="novaSenha"
                placeholder="Digite sua nova senha"
                value={formData.novaSenha}
                onChange={handleChange}
                required
                minLength={6}
                disabled={carregando}
              />
              <Form.Text className="text-muted">
                A senha deve ter pelo menos 6 caracteres
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirmar Nova Senha *</Form.Label>
              <Form.Control
                type="password"
                name="confirmarSenha"
                placeholder="Confirme sua nova senha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
                minLength={6}
                disabled={carregando}
                className={
                  formData.confirmarSenha &&
                  formData.novaSenha !== formData.confirmarSenha
                    ? "is-invalid"
                    : formData.confirmarSenha &&
                      formData.novaSenha === formData.confirmarSenha
                    ? "is-valid"
                    : ""
                }
              />
              {formData.confirmarSenha &&
                formData.novaSenha !== formData.confirmarSenha && (
                  <div className="invalid-feedback">As senhas não conferem</div>
                )}
              {formData.confirmarSenha &&
                formData.novaSenha === formData.confirmarSenha && (
                  <div className="valid-feedback">Senhas conferem!</div>
                )}
            </Form.Group>

            {erro && (
              <Alert variant="danger" className="text-center">
                {erro}
              </Alert>
            )}

            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={
                  carregando || formData.novaSenha !== formData.confirmarSenha
                }
              >
                {carregando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Alterando Senha...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>

              <Link to="/login" className="btn btn-outline-secondary">
                Cancelar e Voltar ao Login
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
