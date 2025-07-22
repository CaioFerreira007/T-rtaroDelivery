import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import HamburguerCard from '../components/HamburguerCard';
import produtos from '../data/produto';

function Menu() {
  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">🍔 Cardápio Tártaro Delivery</h2>
      <Container>
  <h2>Testando conteúdo do cardápio...</h2>
  {produtos.length > 0 ? <p>Produtos carregados!</p> : <p>Nenhum produto encontrado.</p>}
</Container>
      <Row>
        {produtos.map((item) => (
          <Col key={item.id} xs={12} md={6} lg={4}>
            <HamburguerCard
              nome={item.nome}
              descricao={item.descricao}
              preco={item.preco}
              imagem={item.imagem}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Menu;