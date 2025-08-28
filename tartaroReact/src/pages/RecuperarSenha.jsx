import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
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
      // Debug: Log da requisição que está sendo enviada
      console.log(
        "🚀 Enviando requisição para:",
        "/cliente/solicitar-recuperacao-senha"
      );
      console.log("📧 Email enviado:", email);
      console.log("📦 Dados da requisição:", { email });

      // GAMBIARRA: O backend espera AlterarSenhaDTO mas deveria ser SolicitarRecuperacaoDTO
      const response = await axiosConfig.post("/cliente/esqueci-senha", {
        email,
        token: "", // Campo obrigatório mas não usado neste endpoint
        novaSenha: "temp123", // Campo obrigatório mas não usado neste endpoint
      });

      console.log("✅ Resposta da API:", response);
      setEnviado(true);
    } catch (err) {
      console.error("❌ Erro completo:", err);
      console.error("📍 Status do erro:", err.response?.status);
      console.error("🔍 Headers da resposta:", err.response?.headers);
      console.error("📝 URL da requisição:", err.config?.url);
      console.error("🛠 Método da requisição:", err.config?.method);
      console.log("Tipo de err.response?.data:", typeof err.response?.data);
      console.log("Valor de err.response?.data:", err.response?.data);

      // ✅ Tratamento seguro do erro para garantir que sempre seja uma string
      let mensagemErro =
        "Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.";

      if (err.response?.data) {
        // Se for string, usa diretamente
        if (typeof err.response.data === "string") {
          mensagemErro = err.response.data;
        }
        // Se for objeto com propriedade message
        else if (err.response.data.message) {
          mensagemErro = err.response.data.message;
        }
        // Se for objeto com propriedade error
        else if (err.response.data.error) {
          mensagemErro = err.response.data.error;
        }
        // Se for objeto com propriedade msg
        else if (err.response.data.msg) {
          mensagemErro = err.response.data.msg;
        }
        // Se for objeto de validação com title (erro ASP.NET Core)
        else if (err.response.data.title) {
          mensagemErro = err.response.data.title;

          // Se há erros de validação específicos, extrai o primeiro
          if (
            err.response.data.errors &&
            typeof err.response.data.errors === "object"
          ) {
            const firstError = Object.values(err.response.data.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              mensagemErro = firstError[0];
            } else if (typeof firstError === "string") {
              mensagemErro = firstError;
            }
          }
        }
        // Se for objeto, tenta converter para string legível
        else if (typeof err.response.data === "object") {
          // Tenta extrair a primeira propriedade string do objeto
          const firstStringValue = Object.values(err.response.data).find(
            (value) => typeof value === "string"
          );
          mensagemErro =
            firstStringValue || "Erro no servidor. Tente novamente.";
        }
      }
      // Se não houver response.data, verifica a mensagem do erro
      else if (err.message) {
        mensagemErro = err.message;
      }

      setErro(mensagemErro);
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
            Se o e-mail existir em nossa base de dados, um link de recuperação
            será enviado para: <strong>{email}</strong>
          </p>
          <p>📬 Verifique sua caixa de entrada (e também a pasta de spam)</p>
          <hr />
          <p className="mb-0">
            <Link to="/login" className="btn btn-primary">
              Voltar ao Login
            </Link>
          </p>
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
            <Form.Text className="text-muted">
              Digite o e-mail que você usou para se cadastrar
            </Form.Text>
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
                <span className="spinner-border spinner-border-sm me-2" />
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
