import React from "react";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
import RotaProtegida from "./components/RotaProtegida";
import Checkout from "./pages/Checkout";
import { Routes, Route } from "react-router-dom";
import SiteNavbar from "./components/SiteNavbar";
import Home from "./pages/Home";
import Menu from "./pages/Home";
import Login from "./pages/Login";
import "./styles/animations.css";

function App() {
  return (
    <>
      <SiteNavbar />
      <div style={{ paddingTop: "70px" }}>
        {" "}
        {/* Compensa o Navbar fixo */}
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/editar-perfil" element={<EditarPerfil />} />
          import RotaProtegida from "./components/RotaProtegida";
          <Route
            path="/checkout"
            element={
              <RotaProtegida>
                <Checkout />
              </RotaProtegida>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
