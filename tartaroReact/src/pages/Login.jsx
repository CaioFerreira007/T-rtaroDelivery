import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({ email: "", senha: "" });
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
    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }

    setLoading(true);
    try {
      await login(formData.email.trim(), formData.senha);
      navigate("/home");
    } catch (error) {
      setErro(error.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="exemplo@email.com"
              required
              isInvalid={!!validationErrors.email}
              disabled={loading || authLoading}
            />
            <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
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
              disabled={loading || authLoading}
            />
            <Form.Control.Feedback type="invalid">{validationErrors.senha}</Form.Control.Feedback>
          </Form.Group>

          <Button 
            variant="success" 
            type="submit" 
            size="lg" 
            className="w-100 mb-3"
            disabled={loading || authLoading}
          >
            {loading || authLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Entrando...</>
            ) : ("Entrar")}
          </Button>

          <div className="text-center">
            <p className="mb-2">
              <Link to="/esqueci-senha" className="text-decoration-none">Esqueci minha senha</Link>
            </p>
            <p className="mb-0">
              Não tem uma conta? <Link to="/cadastro" className="text-decoration-none fw-bold">Cadastre-se aqui</Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Login;