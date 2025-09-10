import React, { useState } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import axiosConfig from "../Services/axiosConfig";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      // CORREÇÃO: Apontando para a URL correta no AuthController
      // E enviando apenas o objeto { email }, como o DTO do backend espera.
      await axiosConfig.post("/auth/esqueci-senha", { email });

      setEnviado(true);
    } catch (err) {
      const mensagem =
        err.response?.data ||
        "Não foi possível processar a solicitação. Tente novamente.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Container className="mt-5 login-container fade-in">
      <h2 className="text-center mb-4">📧 Recuperar Senha</h2>

      {enviado ? (
        <Alert variant="success" className="text-center">
          <h4>✅ Solicitação Enviada!</h4>
          <p>
            Se o e-mail <strong>{email}</strong> existir em nossa base de dados,
            um link de recuperação será enviado.
          </p>
          <p>📬 Verifique sua caixa de entrada (e também a pasta de spam).</p>
          <hr />
          <Link to="/login" className="btn btn-primary">
            Voltar ao Login
          </Link>
        </Alert>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              placeholder="Digite seu e-mail cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={carregando}
            />
          </Form.Group>

          {erro && (
            <Alert variant="danger" className="text-center">
              {erro}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-100 mb-3"
            disabled={carregando}
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
              "Enviar link de recuperação"
            )}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-decoration-none">
              ← Voltar ao login
            </Link>
          </div>
        </Form>
      )}
    </Container>
  );
}
