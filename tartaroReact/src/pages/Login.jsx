import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isLoggedIn, isInitialized } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    senha: ""
  });
  
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isInitialized && isLoggedIn) {
      navigate("/home", { replace: true });
    }
  }, [isLoggedIn, isInitialized, navigate]);

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Email inválido" : "";
      case "senha":
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

    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }

    if (!formData.email.trim() || !formData.senha) {
      setErro("Email e senha são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      console.log("Chamando serviço de login...");
      await login(formData.email.trim(), formData.senha);
      console.log("Login bem-sucedido");
    } catch (error) {
      console.error("Erro no login:", error);
      
      let mensagemErro = "Erro ao fazer login.";
      
      if (error.response?.status === 401) {
        mensagemErro = "Email ou senha incorretos.";
      } else if (error.response?.status === 400) {
        mensagemErro = "Dados inválidos.";
      } else if (error.message) {
        mensagemErro = error.message;
      } else if (error.response?.status >= 500) {
        mensagemErro = "Erro interno do servidor. Tente novamente.";
      }
      
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <Container className="cadastro-container">
        <div className="form-wrapper text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Carregando...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="cadastro-container">
      <div className="form-wrapper">
        <h2 className="text-center mb-4">Entrar - Tártaro Delivery</h2>
        
        {erro && (
          <Alert variant="danger" dismissible onClose={() => setErro("")}>
            <strong>Erro:</strong> {erro}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>E-mail *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="exemplo@email.com"
              required
              isInvalid={!!validationErrors.email}
              disabled={loading || isLoading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Senha *</Form.Label>
            <Form.Control
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              placeholder="Digite sua senha"
              required
              isInvalid={!!validationErrors.senha}
              disabled={loading || isLoading}
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
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
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
            <p className="mb-0">
              Não tem uma conta?{" "}
              <Link to="/cadastro" className="text-decoration-none fw-bold">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Login;