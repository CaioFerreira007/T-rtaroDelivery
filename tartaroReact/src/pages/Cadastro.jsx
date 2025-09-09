import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { register } from "../Services/authService"; // Importa o serviço
import "../styles/Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const { setUsuarioLogado } = useContext(AuthContext);
  const navigate = useNavigate();

  // A função de formatar telefone continua a mesma...
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

    if (senha !== confirmarSenha) {
      return setErro("As senhas não coincidem!");
    }

    const telefoneNumeros = telefone.replace(/\D/g, "");
    if (telefoneNumeros.length < 10) {
      // Validação mais simples
      return setErro("Por favor, insira um telefone válido com DDD!");
    }

    try {
      const dadosCadastro = { nome, email, telefone, senha };

      // 1. Chama o serviço de registro
      const usuario = await register(dadosCadastro);

      // 2. Atualiza o estado global no AuthContext
      setUsuarioLogado(usuario);

      // 3. Redireciona para a home
      navigate("/home");
    } catch (err) {
      const mensagem =
        err.response?.data || "Erro ao criar conta. Verifique os dados.";
      setErro(mensagem);
    }
  };

  return (
    <Container className="mt-5 cadastro-container fade-in">
      <h2 className="text-center mb-4">📝 Criar Conta</h2>

      {/* O resto do seu JSX (Form, Alert, etc.) continua exatamente o mesmo */}
      <Form onSubmit={handleSubmit}>{/* ... Seus Form.Group ... */}</Form>
    </Container>
  );
}

export default Cadastro;
