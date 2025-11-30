import React from "react";
import { Modal, Form, Button, ButtonGroup, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

function ModalEntrega({
  show,
  onClose,
  onConfirm,
  dadosEntrega,
  handleInputChange,
  carregando = false,
}) {
  const { usuarioLogado } = useAuth();

  React.useEffect(() => {
    if (
      show &&
      usuarioLogado?.endereco &&
      !dadosEntrega.endereco &&
      dadosEntrega.tipoPedido === "ENTREGA"
    ) {
      console.log(
        "📍 Preenchendo endereço automaticamente:",
        usuarioLogado.endereco
      );
      handleInputChange("endereco", usuarioLogado.endereco);
    }
  }, [
    show,
    usuarioLogado,
    dadosEntrega.endereco,
    dadosEntrega.tipoPedido,
    handleInputChange,
  ]);

  const handleSubmit = (e) => {
    e?.preventDefault();

    console.log(" [MODAL] Dados antes de enviar:", dadosEntrega);
    console.log(" [MODAL] Tipo de pedido atual:", dadosEntrega.tipoPedido);

    // Validações conforme o tipo de pedido
    if (dadosEntrega.tipoPedido === "ENTREGA") {
      if (!dadosEntrega.endereco || dadosEntrega.endereco.trim() === "") {
        console.log(" [MODAL] Erro: Endereço não informado");
        alert("Por favor, informe o endereço de entrega.");
        return;
      }
    } else {
      console.log(" [MODAL] Tipo RETIRADA - Endereço não necessário");
    }

    if (!dadosEntrega.formaPagamento) {
      console.log(" [MODAL] Erro: Forma de pagamento não selecionada");
      alert("Por favor, selecione a forma de pagamento.");
      return;
    }

    console.log(
      " [MODAL] Validação OK! Tipo de pedido:",
      dadosEntrega.tipoPedido
    );
    console.log("✅ [MODAL] Chamando onConfirm...");
    onConfirm();
  };

  const handleTipoPedidoChange = (tipo) => {
    console.log(` [MODAL] Mudando tipo de pedido para: ${tipo}`);
    handleInputChange("tipoPedido", tipo);

    // Limpar endereço quando mudar para RETIRADA
    if (tipo === "RETIRADA") {
      console.log(" [MODAL] Limpando campo de endereço...");
      handleInputChange("endereco", "Cliente vai retirar no balcão!");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>📍 Finalizar Pedido</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* IMPORTANTE: noValidate desabilita validação HTML5 */}
        <Form onSubmit={handleSubmit} noValidate>
          {/* Tipo de Pedido */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              Tipo de Pedido <span className="text-danger">*</span>
            </Form.Label>
            <ButtonGroup className="w-100">
              <Button
                variant={
                  dadosEntrega.tipoPedido === "ENTREGA"
                    ? "success"
                    : "outline-success"
                }
                onClick={() => handleTipoPedidoChange("ENTREGA")}
                disabled={carregando}
                style={{ padding: "12px" }}
              >
                🚚 Entrega
              </Button>
              <Button
                variant={
                  dadosEntrega.tipoPedido === "RETIRADA"
                    ? "success"
                    : "outline-success"
                }
                onClick={() => handleTipoPedidoChange("RETIRADA")}
                disabled={carregando}
                style={{ padding: "12px" }}
              >
                🏪 Retirar no Local
              </Button>
            </ButtonGroup>
            <small className="text-muted d-block mt-1">
              Tipo selecionado: <strong>{dadosEntrega.tipoPedido}</strong>
            </small>
          </Form.Group>

          {/* Campos de ENTREGA */}
          {dadosEntrega.tipoPedido === "ENTREGA" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>
                  Endereço <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Rua, número, bairro..."
                  value={dadosEntrega.endereco || ""}
                  onChange={(e) =>
                    handleInputChange("endereco", e.target.value)
                  }
                  disabled={carregando}
                />
                <Form.Text className="text-muted">
                  {usuarioLogado?.endereco
                    ? "Este é o endereço cadastrado no seu perfil. Você pode alterá-lo se necessário."
                    : "Você ainda não cadastrou um endereço. Adicione um agora!"}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ponto de Referência</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: Próximo ao mercado, portão azul..."
                  value={dadosEntrega.pontoReferencia || ""}
                  onChange={(e) =>
                    handleInputChange("pontoReferencia", e.target.value)
                  }
                  disabled={carregando}
                />
              </Form.Group>
            </>
          )}

          {/* Campos de RETIRADA */}
          {dadosEntrega.tipoPedido === "RETIRADA" && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-start">
                <span className="me-2">📍</span>
                <div>
                  <strong>Endereço para retirada:</strong>
                  <p className="mb-0 mt-1">
                    Rua do Ouro, 350 - Sarapui, Duque de Caxias - RJ
                  </p>
                  <small className="text-muted">
                    Seu pedido ficará pronto em aproximadamente 40 - 70 minutos.
                  </small>
                </div>
              </div>
            </Alert>
          )}

          {/* Observações */}
          <Form.Group className="mb-3">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={
                dadosEntrega.tipoPedido === "RETIRADA"
                  ? "Ex: sem cebola, retirar às 19h, troco para R$ 50..."
                  : "Ex: sem cebola, entregar no portão, troco para R$ 50..."
              }
              value={dadosEntrega.observacoes || ""}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              disabled={carregando}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {dadosEntrega.observacoes?.length || 0}/500 caracteres
            </Form.Text>
          </Form.Group>

          {/* Forma de Pagamento */}
          <Form.Group className="mb-3">
            <Form.Label>
              Forma de Pagamento <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={dadosEntrega.formaPagamento || ""}
              onChange={(e) =>
                handleInputChange("formaPagamento", e.target.value)
              }
              disabled={carregando}
            >
              <option value="">Selecione...</option>
              <option value="PIX">💳 PIX</option>
              <option value="DINHEIRO">💵 Dinheiro</option>
              <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
              <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={carregando}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            carregando ||
            !dadosEntrega.tipoPedido ||
            (dadosEntrega.tipoPedido === "ENTREGA" && !dadosEntrega.endereco) ||
            !dadosEntrega.formaPagamento
          }
        >
          {carregando ? "Enviando..." : " Enviar Pedido"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ModalEntrega;
