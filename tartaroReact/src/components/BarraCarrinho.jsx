import React, { useContext, useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosConfig from "../services/axiosConfig";
import "../styles/BarraCarrinho.css";
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
  const [observacoesItens, setObservacoesItens] = useState({});

  const NUMERO_WHATSAPP = "5521980280098";

  const total = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  if (carrinho.length === 0) return null;

  // ✅ VERSÃO 2 - USANDO A API OFICIAL (MAIS ROBUSTA)
  const gerarUrlWhatsApp = (mensagem) => {
    const mensagemCodificada = encodeURIComponent(mensagem);
    // Esta URL funciona de forma inteligente tanto no mobile quanto no desktop.
    // É o método mais recomendado pelo próprio WhatsApp.
    return `https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${mensagemCodificada}`;
  };


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
          observacoes: observacoesItens[item.id] || "",
        })),
      };

      const resposta = await axiosConfig.post("/pedido", pedidoDTO);
      const { id, codigo, subtotal } = resposta.data;

      const produtosList = carrinho
        .map((item) => {
          const nome = item.nome.padEnd(20, ".");
          const preco = `R$ ${item.preco.toFixed(2)}`;
          const observacaoItem = observacoesItens[item.id];
          let linha = `(${item.quantidade}x) ${nome} ${preco}`;
          if (observacaoItem && observacaoItem.trim()) {
            linha += `\n    📝 Obs: ${observacaoItem.trim()}`;
          }
          return linha;
        })
        .join("\n\n");

      const mensagem = [
        "*TÁRTARO DELIVERY - NOVO PEDIDO*", "================================",
        `*PEDIDO:* #${codigo} (ID: ${id})`, `*DATA/HORA:* ${new Date().toLocaleString("pt-BR")}`, "",
        `*CLIENTE:* ${usuariologado.nome}`, `*TELEFONE:* ${usuariologado.telefone}`, "",
        `*ENDEREÇO:* ${dadosEntrega.endereco}`,
        dadosEntrega.pontoReferencia ? `*REFERÊNCIA:* ${dadosEntrega.pontoReferencia}`: null,
        "--------------------------------", "*ITENS DO PEDIDO:*", "", produtosList, "", "--------------------------------",
        dadosEntrega.observacoes ? `*OBSERVAÇÕES GERAIS:*\n${dadosEntrega.observacoes}`: null,
        "================================", `*Subtotal:* R$ ${subtotal.toFixed(2)}`,
        "*Taxa de Entrega:* a confirmar", "", `*FORMA DE PAGAMENTO:* ${dadosEntrega.formaPagamento}`,
      ]
      .filter(Boolean).join("\n");

      const urlWhatsApp = gerarUrlWhatsApp(mensagem);

      // ✅ MÉTODO DE ABERTURA MAIS DIRETO
      try {
        window.open(urlWhatsApp, '_blank');
      } catch (error) {
        console.error("Erro ao tentar abrir o link do WhatsApp:", error);
        alert("Não foi possível abrir o WhatsApp. Por favor, tente novamente.");
      }

      limparCarrinho();
      setShowModal(false);
      setDadosEntrega({ endereco: "", pontoReferencia: "", observacoes: "", formaPagamento: "" });
      setObservacoesItens({});

    } catch (error) {
      console.error("Erro ao enviar pedido para a API:", error);
      alert("Não foi possível registrar o pedido no sistema. Tente novamente.");
    }
  };
  
  // O resto do seu componente continua aqui...
  const handleInputChange = (campo, valor) => {
    setDadosEntrega((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleObservacaoItemChange = (itemId, observacao) => {
    setObservacoesItens((prev) => ({ ...prev, [itemId]: observacao }));
  };

  return (
    <>
      <div className="barra-carrinho bg-white border-top shadow p-3">
        {/* ... seu JSX do carrinho ... */}
        {carrinho.map((item) => (
          <div key={item.id} className="mb-3 p-2 border rounded">
            {/* ... conteúdo do item ... */}
          </div>
        ))}
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Total: R$ {total.toFixed(2)}</strong>
            <br />
            <small className="text-muted">+ Taxa de entrega</small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-danger" onClick={limparCarrinho}>
              Cancelar
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