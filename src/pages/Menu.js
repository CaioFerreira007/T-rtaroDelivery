import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import HamburguerCard from "../components/HamburguerCard";
import CarrinhoResumo from "../components/CarrinhoResumo";
import BarraCarrinho from "../components/BarraCarrinho"; // 🆕 barra inferior
import produtos from "../data/produto";

function Menu() {
  const [carrinho, setCarrinho] = useState([]);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prevCarrinho) => {
      const existente = prevCarrinho.find((item) => item.id === produto.id);
      return existente
        ? prevCarrinho.map((item) =>
            item.id === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item
          )
        : [...prevCarrinho, { ...produto, quantidade: 1 }];
    });
  };

  const atualizarQuantidade = (id, operacao) => {
    setCarrinho(
      (prevCarrinho) =>
        prevCarrinho
          .map((item) => {
            if (item.id === id) {
              const novaQtde =
                operacao === "+" ? item.quantidade + 1 : item.quantidade - 1;
              if (novaQtde < 1) return null; // remove item se quantidade for menor que 1
              return { ...item, quantidade: novaQtde };
            }
            return item;
          })
          .filter(Boolean) // remove os nulls (itens excluídos)
    );
  };

  const limparCarrinho = () => {
    setCarrinho([]);
  };

  return (
    <Container className="mt-5 mb-5">
      <h2 className="text-center mb-4">🍔 Cardápio Tártaro Delivery</h2>

      <Row className="gy-4">
        {produtos.map((item) => (
          <Col key={item.id} xs={12} md={6} lg={4}>
            <HamburguerCard
              nome={item.nome}
              descricao={item.descricao}
              preco={item.preco}
              imagens={item.imagens}
              id={item.id}
              onAdd={() => adicionarAoCarrinho(item)}
            />
          </Col>
        ))}
      </Row>

      {/* 🧾 Barra inferior do pedido */}
      <BarraCarrinho
        carrinho={carrinho}
        atualizarQuantidade={atualizarQuantidade}
        limparCarrinho={limparCarrinho}
      />
    </Container>
  );
}

export default Menu;
