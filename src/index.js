import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // 👈 Importar o Router
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* 👈 Envolvendo App com o router */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
