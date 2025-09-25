import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    email: "",
    senha: ""
  });
  
  // Estados de controle
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Função para atualizar dados do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpar erros quando usuário digita
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (erro) setErro("");
  };

  // Validação em tempo real
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

  // Validação completa do formulário
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
    console.log("Dados do formulário:", { email: formData.email, senha: "***" });

    // Validação local primeiro
    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }

    // Verificações básicas
    if (!formData.email.trim() || !formData.senha) {
      setErro("Email e senha são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      console.log("Chamando serviço de login...");
      
      const response = await login(formData.email.trim(), formData.senha);
      
      console.log("Login bem-sucedido:", response);

      // Sucesso - redirecionar para home
      navigate("/home");

    } catch (error) {
      console.error("Erro no login:", error);
      
      // Tratamento específico de erros
      if (error.message) {
        setErro(error.message);
      } else if (error.response?.data?.message) {
        setErro(error.response.data.message);
      } else if (error.response?.status === 401) {
        setErro("Email ou senha incorretos. Verifique suas credenciais.");
      } else if (error.response?.status === 400) {
        setErro("Dados inválidos. Verifique as informações e tente novamente.");
      } else if (error.response?.status === 404) {
        setErro("Usuário não encontrado. Verifique o email ou crie uma conta.");
      } else if (error.response?.status >= 500) {
        setErro("Erro interno do servidor. Tente novamente mais tarde.");
      } else {
        setErro("Erro ao fazer login. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="cadastro-container">
      <div className="form-wrapper">
        <h2 className="text-center mb-4">
          🍕 Entrar - Tártaro Delivery
        </h2>
        
        {/* Alert de Erro */}
        {erro && (
          <Alert variant="danger" dismissible onClose={() => setErro("")}>
            <strong>Erro:</strong> {erro}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Email */}
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
              disabled={loading || isLoading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Senha */}
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
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.senha}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Botão de Login */}
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
              "🍕 Entrar"
            )}
          </Button>

          {/* Links de Navegação */}
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