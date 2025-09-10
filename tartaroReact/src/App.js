import { Routes, Route } from "react-router-dom";

//  Páginas
import Home from "./pages/Home";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
import Checkout from "./pages/Checkout";
import RecuperarSenha from "./pages/RecuperarSenha";
import MeusPedidos from "./pages/MeusPedidos";
import Dashboard from "./components/Dashboard";

//  Componentes
import { AuthProvider } from "./context/AuthContext";
import AlterarSenha from "./components/AlterarSenha";
import CadastroProdutoADM from "./components/CadastroProdutoADM";
import RotaPrivada from "./components/RotaPrivada";
import EditarProduto from "./components/EditarProduto";
import SiteNavbar from "./components/SiteNavbar";

import "./styles/animations.css";

function App() {
  return (
    <AuthProvider>
      <>
        <SiteNavbar />

        <div style={{ paddingTop: "70px" }}>
          <Routes>
            {/*  Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/esqueci-senha" element={<RecuperarSenha />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/editar-perfil" element={<EditarPerfil />} />

            <Route path="/alterar-senha/:token" element={<AlterarSenha />} />

            {/* Rotas Privadas (protegidas) */}
            <Route
              path="/dashboard"
              element={
                <RotaPrivada>
                  {" "}
                  {/* ← CORRIGIDO */}
                  <Dashboard />
                </RotaPrivada>
              }
            />

            {/* Administração (só ADM pode acessar) */}
            <Route
              path="/admin/cadastro-produto"
              element={<CadastroProdutoADM />}
            />
            <Route
              path="/admin/produtos/editar/:id"
              element={<EditarProduto />}
            />

            {/*  Rotas protegidas (login obrigatório) */}
            <Route
              path="/checkout"
              element={
                <RotaPrivada>
                  <Checkout />
                </RotaPrivada>
              }
            />
          </Routes>
        </div>
      </>
    </AuthProvider>
  );
}

export default App;
