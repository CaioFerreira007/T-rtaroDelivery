import React, { useState, useEffect } from "react";
import "../styles/Dashboard.css"; // Importar o CSS do Dashboard

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosHoje: 0,
    faturamentoMes: 0,
    clientesAtivos: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Carregar estatísticas do dashboard
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Simular chamada à API - substitua pela sua API real
      const token = localStorage.getItem("token");

      // Exemplo de chamadas à API
      const statsResponse = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const ordersResponse = await fetch("/api/dashboard/recent-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);

      // Dados mock para demonstração
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
          data: "2025-08-20T10:30:00",
        },
        {
          id: 2,
          cliente: "Maria Santos",
          valor: 125.5,
          status: "Preparando",
          data: "2025-08-20T11:15:00",
        },
        {
          id: 3,
          cliente: "Pedro Costa",
          valor: 67.8,
          status: "A caminho",
          data: "2025-08-20T12:00:00",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Dashboard</h1>
            <p>Bem-vindo, {user?.nome || "Usuário"}!</p>
          </div>
          <div className="header-right">
            <button
              className="profile-button"
              onClick={() => (window.location.href = "/perfil")}
            >
              👤 Perfil
            </button>
            <button className="logout-button" onClick={handleLogout}>
              🚪 Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>Total de Pedidos</h3>
                <p className="stat-value">{stats.totalPedidos}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>Pedidos Hoje</h3>
                <p className="stat-value">{stats.pedidosHoje}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Faturamento do Mês</h3>
                <p className="stat-value">
                  {formatCurrency(stats.faturamentoMes)}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Clientes Ativos</h3>
                <p className="stat-value">{stats.clientesAtivos}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="recent-orders-section">
          <div className="section-header">
            <h2>Pedidos Recentes</h2>
            <button
              className="view-all-button"
              onClick={() => (window.location.href = "/pedidos")}
            >
              Ver todos
            </button>
          </div>

          <div className="orders-table">
            <div className="table-header">
              <div className="table-cell">Cliente</div>
              <div className="table-cell">Valor</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Data/Hora</div>
            </div>

            {recentOrders.map((order) => (
              <div key={order.id} className="table-row">
                <div className="table-cell">
                  <span className="customer-name">{order.cliente}</span>
                </div>
                <div className="table-cell">
                  <span className="order-value">
                    {formatCurrency(order.valor)}
                  </span>
                </div>
                <div className="table-cell">
                  <span
                    className={`status-badge ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="table-cell">
                  <span className="order-date">{formatDate(order.data)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2>Ações Rápidas</h2>
          <div className="actions-grid">
            <button
              className="action-button"
              onClick={() => (window.location.href = "/pedidos/novo")}
            >
              📝 Novo Pedido
            </button>
            <button
              className="action-button"
              onClick={() => (window.location.href = "/produtos")}
            >
              🍕 Gerenciar Produtos
            </button>
            <button
              className="action-button"
              onClick={() => (window.location.href = "/clientes")}
            >
              👥 Gerenciar Clientes
            </button>
            <button
              className="action-button"
              onClick={() => (window.location.href = "/relatorios")}
            >
              📊 Relatórios
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
