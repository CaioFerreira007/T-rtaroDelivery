import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import axios from "axios";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    try {
      await axios.post("http://localhost:5000/api/usuario/esqueci-senha", {
        email,
      });

      setEnviado(true);
    } catch (err) {
      console.error("Erro ao solicitar recuperação:", err);
      setErro(
        "Não foi possível enviar o e-mail. Verifique o endereço e tente novamente."
      );
    }
  }

  return (
    <Container className="mt-5 login-container fade-in">
      <h2 className="text-center mb-4">📧 Recuperar Senha</h2>

      {enviado ? (
        <Alert variant="success" className="text-center">
          Um link foi enviado para seu e-mail! Verifique sua caixa de entrada 📬
        </Alert>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          {erro && (
            <Alert variant="danger" className="text-center">
              {erro}
            </Alert>
          )}

          <Button type="submit" variant="primary" className="w-100">
            Enviar link de recuperação
          </Button>
        </Form>
      )}
    </Container>
  );
}
