// src/pages/Login.jsx (ou components)

import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login as loginService } from "../Services/authService"; // Renomeia na importação para evitar conflito
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { setUsuarioLogado } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      // 1. Chama o serviço de login
      const usuario = await loginService(email, senha);

      // 2. Atualiza o estado global no AuthContext
      setUsuarioLogado(usuario);

      // 3. Redireciona
      navigate("/home");
    } catch (err) {
      const mensagem = err.response?.data || "Email ou senha inválidos.";
      setErro(mensagem);
    }
  };

  return (
    // ... O resto do seu JSX continua exatamente o mesmo
    <Container className="mt-5 login-container fade-in">
      {/* ... todo o seu formulário ... */}
    </Container>
  );
}

export default Login;
