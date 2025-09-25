import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
function Cadastro() {
  const navigate = useNavigate();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: ""
  });

  // Estados de controle
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados de validação
  const [validationErrors, setValidationErrors] = useState({});

  // Função para atualizar dados do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Formatação específica para telefone
    if (name === "telefone") {
      // Remove tudo que não é número
      const numbers = value.replace(/\D/g, "");
      
      // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
      let formatted = numbers;
      if (numbers.length >= 2) {
        formatted = `(${numbers.slice(0, 2)}) `;
        if (numbers.length > 2) {
          if (numbers.length <= 10) {
            // Telefone fixo: (XX) XXXX-XXXX
            formatted += numbers.slice(2, 6);
            if (numbers.length > 6) {
              formatted += `-${numbers.slice(6, 10)}`;
            }
          } else {
            // Celular: (XX) XXXXX-XXXX
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

    // Limpa erros quando usuário digita
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (erro) setErro("");
  };

  // Validação em tempo real
  const validateField = (name, value) => {
    switch (name) {
      case "nome":
        return value.length < 2 ? "Nome deve ter pelo menos 2 caracteres" : "";
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Email inválido" : "";
      case "telefone":
        const phoneNumbers = value.replace(/\D/g, "");
        if (phoneNumbers.length < 10) return "Telefone deve ter pelo menos 10 dígitos";
        if (phoneNumbers.length > 11) return "Telefone deve ter no máximo 11 dígitos";
        return "";
      case "endereco":
        return value.length < 5 ? "Endereço deve ter pelo menos 5 caracteres" : "";
      case "senha":
        return value.length < 6 ? "Senha deve ter pelo menos 6 caracteres" : "";
      case "confirmarSenha":
        return value !== formData.senha ? "Senhas não coincidem" : "";
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

    // Validação adicional de telefone brasileiro
    const phoneNumbers = formData.telefone.replace(/\D/g, "");
    if (phoneNumbers.length >= 10) {
      const ddd = phoneNumbers.slice(0, 2);
      const validDDDs = [
        "11", "12", "13", "14", "15", "16", "17", "18", "19", // SP
        "21", "22", "24", // RJ
        "27", "28", // ES
        "31", "32", "33", "34", "35", "37", "38", // MG
        "41", "42", "43", "44", "45", "46", // PR
        "47", "48", "49", // SC
        "51", "53", "54", "55", // RS
        "61", // DF
        "62", "64", // GO
        "63", // TO
        "65", "66", // MT
        "67", // MS
        "68", // AC
        "69", // RO
        "71", "73", "74", "75", "77", // BA
        "79", // SE
        "81", "87", // PE
        "82", // AL
        "83", // PB
        "84", // RN
        "85", "88", // CE
        "86", "89", // PI
        "91", "93", "94", // PA
        "92", "97", // AM
        "95", // RR
        "96", // AP
        "98", "99"  // MA
      ];
      
      if (!validDDDs.includes(ddd)) {
        errors.telefone = "DDD inválido";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    
    console.log("=== INICIANDO CADASTRO ===");
    console.log("Dados do formulário:", formData);

    // Validação local primeiro
    if (!validateForm()) {
      setErro("Por favor, corrija os erros no formulário.");
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para envio
      const userData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.replace(/\D/g, ""), // Apenas números
        endereco: formData.endereco.trim(),
        senha: formData.senha
      };

      console.log("Dados preparados para envio:", userData);

      // Chamar o serviço de registro
      const response = await register(userData);
      
      console.log("Resposta do cadastro:", response);

      // Sucesso
      setSucesso("Cadastro realizado com sucesso! Redirecionando...");
      
      // Salvar dados do usuário no localStorage (opcional)
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate("/home");
      }, 2000);

    } catch (error) {
      console.error("Erro no cadastro:", error);
      
      // Tratamento específico de erros
      if (error.message) {
        setErro(error.message);
      } else if (error.response?.data?.message) {
        setErro(error.response.data.message);
      } else if (error.response?.status === 400) {
        setErro("Dados inválidos. Verifique as informações e tente novamente.");
      } else if (error.response?.status === 409) {
        setErro("Email já está em uso. Tente fazer login ou use outro email.");
      } else {
        setErro("Erro interno do servidor. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar se senhas coincidem
  const senhasCoincident = formData.senha && formData.confirmarSenha && 
                          formData.senha === formData.confirmarSenha;

  return (
    <Container className="cadastro-container">
      <div className="form-wrapper">
        <h2 className="text-center mb-4">
          🍕 Criar Conta - Tártaro Delivery
        </h2>
        
        {/* Alert de Erro */}
        {erro && (
          <Alert variant="danger" dismissible onClose={() => setErro("")}>
            <strong>Erro:</strong> {erro}
          </Alert>
        )}
        
        {/* Alert de Sucesso */}
        {sucesso && (
          <Alert variant="success" dismissible onClose={() => setSucesso("")}>
            <strong>Sucesso:</strong> {sucesso}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Nome Completo */}
          <Form.Group className="mb-3">
            <Form.Label>Nome Completo</Form.Label>
            <Form.Control
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Digite seu nome completo"
              required
              isInvalid={!!validationErrors.nome}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.nome}
            </Form.Control.Feedback>
          </Form.Group>

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
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Telefone */}
          <Form.Group className="mb-3">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              placeholder="(21) 99999-9999"
              required
              maxLength={15}
              isInvalid={!!validationErrors.telefone}
            />
            <Form.Text className="text-muted">
              Formato: (XX) XXXXX-XXXX para celular 
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              {validationErrors.telefone}
            </Form.Control.Feedback>
          </Form.Group>

        

          {/* Senha */}
          <Form.Group className="mb-3">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              placeholder="Mínimo 6 caracteres"
              required
              isInvalid={!!validationErrors.senha}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.senha}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Confirmar Senha */}
          <Form.Group className="mb-4">
            <Form.Label>Confirmar Senha</Form.Label>
            <Form.Control
              type="password"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleInputChange}
              placeholder="Digite a senha novamente"
              required
              isInvalid={!!validationErrors.confirmarSenha}
              isValid={senhasCoincident}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.confirmarSenha}
            </Form.Control.Feedback>
            <Form.Control.Feedback type="valid">
              Senhas coincidem ✓
            </Form.Control.Feedback>
          </Form.Group>

          {/* Botão de Cadastro */}
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
              "🍕 Criar Conta"
            )}
          </Button>

          {/* Link para Login */}
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