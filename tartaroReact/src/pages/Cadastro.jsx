import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Cadastro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: "", email: "", telefone: "", endereco: "", senha: "", confirmarSenha: ""
  });
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
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
      case "nome": return value.length < 2 ? "Nome deve ter pelo menos 2 caracteres" : "";
      case "email": return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Email inválido" : "";
      case "telefone":
        const phone = value.replace(/\D/g, "");
        return phone.length < 10 || phone.length > 11 ? "Telefone deve ter 10 ou 11 dígitos" : "";
      case "endereco": return value.length < 5 ? "Endereço deve ter pelo menos 5 caracteres" : "";
      case "senha": return value.length < 6 ? "Senha deve ter pelo menos 6 caracteres" : "";
      case "confirmarSenha": return value !== formData.senha ? "Senhas não coincidem" : "";
      default: return "";
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
    setSucesso("");
    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }
    
    setLoading(true);
    try {
      await register(formData);
      setSucesso("Cadastro realizado com sucesso! Redirecionando...");
      setTimeout(() => navigate("/home"), 1500);
    } catch (error) {
      setErro(error.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const senhasCoincident = formData.senha && formData.confirmarSenha && formData.senha === formData.confirmarSenha;

  return (
    <Container className="cadastro-container">
      <div className="form-wrapper">
        <h2 className="text-center mb-4">Criar Conta - Tártaro Delivery</h2>
        {erro && <Alert variant="danger" dismissible onClose={() => setErro("")}><strong>Erro:</strong> {erro}</Alert>}
        {sucesso && <Alert variant="success"><strong>Sucesso:</strong> {sucesso}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nome Completo</Form.Label>
            <Form.Control type="text" name="nome" value={formData.nome} onChange={handleInputChange} required isInvalid={!!validationErrors.nome} />
            <Form.Control.Feedback type="invalid">{validationErrors.nome}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>E-mail</Form.Label>
            <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required isInvalid={!!validationErrors.email} />
            <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Telefone</Form.Label>
            <Form.Control type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} required isInvalid={!!validationErrors.telefone} />
            <Form.Control.Feedback type="invalid">{validationErrors.telefone}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Endereço</Form.Label>
            <Form.Control type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} required isInvalid={!!validationErrors.endereco} />
            <Form.Control.Feedback type="invalid">{validationErrors.endereco}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Senha</Form.Label>
            <Form.Control type="password" name="senha" value={formData.senha} onChange={handleInputChange} required isInvalid={!!validationErrors.senha} />
            <Form.Control.Feedback type="invalid">{validationErrors.senha}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Confirmar Senha</Form.Label>
            <Form.Control type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleInputChange} required isInvalid={!!validationErrors.confirmarSenha} isValid={senhasCoincident} />
            <Form.Control.Feedback type="invalid">{validationErrors.confirmarSenha}</Form.Control.Feedback>
          </Form.Group>
          <Button variant="success" type="submit" size="lg" className="w-100 mb-3" disabled={loading || !senhasCoincident}>
            {loading ? "Criando conta..." : "Criar Conta"}
          </Button>
          <div className="text-center">
            <p className="mb-0">Já tem uma conta? <Link to="/login" className="text-decoration-none fw-bold">Faça login aqui</Link></p>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Cadastro;