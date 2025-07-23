// Lista de hambúrgueres que serão exibidos no cardápio
const produtos = [
  {
    id: 1,
    nome: "Diana",
    descricao:
      "Hambúrguer de picanha, cheddar duplo, cebola caramelizada e molho especial da casa.",
    preco: 29.9,
    imagens: ["/assets/tartaro_cardapio/diana.jpg"],
    categoria: "Artesanais",
  },
  {
    id: 2,
    nome: "Athena🔥",
    descricao:
      "Dois smashs de carne, cheddar cremoso, bacon crocante e barbecue.",
    preco: 32.5,
    imagens: ["/assets/tartaro_cardapio/athena.jpg"],
    categoria: "Artesanais",
  },
  {
    id: 3,
    nome: "Hades",
    descricao:
      "Hambúrguer de grão-de-bico, alface americana, tomate e maionese vegana.",
    preco: 26.9,
    imagens: [
      "/assets/tartaro_cardapio/hades.jpg",
      "/assets/tartaro_cardapio/hades2.jpg",
    ],
    categoria: "Artesanais",
  },
  {
    id: 4,
    nome: "Helena",
    descricao:
      "Blend trufado, queijo suíço, rúcula fresca e molho de alho negro.",
    preco: 34.9,
    imagens: ["/assets/tartaro_cardapio/helena.jpg"],
    categoria: "Artesanais",
  },
  {
    id: 5,
    nome: "Perseu",
    descricao: "Peito de frango empanado crocante, maionese da casa e salada.",
    preco: 27.9,
    imagens: ["/assets/tartaro_cardapio/perseu.jpg"],
    categoria: "Artesanais",
  },
];

// Exporta a lista para ser usada em outros arquivos
export default produtos;
