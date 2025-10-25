namespace TartaroAPI.DTOs
{
    public class PedidoDetalheDTO
    {
        public int Id { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public DateTime DataPedido { get; set; }
        public string Status { get; set; } = string.Empty;
        public string NomeCliente { get; set; } = string.Empty;
        public string Endereco { get; set; } = string.Empty;
        public string? Referencia { get; set; }
        public string? Observacoes { get; set; }
        public decimal Subtotal { get; set; }
        public decimal? TaxaEntrega { get; set; }
        public decimal? TotalFinal { get; set; }
        
        public List<ItemPedidoDTO> Itens { get; set; } = new();
        public PagamentoDTO? Pagamento { get; set; }
    }

    public class ItemPedidoDTO
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
        public ProdutoSimplificadoDTO? Produto { get; set; }
    }

    public class ProdutoSimplificadoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public decimal Preco { get; set; }
        public string? Categoria { get; set; }
    }

    public class PagamentoDTO
    {
        public int Id { get; set; }
        public decimal ValorTotal { get; set; }
        public string FormaPagamento { get; set; } = string.Empty;
        public bool Pago { get; set; }
    }
}