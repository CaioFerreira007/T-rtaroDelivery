// src/components/Dashboard.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext"; // Importa o contexto
import axiosConfig from "../Services/axiosConfig"; // Usa a instância configurada
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { usuariologado } = useContext(AuthContext); // Usa o contexto como fonte da verdade

  const [stats, setStats] = useState({
    /* ... */
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A função agora é assíncrona para usar await
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // TODO: Implementar estes endpoints no backend (.NET)
        const statsResponse = await axiosConfig.get("/dashboard/stats");
        const ordersResponse = await axiosConfig.get(
          "/dashboard/recent-orders"
        );

        setStats(statsResponse.data);
        setRecentOrders(ordersResponse.data);
      } catch (error) {
        console.error(
          "API do Dashboard ainda não implementada, usando dados mock:",
          error
        );
        // Usando dados mock como fallback
        setStats({ totalPedidos: 142 /* ... */ });
        setRecentOrders([{ id: 1 /* ... */ }]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // O resto da sua lógica e JSX (formatCurrency, formatDate, getStatusColor, etc.)
  // pode continuar o mesmo, mas agora usando `usuariologado` do contexto.

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        {/* Usa o nome do usuariologado que vem direto do contexto */}
        <p>Bem-vindo, {usuariologado?.nome || "Usuário"}!</p>
        {/* ... */}
      </header>

      {/* O resto do seu JSX continua o mesmo */}
      <main className="dashboard-main">{/* ... */}</main>
    </div>
  );
};

export default Dashboard;
