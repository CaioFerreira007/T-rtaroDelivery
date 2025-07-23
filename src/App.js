import React from "react";
import Cadastro from "./pages/Cadastro";

import { Routes, Route } from "react-router-dom";
import SiteNavbar from "./components/SiteNavbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import "./styles/animations.css";

function App() {
  return (
    <>
      <SiteNavbar />
      <div style={{ paddingTop: "70px" }}>
        {" "}
        {/* Compensa o Navbar fixo */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
