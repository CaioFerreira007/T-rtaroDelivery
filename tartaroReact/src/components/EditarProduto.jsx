import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosConfig from "../Services/axiosConfig";
import {
  Form,
  Button,
  Container,
  Alert,
  Carousel,
  Spinner,
} from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import "../styles/EditarProduto.css";

function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuariologado } = useContext(AuthContext);

  const categoriasDisponiveis = [
    "Artesanais",
    "Tradicionais",
    "Bebidas",
    "Combos",
    "Batatas",
    "Molhos Adicionais",
  ];

  const [produto, setProduto] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [novasImagens, setNovasImagens] = useState([]);

  useEffect(() => {
    axiosConfig
      .get(`/produtos/${id}`)
      .then((res) => setProduto(res.data))
      .catch(() => setErro("Produto não encontrado ou acesso negado."));
  }, [id]);

  const isAdmin = usuariologado?.tipo?.toUpperCase() === "ADM";
  if (!isAdmin) {
    return (
      <Alert variant="danger" className="m-5 text-center">
        ❌ Acesso negado: apenas administradores podem editar produtos.
      </Alert>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagemChange = (e) => {
    setNovasImagens(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nome", produto.nome);
    formData.append("descricao", produto.descricao);
    formData.append("preco", produto.preco);
    formData.append("categoria", produto.categoria);
    formData.append("tipo", produto.tipo || "Padrão");

    novasImagens.forEach((img) => {
      formData.append("imagens", img);
    });

    axiosConfig
      .put(`/produtos/${id}`, formData)
      .then(() => {
        setSucesso("Produto atualizado com sucesso! Redirecionando...");
        setTimeout(() => navigate("/home"), 2000);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Erro ao atualizar produto.";
        setErro(msg);
      });
  };

  if (!produto) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Carregando produto...</p>
      </Container>
    );
  }

  return (
    <Container className="editar-produto-container">
      <h2>✏️ Editar Produto</h2>

      {erro && <Alert variant="danger">{erro}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      <Form.Group className="mb-4">
        {produto.imagemUrls?.length > 0 ? (
          <div className="carousel-container-edit">
            <Carousel fade interval={null}>
              {produto.imagemUrls.map((url, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100 carousel-image-edit"
                    src={url}
                    alt={`Imagem ${index + 1}`}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        ) : (
          <p className="text-muted">Este produto não possui imagens.</p>
        )}
      </Form.Group>

      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            type="text"
            name="nome"
            value={produto.nome || ""}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descrição</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="descricao"
            value={produto.descricao || ""}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Preço</Form.Label>
          <Form.Control
            type="number"
            name="preco"
            value={produto.preco || ""}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Categoria</Form.Label>
          <Form.Select
            name="categoria"
            value={produto.categoria || ""}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Selecione uma categoria
            </option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Substituir Imagens (opcional)</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleImagemChange}
          />
          <Form.Text className="text-muted">
            Se você enviar novas imagens, as antigas serão substituídas.
          </Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit">
          Salvar Alterações
        </Button>
      </Form>
    </Container>
  );
}

export default EditarProduto;
