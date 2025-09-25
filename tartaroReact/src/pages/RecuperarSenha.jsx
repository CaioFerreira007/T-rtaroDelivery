import React, { useState } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import axiosConfig from "../services/axiosConfig";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [validationError, setValidationError] = useState("");

  const validateEmail = (email) => {
    if (!email.trim()) return "Email é obrigatório";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email) ? "Formato de email inválido" : "";
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setEmail(value);
    
    // Limpar erros
    if (validationError) setValidationError("");
    if (erro) setErro("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      await axiosConfig.post("/auth/esqueci-senha", { 
        email: email.trim() 
      });

      setEnviado(true);
    } catch (err) {
      console.error("Erro ao solicitar recuperação de senha:", err);
      
      let mensagem = "Não foi possível processar a solicitação. Tente novamente.";
      
      if (err.response?.status === 404) {
        mensagem = "Email não encontrado em nossa base de dados.";
      } else if (err.response?.status === 429) {
        mensagem = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
      } else if (err.response?.status >= 500) {
        mensagem = "Erro no servidor. Tente novamente mais tarde.";
      } else if (!err.response) {
        mensagem = "Erro de conexão. Verifique sua internet.";
      } else if (err.response?.data?.message) {
        mensagem = err.response.data.message;
      }
      
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Container className="mt-5 login-container fade-in">
      <div className="form-wrapper">
        <h2 className="text-center mb-4">Recuperar Senha</h2>

        {enviado ? (
          <Alert variant="success" className="text-center">
            <Alert.Heading>Solicitação Enviada!</Alert.Heading>
            <p>
              Se o e-mail <strong>{email}</strong> existir em nossa base de dados,
              um link de recuperação será enviado em breve.
            </p>
            <p className="small text-muted">
              Verifique sua caixa de entrada e também a pasta de spam.
            </p>
            <hr />
            <Link to="/login" className="btn btn-success">
              Voltar ao Login
            </Link>
          </Alert>
        ) : (
          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>
                Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="Digite seu email cadastrado"
                value={email}
                onChange={handleInputChange}
                required
                isInvalid={!!validationError}
                disabled={carregando}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
              />
              <Form.Control.Feedback type="invalid">
                {validationError}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Digite o email que você usou para se cadastrar.
              </Form.Text>
            </Form.Group>

            {erro && (
              <Alert variant="danger" dismissible onClose={() => setErro("")}>
                <Alert.Heading>Erro</Alert.Heading>
                <p className="mb-0">{erro}</p>
              </Alert>
            )}

            <Button
              type="submit"
              variant="success"
              size="lg"
              className="w-100 mb-3"
              disabled={carregando || !email.trim()}
            >
              {carregando ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Enviando...
                </>
              ) : (
                "Enviar Link de Recuperação"
              )}
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-decoration-none text-success fw-semibold"
                tabIndex={carregando ? -1 : 0}
              >
                ← Voltar ao login
              </Link>
            </div>
          </Form>
        )}
      </div>
    </Container>
  );
}