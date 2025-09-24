import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

// Importações para a nova arquitetura
import { AuthContext } from "../context/AuthContext";
import { register } from "../Services/authService";

// Estilos
import "../styles/Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { setUsuarioLogado } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatarTelefone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleTelefoneChange = (e) => {
    setTelefone(formatarTelefone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    if (senha !== confirmarSenha) {
      setCarregando(false);
      return setErro("As senhas não coincidem!");
    }

    // CORREÇÃO: Extrair apenas números do telefone antes de enviar
    const telefoneNumeros = telefone.replace(/\D/g, "");
    if (telefoneNumeros.length < 10) {
      setCarregando(false);
      return setErro("Por favor, insira um telefone válido com DDD!");
    }

    try {
      // IMPORTANTE: Enviar telefone apenas com números
      const dadosCadastro = { 
        nome, 
        email, 
        telefone: telefoneNumeros, // Aqui estava o problema - enviando formatado
        senha 
      };
      
      console.log("Tentando cadastrar com dados:", { 
        ...dadosCadastro, 
        senha: "***",
        telefoneOriginal: telefone,
        telefoneEnviado: telefoneNumeros
      });
      
      const usuario = await register(dadosCadastro);
      console.log("Cadastro bem-sucedido:", usuario);
      
      setUsuarioLogado(usuario);
      navigate("/home");
    } catch (err) {
      console.error("Erro completo no cadastro:", err);
      
      // CORREÇÃO: Tratamento correto do erro
      let mensagem = "Erro ao criar conta. Verifique os dados.";
      
      if (err.message) {
        // Se o authService já processou o erro e retornou uma mensagem
        mensagem = err.message;
      } else if (err.response?.data) {
        // Se é uma resposta HTTP com dados
        const errorData = err.response.data;
        mensagem = typeof errorData === 'string' ? errorData : errorData.message || errorData.Message || mensagem;
      }
      
      console.log("Mensagem de erro a ser exibida:", mensagem);
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Container className="mt-5 cadastro-container fade-in">
      <h2 className="text-center mb-4">📝 Criar Conta</h2>

      {erro && (
        <Alert variant="danger" className="text-center">
          {erro}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome completo</Form.Label>
          <Form.Control
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Form.Group>

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

        <Form.Group className="mb-3">
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="tel"
            placeholder="(21) 99999-9999"
            value={telefone}
            onChange={handleTelefoneChange}
            maxLength={15}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Crie uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Confirmar Senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Repita sua senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
        </Form.Group>

        <Button
          type="submit"
          variant="success"
          className="w-100 mt-3"
          disabled={carregando}
        >
          {carregando ? "Criando conta..." : "✅ Criar Conta"}
        </Button>

        <p className="text-center mt-4">
          Já tem uma conta?{" "}
          <Link
            to="/login"
            style={{ color: "#28a745", textDecoration: "underline" }}
          >
            Faça o login
          </Link>
        </p>
      </Form>
    </Container>
  );
}

export default Cadastro;