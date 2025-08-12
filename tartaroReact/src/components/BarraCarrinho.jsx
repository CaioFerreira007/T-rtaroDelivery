import React, { useContext, useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../Services/axiosConfig";
import "../styles/BarraCarrinho.css";
import { AuthContext } from "../context/AuthContext";
import ModalEntrega from "./Modal";

function BarraCarrinho({
  carrinho,
  atualizarQuantidade,
  limparCarrinho,
  onClose,
}) {
  const navigate = useNavigate();
  const { usuariologado } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [dadosEntrega, setDadosEntrega] = useState({
    endereco: "",
    pontoReferencia: "",
    observacoes: "",
    formaPagamento: "",
  });

  const NUMERO_WHATSAPP = "5521980280098";
  const total = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  if (carrinho.length === 0) return null;

  const handleFinalizarPedido = () => {
    if (usuariologado && usuariologado.id) {
      setShowModal(true);
    } else {
      navigate("/login");
    }
  };

  const enviarParaWhatsApp = async () => {
    if (!dadosEntrega.endereco.trim()) {
      alert("Por favor, informe o endereço de entrega!");
      return;
    }

    if (!dadosEntrega.formaPagamento) {
      alert("Por favor, selecione a forma de pagamento!");
      return;
    }

    try {
      const pedidoDTO = {
        clienteId: usuariologado.id,
        nomeCliente: usuariologado.nome,
        endereco: dadosEntrega.endereco,
        referencia: dadosEntrega.pontoReferencia,
        observacoes: dadosEntrega.observacoes,
        formaPagamento: dadosEntrega.formaPagamento,
        isRascunho: false,
        itens: carrinho.map((item) => ({
          produtoId: item.id,
          quantidade: item.quantidade,
        })),
      };

      const resposta = await axiosConfig.post("/pedido", pedidoDTO);
      console.log("Resposta do pedido:", resposta.data);

      const { id, codigo, subtotal } = resposta.data;

      const produtosList = carrinho
        .map(
          (item, index) =>
            `${index + 1}. ${item.nome} (${item.quantidade}x) - R$${(
              item.preco * item.quantidade
            ).toFixed(2)}`
        )
        .join("\n");

      const mensagem = [
        "🍔 *NOVO PEDIDO - TÁRTARO DELIVERY*",
        `🆔 *Pedido:* #${codigo} (ID ${id})`,
        `👤 *Cliente:* ${usuariologado.nome}`,
        `📧 ${usuariologado.email}`,
        "",
        `📍 *Endereço:* ${dadosEntrega.endereco}`,
        dadosEntrega.pontoReferencia
          ? `📌 *Referência:* ${dadosEntrega.pontoReferencia}`
          : null,
        dadosEntrega.observacoes
          ? `📝 *Obs:* ${dadosEntrega.observacoes}`
          : null,
        "",
        "🛒 *Produtos:*",
        produtosList,
        "",
        `💰 *Subtotal:* R$${subtotal.toFixed(2)}`,
        "🚚 + *Taxa de entrega*",
        "",
        "*Aguardando confirmação!* ✅",
      ]
        .filter(Boolean)
        .join("\n");

      const urlWhatsApp = `https://web.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${encodeURIComponent(
        mensagem
      )}`;

      window.open(urlWhatsApp, "_blank");

      limparCarrinho();
      setShowModal(false);
      setDadosEntrega({
        endereco: "",
        pontoReferencia: "",
        observacoes: "",
        formaPagamento: "",
      });
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      alert("Erro ao enviar pedido. Verifique o console.");
    }
  };

  const handleInputChange = (campo, valor) => {
    setDadosEntrega((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  return (
    <>
      <div className="barra-carrinho bg-white border-top shadow p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">🛒 Seu Carrinho</h5>
          <Button variant="outline-danger" size="sm" onClick={onClose}>
            ❌ Fechar
          </Button>
        </div>

        {carrinho.map((item) => (
          <div
            key={item.id}
            className="d-flex justify-content-between align-items-center mb-2"
          >
            <div className="text-truncate me-2">
              <strong>{item.nome}</strong>
              <br />
              <small>R$ {item.preco.toFixed(2)} cada</small>
            </div>

            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => atualizarQuantidade(item.id, "-")}
              >
                –
              </Button>
              <span className="mx-2 fw-bold">{item.quantidade}</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => atualizarQuantidade(item.id, "+")}
              >
                +
              </Button>
            </div>

            <span className="fw-bold text-success ms-3">
              R$ {(item.preco * item.quantidade).toFixed(2)}
            </span>
          </div>
        ))}

        <hr className="my-2" />

        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Total: R$ {total.toFixed(2)}</strong>
            <br />
            <small className="text-muted">+ Taxa de entrega</small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-danger" onClick={limparCarrinho}>
              ❌ Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleFinalizarPedido}
              className="d-flex align-items-center gap-1"
            >
              <span>📱</span>
              Finalizar via WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <ModalEntrega
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={enviarParaWhatsApp}
        dadosEntrega={dadosEntrega}
        handleInputChange={handleInputChange}
      />
    </>
  );
}

export default BarraCarrinho;
