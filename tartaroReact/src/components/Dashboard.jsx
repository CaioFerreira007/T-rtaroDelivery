import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosConfig from "../Services/axiosConfig";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { usuariologado } = useContext(AuthContext);

  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosHoje: 0,
    faturamentoMes: 0,
    clientesAtivos: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
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
        // Usando dados mock (de exemplo) como fallback
        setStats({
          totalPedidos: 142,
          pedidosHoje: 8,
          faturamentoMes: 15420.5,
          clientesAtivos: 89,
        });
        setRecentOrders([
          {
            id: 1,
            cliente: "João Silva",
            valor: 85.9,
            status: "Entregue",
            data: new Date().toISOString(),
          },
          {
            id: 2,
            cliente: "Maria Santos",
            valor: 125.5,
            status: "Preparando",
            data: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Funções auxiliares para formatação
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("pt-BR");
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "entregue":
        return "status-delivered";
      case "preparando":
        return "status-preparing";
      case "a caminho":
        return "status-shipping";
      default:
        return "status-pending";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Bem-vindo, {usuariologado?.nome || "Usuário"}!</p>
        </div>
        {/* Botões de Perfil/Sair podem ser adicionados aqui se necessário */}
      </header>

      <main className="dashboard-main">
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total de Pedidos</h3>
              <p className="stat-value">{stats.totalPedidos}</p>
            </div>
            <div className="stat-card">
              <h3>Pedidos Hoje</h3>
              <p className="stat-value">{stats.pedidosHoje}</p>
            </div>
            <div className="stat-card">
              <h3>Faturamento do Mês</h3>
              <p className="stat-value">
                {formatCurrency(stats.faturamentoMes)}
              </p>
            </div>
            <div className="stat-card">
              <h3>Clientes Ativos</h3>
              <p className="stat-value">{stats.clientesAtivos}</p>
            </div>
          </div>
        </section>

        <section className="recent-orders-section">
          <h2>Pedidos Recentes</h2>
          <div className="orders-table">
            <div className="table-header">
              <div>Cliente</div>
              <div>Valor</div>
              <div>Status</div>
              <div>Data/Hora</div>
            </div>
            {recentOrders.map((order) => (
              <div key={order.id} className="table-row">
                <div>{order.cliente}</div>
                <div>{formatCurrency(order.valor)}</div>
                <div>
                  <span
                    className={`status-badge ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div>{formatDate(order.data)}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
