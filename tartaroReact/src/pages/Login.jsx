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
    senha: ""
  });
  
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (erro) setErro("");
  };

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email é obrigatório";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Email inválido" : "";
      case "senha":
        if (!value) return "Senha é obrigatória";
        return value.length < 6 ? "Senha deve ter pelo menos 6 caracteres" : "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    
    console.log("=== INICIANDO LOGIN ===");
    console.log("Email:", formData.email);

    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }

    setLoading(true);

    try {
      console.log("Chamando serviço de login...");
      const usuario = await login(formData.email.trim().toLowerCase(), formData.senha);
      console.log("Login bem-sucedido:", usuario);
      
      // Redirecionar após login bem-sucedido
      const from = location.state?.from?.pathname || "/home";
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error("Erro detalhado no login:", error);
      
      let mensagemErro = "Erro ao fazer login. Tente novamente.";
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.log("Status do erro:", status);
        console.log("Dados do erro:", data);
        
        if (status === 401) {
          mensagemErro = "Email ou senha incorretos.";
        } else if (status === 400) {
          mensagemErro = data?.message || "Dados inválidos.";
        } else if (status >= 500) {
          mensagemErro = "Erro no servidor. Tente novamente mais tarde.";
        } else if (data?.message) {
          mensagemErro = data.message;
        }
      } else if (error.request) {
        mensagemErro = "Erro de conexão. Verifique sua internet.";
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container mt-5">
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Entrar - Tártaro Delivery</h2>
          
          {erro && (
            <Alert variant="danger" dismissible onClose={() => setErro("")}>
              {erro}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
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
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Senha</Form.Label>
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
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.senha}
              </Form.Control.Feedback>
            </Form.Group>

            <Button 
              variant="success" 
              type="submit" 
              size="lg" 
              className="w-100 mb-3"
              disabled={loading || isLoading}
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
              <p className="mb-2">
                <Link to="/esqueci-senha" className="text-decoration-none">
                  Esqueci minha senha
                </Link>
              </p>
              <hr />
              <p className="mb-0">
                Não tem uma conta?{" "}
                <Link to="/cadastro" className="text-decoration-none fw-bold text-success">
                  Cadastre-se aqui
                </Link>
              </p>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;