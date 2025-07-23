import React from "react";
import { Container, Form, Button } from "react-bootstrap";
import "../styles/Checkout.css"; // arquivo de estilo com animações

function Checkout() {
  return (
    <Container className="mt-5 checkout-container fade-in">
      <h2 className="text-center mb-4">💳 Finalizar Pedido</h2>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Nome completo</Form.Label>
          <Form.Control type="text" placeholder="Digite seu nome" />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Endereço</Form.Label>
          <Form.Control type="text" placeholder="Rua, número, bairro..." />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Forma de pagamento</Form.Label>
          <Form.Select>
            <option>Pix</option>
            <option>Cartão de crédito</option>
            <option>Dinheiro na entrega</option>
          </Form.Select>
        </Form.Group>

        <Button variant="success" type="submit" className="w-100 mt-3">
          🛵 Confirmar Pedido
        </Button>
      </Form>
    </Container>
  );
}

export default Checkout;
