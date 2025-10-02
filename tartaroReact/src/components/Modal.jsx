import { Modal, Form, Button } from "react-bootstrap";

function ModalEntrega({
  show,
  onClose,
  onConfirm,
  dadosEntrega,
  handleInputChange,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>📍 Informações de Entrega</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Endereço</Form.Label>
            <Form.Control
              type="text"
              placeholder="Rua, número, bairro..."
              value={dadosEntrega.endereco}
              onChange={(e) => handleInputChange("endereco", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ponto de Referência</Form.Label>
            <Form.Control
              type="text"
              placeholder="Opcional"
              value={dadosEntrega.pontoReferencia}
              onChange={(e) =>
                handleInputChange("pontoReferencia", e.target.value)
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Ex: sem cebola, entregar no portão..."
              value={dadosEntrega.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Forma de Pagamento</Form.Label>
            <Form.Select
              value={dadosEntrega.formaPagamento}
              onChange={(e) =>
                handleInputChange("formaPagamento", e.target.value)
              }
            >
              <option value="">Selecione...</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          ❌ Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          ✅ Enviar Pedido
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ModalEntrega;
