import React from 'react';
import { Container, Button } from 'react-bootstrap';

function Home() {
  return (
    <Container className="text-center mt-5">
      <h1 className="mb-4">Tártaro Delivery 🔥</h1>
      <p className="lead">O hambúrguer mais insano do pedaço. Faça seu pedido agora!</p>
      <Button
        variant="success"
        href="https://wa.me/21988156436"
        target="_blank"
      >
        Dúvidas? Fale com a gente no WhatsApp
      </Button>
    </Container>
  );
}

export default Home;