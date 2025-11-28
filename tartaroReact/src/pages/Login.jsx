import React, { useState } from "react";
import { Container, Form, Button, Alert, Spinner, Card } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpar erro específico do campo ao digitar
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Limpar erro geral
    if (erro) setErro("");
  };

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) return " Email é obrigatório";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
<<<<<<< HEAD
        return !emailRegex.test(value) ? " Formato de email inválido" : "";
      case "senha":
        if (!value) return " Senha é obrigatória";
        return value.length < 6
          ? " Senha deve ter pelo menos 6 caracteres"
=======
        return !emailRegex.test(value) ? "📧Formato de email inválido" : "";
      case "senha":
        if (!value) return " Senha é obrigatória";
        return value.length < 6
          ? "Senha deve ter pelo menos 6 caracteres"
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1
          : "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

<<<<<<< HEAD
    // console.log("=== INICIANDO LOGIN ===");
    // console.log(" Email:", formData.email);
=======
    console.log("=== INICIANDO LOGIN ===");
    console.log(" Email:", formData.email);
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1

    // Validação do formulário
    if (!validateForm()) {
      setErro(" Por favor, corrija os erros destacados no formulário.");
      return;
    }

    setLoading(true);

    try {
      console.log(" Autenticando usuário...");

      const usuario = await login(
        formData.email.trim().toLowerCase(),
        formData.senha
      );

<<<<<<< HEAD
      console.log(" Login realizado com sucesso:", usuario?.nome);
=======
      console.log("Login realizado com sucesso:", usuario?.nome);
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1

      // Aguardar um pouco antes de navegar para melhor UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Redirecionar para a página anterior ou home
      const from = location.state?.from?.pathname || "/home";
<<<<<<< HEAD
      console.log(" Redirecionando para:", from);
      navigate(from, { replace: true });
    } catch (error) {
      // console.error(" Erro no login:", error);
=======
      console.log("Redirecionando para:", from);
      navigate(from, { replace: true });
    } catch (error) {
      console.error(" Erro no login:", error);
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1

      let mensagemErro = {
        titulo: "Erro ao fazer login",
        descricao: "Ocorreu um erro inesperado. Tente novamente.",
        tipo: "danger",
      };

      // Tratamento específico por tipo de erro
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

<<<<<<< HEAD
        // console.log(" Status HTTP:", status);
        // console.log(" Resposta do servidor:", data);
=======
        console.log("Status HTTP:", status);
        console.log(" Resposta do servidor:", data);
>>>>>>> 61025b9085bd35456f10bb5aef64ba96023140b1

        switch (status) {
          case 400:
            mensagemErro = {
              titulo: "Dados Inválidos",
              descricao:
                data?.message ||
                "Verifique se os campos estão preenchidos corretamente.",
              tipo: "warning",
            };
            break;

          case 401:
            mensagemErro = {
              titulo: "Credenciais Incorretas",
              descricao:
                "Email ou senha incorretos. Verifique seus dados e tente novamente.",
              tipo: "danger",
            };
            break;

          case 403:
            mensagemErro = {
              titulo: "Acesso Negado",
              descricao:
                "Sua conta pode estar inativa. Entre em contato com o suporte.",
              tipo: "warning",
            };
            break;

          case 404:
            mensagemErro = {
              titulo: "Usuário Não Encontrado",
              descricao:
                "Não encontramos uma conta com este email. Deseja se cadastrar?",
              tipo: "info",
            };
            break;

          case 429:
            mensagemErro = {
              titulo: "Muitas Tentativas",
              descricao:
                "Você fez muitas tentativas. Aguarde alguns minutos e tente novamente.",
              tipo: "warning",
            };
            break;

          case 500:
          case 502:
          case 503:
            mensagemErro = {
              titulo: "Erro no Servidor",
              descricao:
                "Nossos servidores estão temporariamente indisponíveis. Tente novamente em alguns minutos.",
              tipo: "danger",
            };
            break;

          default:
            if (data?.message) {
              mensagemErro = {
                titulo: "Erro",
                descricao: data.message,
                tipo: "danger",
              };
            }
        }
      } else if (error.request) {
        // Erro de rede/conexão
        console.error(" Erro de conexão:", error.request);
        mensagemErro = {
          titulo: "Erro de Conexão",
          descricao:
            "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.",
          tipo: "warning",
        };
      } else if (error.message) {
        // Erro genérico
        mensagemErro = {
          titulo: "Erro",
          descricao: error.message,
          tipo: "danger",
        };
      }

      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container mt-5">
      <Card
        className="shadow-lg border-0"
        style={{ maxWidth: "450px", margin: "0 auto" }}
      >
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Tártaro Delivery</h2>
            <p className="text-muted">Faça login para continuar</p>
          </div>

          {erro && (
            <Alert
              variant={erro.tipo || "danger"}
              dismissible
              onClose={() => setErro("")}
              className="mb-4"
            >
              <Alert.Heading className="h6 mb-2">
                {erro.titulo || "Erro"}
              </Alert.Heading>
              <p className="mb-0 small">{erro.descricao || erro}</p>
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">E-mail</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                required
                isInvalid={!!validationErrors.email}
                disabled={loading || isLoading}
                autoComplete="email"
                autoFocus
                size="lg"
                className="border-2"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Senha</Form.Label>
              <Form.Control
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                required
                isInvalid={!!validationErrors.senha}
                disabled={loading || isLoading}
                autoComplete="current-password"
                size="lg"
                className="border-2"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.senha}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              variant="success"
              type="submit"
              size="lg"
              className="w-100 mb-3 fw-semibold"
              disabled={loading || isLoading}
              style={{
                padding: "12px",
                fontSize: "1.1rem",
                boxShadow: "0 4px 12px rgba(25, 135, 84, 0.3)",
              }}
            >
              {loading || isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="text-center">
              <p className="mb-3">
                <Link
                  to="/esqueci-senha"
                  className="text-decoration-none text-muted small"
                  style={{ fontSize: "0.9rem" }}
                >
                  Esqueci minha senha
                </Link>
              </p>

              <hr className="my-3" />

              <div className="bg-light p-3 rounded">
                <p className="mb-0 small">
                  Não tem uma conta?{" "}
                  <Link
                    to="/cadastro"
                    className="text-decoration-none fw-bold text-success"
                  >
                    Cadastre-se grátis
                  </Link>
                </p>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
