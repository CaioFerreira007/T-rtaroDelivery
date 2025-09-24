// DebugTartaro.jsx - Componente para debug do seu sistema
import React, { useState } from "react";
import { Container, Button, Alert, Card, Form, Row, Col } from "react-bootstrap";
import axiosConfig from "../Services/axiosConfig";
import { login, register } from "../Services/authService";

function DebugTartaro() {
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [emailTeste, setEmailTeste] = useState("");
  const [senhaTeste, setSenhaTeste] = useState("");

  // Teste 1: API funcionando
  const testarAPI = async () => {
    setCarregando(true);
    setResultado("🔍 Testando API...\n");

    try {
      const response = await axiosConfig.get("/auth/test");
      setResultado(prev => prev + `✅ API funcionando!\nResposta: ${JSON.stringify(response.data, null, 2)}\n\n`);
    } catch (error) {
      setResultado(prev => prev + `❌ Erro na API:\n${error.message}\n\n`);
    } finally {
      setCarregando(false);
    }
  };

  // Teste 2: Cadastro de usuário teste
  const testarCadastro = async () => {
    setCarregando(true);
    const timestamp = Date.now();
    
    const dadosTeste = {
      nome: `Usuario Teste ${timestamp}`,
      email: `teste${timestamp}@teste.com`,
      telefone: "21999999999",
      senha: "123456"
    };

    setResultado(prev => prev + `🔍 Testando cadastro com:\n${JSON.stringify(dadosTeste, null, 2)}\n`);

    try {
      const usuario = await register(dadosTeste);
      setResultado(prev => prev + `✅ Cadastro funcionou!\nUsuário: ${JSON.stringify(usuario, null, 2)}\n\n`);
      
      // Salva dados para teste de login
      setEmailTeste(dadosTeste.email);
      setSenhaTeste(dadosTeste.senha);
    } catch (error) {
      setResultado(prev => prev + `❌ Erro no cadastro:\n${error.message}\n\n`);
    } finally {
      setCarregando(false);
    }
  };

  // Teste 3: Login
  const testarLogin = async () => {
    setCarregando(true);
    
    if (!emailTeste || !senhaTeste) {
      setResultado(prev => prev + "❌ Faça um cadastro primeiro ou preencha email/senha\n\n");
      setCarregando(false);
      return;
    }

    setResultado(prev => prev + `🔍 Testando login com: ${emailTeste}\n`);

    try {
      const usuario = await login(emailTeste, senhaTeste);
      setResultado(prev => prev + `✅ Login funcionou!\nUsuário: ${JSON.stringify(usuario, null, 2)}\n\n`);
    } catch (error) {
      setResultado(prev => prev + `❌ Erro no login:\n${error.message}\n\n`);
    } finally {
      setCarregando(false);
    }
  };

  // Teste 4: Login com admin existente
  const testarLoginAdmin = async () => {
    setCarregando(true);
    setResultado(prev => prev + `🔍 Testando login admin...\n`);

    try {
      const usuario = await login("myprofilejobs07@outlook.com", "cocodopou");
      setResultado(prev => prev + `✅ Login admin funcionou!\nUsuário: ${JSON.stringify(usuario, null, 2)}\n\n`);
    } catch (error) {
      setResultado(prev => prev + `❌ Erro no login admin:\n${error.message}\n\n`);
    } finally {
      setCarregando(false);
    }
  };

  // Verificar localStorage
  const verificarStorage = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const refreshToken = localStorage.getItem("refreshToken");

    setResultado(prev => prev + `📋 Estado do localStorage:\n`);
    setResultado(prev => prev + `Token: ${token ? 'Existe' : 'Não existe'}\n`);
    setResultado(prev => prev + `User: ${user || 'Não existe'}\n`);
    setResultado(prev => prev + `RefreshToken: ${refreshToken ? 'Existe' : 'Não existe'}\n\n`);
  };

  return (
    <Container className="mt-4">
      <h2>🔧 Debug Tartaro Delivery</h2>
      <p className="text-muted">URL da API: {axiosConfig.defaults.baseURL}</p>

      <Row className="mb-3">
        <Col md={6}>
          <Button 
            variant="primary" 
            onClick={testarAPI} 
            disabled={carregando}
            className="me-2 mb-2 w-100"
          >
            1. Testar API
          </Button>
        </Col>
        <Col md={6}>
          <Button 
            variant="success" 
            onClick={testarCadastro} 
            disabled={carregando}
            className="me-2 mb-2 w-100"
          >
            2. Testar Cadastro
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            type="email"
            placeholder="Email para login"
            value={emailTeste}
            onChange={(e) => setEmailTeste(e.target.value)}
            className="mb-2"
          />
        </Col>
        <Col md={4}>
          <Form.Control
            type="password"
            placeholder="Senha"
            value={senhaTeste}
            onChange={(e) => setSenhaTeste(e.target.value)}
            className="mb-2"
          />
        </Col>
        <Col md={4}>
          <Button 
            variant="warning" 
            onClick={testarLogin} 
            disabled={carregando}
            className="w-100"
          >
            3. Testar Login
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Button 
            variant="danger" 
            onClick={testarLoginAdmin} 
            disabled={carregando}
            className="w-100"
          >
            4. Login Admin
          </Button>
        </Col>
        <Col md={6}>
          <Button 
            variant="info" 
            onClick={verificarStorage} 
            className="w-100"
          >
            5. Verificar Storage
          </Button>
        </Col>
      </Row>

      <Button 
        variant="secondary" 
        onClick={() => setResultado("")} 
        className="mb-3"
      >
        Limpar Resultado
      </Button>

      {resultado && (
        <Card>
          <Card.Header>Resultado dos Testes</Card.Header>
          <Card.Body>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
              {resultado}
            </pre>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default DebugTartaro;