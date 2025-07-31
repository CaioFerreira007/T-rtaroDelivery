import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosConfig from "../Services/axiosConfig";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";

function CadastroProdutoADM() {
  const { usuariologado } = useContext(AuthContext);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria: "",
    tipo: "Padrão",
  });

  const [imagemFile, setImagemFile] = useState(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const categoriasDisponiveis = [
    "Artesanais",
    "Tradicionais",
    "Bebidas",
    "Combos",
    "Batatas",
    "Molhos Adicionais",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagemFile(file);
      setPreviewImagem(URL.createObjectURL(file));
    } else {
      setImagemFile(null);
      setPreviewImagem("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    setSucesso(false);

    if (parseFloat(form.preco) <= 0) {
      setErro("❌ Preço deve ser maior que zero.");
      setEnviando(false);
      return;
    }

    if (!imagemFile) {
      setErro("❌ Imagem obrigatória para exibir o produto na Home.");
      setEnviando(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      data.append("imagem", imagemFile); // imagem obrigatória

      const res = await axiosConfig.post("/produtos", data, {
        headers: {
          Authorization: `Bearer ${usuariologado.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Produto cadastrado:", res.data); // 👀 log do que foi salvo

      setSucesso(true);
      setForm({
        nome: "",
        descricao: "",
        preco: "",
        categoria: "",
        tipo: "Padrão",
      });
      setImagemFile(null);
      setPreviewImagem("");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setErro("❌ Erro ao cadastrar produto. Verifique os campos.");
    } finally {
      setEnviando(false);
    }
  };

  if (!usuariologado || usuariologado.tipo?.toUpperCase() !== "ADM") {
    return (
      <Alert variant="danger" className="m-5 text-center">
        ❌ Acesso negado: apenas administradores podem cadastrar produtos.
      </Alert>
    );
  }

  return (
    <Container className="mt-5 fade-in">
      <h2 className="text-center mb-4">📦 Cadastrar novo produto</h2>

      {sucesso && (
        <Alert variant="success">✅ Produto cadastrado com sucesso!</Alert>
      )}
      {erro && <Alert variant="danger">{erro}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descrição</Form.Label>
          <Form.Control
            as="textarea"
            name="descricao"
            rows={3}
            value={form.descricao}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Categoria</Form.Label>
          <Form.Select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            required
          >
            <option value="">Selecione uma categoria</option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Preço</Form.Label>
          <Form.Control
            type="number"
            name="preco"
            step="0.01"
            value={form.preco}
            onChange={handleChange}
            required
            min={0.01}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Imagem</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </Form.Group>

        {previewImagem && (
          <div className="mb-3 text-center">
            <img
              src={previewImagem}
              alt="Preview"
              style={{
                maxHeight: "200px",
                objectFit: "contain",
                borderRadius: "10px",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                setPreviewImagem("");
              }}
            />
          </div>
        )}

        <Button
          variant="success"
          type="submit"
          className="w-100"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <Spinner animation="border" size="sm" /> Cadastrando...
            </>
          ) : (
            "➕ Cadastrar Produto"
          )}
        </Button>
      </Form>
    </Container>
  );
}

export default CadastroProdutoADM;
