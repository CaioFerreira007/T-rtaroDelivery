import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Cadastro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    senha: "",
    confirmarSenha: ""
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "telefone") {
      const numbers = value.replace(/\D/g, "");
      let formatted = numbers;
      
      if (numbers.length >= 2) {
        formatted = `(${numbers.slice(0, 2)}) `;
        if (numbers.length > 2) {
          if (numbers.length <= 10) {
            formatted += numbers.slice(2, 6);
            if (numbers.length > 6) {
              formatted += `-${numbers.slice(6, 10)}`;
            }
          } else {
            formatted += numbers.slice(2, 7);
            if (numbers.length > 7) {
              formatted += `-${numbers.slice(7, 11)}`;
            }
          }
        }
      }
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (erro) setErro("");
  };

  const validateField = (name, value) => {
    switch (name) {
      case "nome":
        return value.trim().length < 2 ? "Nome deve ter pelo menos 2 caracteres" : "";
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Email inválido" : "";
      case "telefone":
        const phoneNumbers = value.replace(/\D/g, "");
        if (phoneNumbers.length < 10) return "Telefone deve ter pelo menos 10 dígitos";
        if (phoneNumbers.length > 11) return "Telefone deve ter no máximo 11 dígitos";
        const ddd = parseInt(phoneNumbers.slice(0, 2));
        if (ddd < 11 || ddd > 99) return "DDD inválido";
        if (phoneNumbers.length === 11 && phoneNumbers[2] !== '9') {
          return "Celular deve começar com 9 após o DDD";
        }
        return "";
      case "endereco":
        return value.trim().length < 5 ? "Endereço deve ter pelo menos 5 caracteres" : "";
      case "senha":
        return value.length < 6 ? "Senha deve ter pelo menos 6 caracteres" : "";
      case "confirmarSenha":
        return value !== formData.senha ? "Senhas não coincidem" : "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'confirmarSenha') {
        const error = validateField(key, formData[key]);
        if (error) errors[key] = error;
      }
    });
    
    if (formData.senha !== formData.confirmarSenha) {
      errors.confirmarSenha = "Senhas não coincidem";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    
    console.log("=== INICIANDO CADASTRO ===");

    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.replace(/\D/g, ""),
        endereco: formData.endereco.trim(),
        senha: formData.senha
      };

      console.log("Dados preparados para envio:", { ...userData, senha: "***" });

      await register(userData);
      
      setSucesso("Cadastro realizado com sucesso! Redirecionando...");
      
      setTimeout(() => {
        navigate("/home");
      }, 1500);

    } catch (error) {
      console.error("Erro no cadastro:", error);
      
      let mensagemErro = "Erro ao realizar cadastro.";
      
      if (error.response?.status === 409) {
        mensagemErro = "Email ou telefone já cadastrado.";
      } else if (error.response?.status === 400) {
        mensagemErro = error.response?.data?.message || "Dados inválidos.";
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

  const senhasCoincident = formData.senha && formData.confirmarSenha && 
                          formData.senha === formData.confirmarSenha;

  return (
    <Container className="cadastro-container">
      <div className="form-wrapper">
        <h2 className="text-center mb-4">Criar Conta - Tártaro Delivery</h2>
        
        {erro && (
          <Alert variant="danger" dismissible onClose={() => setErro("")}>
            <strong>Erro:</strong> {erro}
          </Alert>
        )}
        
        {sucesso && (
          <Alert variant="success">
            <strong>Sucesso:</strong> {sucesso}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nome Completo *</Form.Label>
            <Form.Control
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Digite seu nome completo"
              required
              isInvalid={!!validationErrors.nome}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.nome}
            </Form.Control.Feedback>
          </Form.Group>

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
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Telefone *</Form.Label>
            <Form.Control
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              placeholder="(21) 99999-9999"
              required
              maxLength={15}
              isInvalid={!!validationErrors.telefone}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Formato: (XX) XXXXX-XXXX para celular
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              {validationErrors.telefone}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Endereço *</Form.Label>
            <Form.Control
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleInputChange}
              placeholder="Rua, número, bairro, cidade"
              required
              isInvalid={!!validationErrors.endereco}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.endereco}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Senha *</Form.Label>
            <Form.Control
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              placeholder="Mínimo 6 caracteres"
              required
              isInvalid={!!validationErrors.senha}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.senha}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Confirmar Senha *</Form.Label>
            <Form.Control
              type="password"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleInputChange}
              placeholder="Digite a senha novamente"
              required
              isInvalid={!!validationErrors.confirmarSenha}
              isValid={senhasCoincident}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.confirmarSenha}
            </Form.Control.Feedback>
            <Form.Control.Feedback type="valid">
              Senhas coincidem ✓
            </Form.Control.Feedback>
          </Form.Group>

          <Button 
            variant="success" 
            type="submit" 
            size="lg" 
            className="w-100 mb-3"
            disabled={loading || !senhasCoincident}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>

          <div className="text-center">
            <p className="mb-0">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-decoration-none fw-bold">
                Faça login aqui
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Cadastro;