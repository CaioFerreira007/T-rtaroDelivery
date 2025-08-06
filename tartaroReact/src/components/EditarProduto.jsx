import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosConfig from "../Services/axiosConfig";
import { Form, Button, Container, Alert } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import "../styles/EditarProduto.css";

function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuariologado } = useContext(AuthContext);

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
        setSucesso("Produto atualizado com sucesso!");
        setTimeout(() => navigate("/admin/produtos"), 1500);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Erro ao atualizar produto.";
        setErro(msg);
      });
  };

  if (!produto) return <p>Carregando...</p>;

  return (
    <Container className="editar-produto-container">
      <h2>✏️ Editar Produto</h2>

      {erro && <Alert variant="danger">{erro}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      {produto.imagemUrls?.length > 0 && (
        <div className="preview-imagens">
          {produto.imagemUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Imagem ${index + 1}`}
              className="imagem-preview"
            />
          ))}
        </div>
      )}

      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            type="text"
            name="nome"
            value={produto.nome || ""}
            onChange={handleChange}
            required
            minLength={3}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descrição</Form.Label>
          <Form.Control
            as="textarea"
            name="descricao"
            value={produto.descricao || ""}
            onChange={handleChange}
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
            min="0"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Categoria</Form.Label>
          <Form.Control
            type="text"
            name="categoria"
            value={produto.categoria || ""}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Imagens novas</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleImagemChange}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Salvar Alterações
        </Button>
      </Form>
    </Container>
  );
}

export default EditarProduto;
