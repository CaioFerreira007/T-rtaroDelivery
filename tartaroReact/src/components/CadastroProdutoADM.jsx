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

  const [imagemFiles, setImagemFiles] = useState([]);
  const [previewImagens, setPreviewImagens] = useState([]);

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
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImagemFiles(files);
      setPreviewImagens(files.map((file) => URL.createObjectURL(file)));
    } else {
      setImagemFiles([]);
      setPreviewImagens([]);
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

    if (imagemFiles.length === 0) {
      setErro("❌ Selecione ao menos uma imagem para o produto.");
      setEnviando(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      imagemFiles.forEach((file) => {
        data.append("imagens", file);
      });

      // Cabeçalho simplificado — token vem do interceptor
      const res = await axiosConfig.post("/produtos", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Produto cadastrado:", res.data);

      setSucesso(true);
      setForm({
        nome: "",
        descricao: "",
        preco: "",
        categoria: "",
        tipo: "Padrão",
      });
      setImagemFiles([]);
      setPreviewImagens([]);
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setErro("❌ Erro ao cadastrar produto. Verifique os campos.");
    } finally {
      setEnviando(false);
    }
  };

  // 🔐 Verificação de acesso
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
          <Form.Label>Imagens</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </Form.Group>

        {previewImagens.length > 0 && (
          <div className="mb-3 text-center">
            {previewImagens.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Preview ${idx + 1}`}
                style={{
                  maxHeight: "150px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  margin: "0 5px",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ))}
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
