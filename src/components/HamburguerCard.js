import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { Card, Button } from 'react-bootstrap';

function HamburguerCard({ nome, descricao, preco, imagem }) {
  return (
    <Card className="mb-4 shadow-sm rounded h-100">
      <Card.Img
  variant="top"
  src={imagem}
  alt={nome}
  style={{ height: '200px', objectFit: 'cover' }}
/>
      <Card.Body className="d-flex flex-column">
        <Card.Title>{nome}</Card.Title>
        <Card.Text>{descricao}</Card.Text>
        <h5>R$ {preco.toFixed(2)}</h5>
       <div className="mt-auto d-flex justify-content-between align-items-center">
    <span className="fw-bold fs-5">R$ {preco.toFixed(2)}</span>
    <Button variant="success">
      <FaShoppingCart className="me-2" />
      Adicionar
    </Button>
  </div>

      </Card.Body>
    </Card>
  );
}

export default HamburguerCard;