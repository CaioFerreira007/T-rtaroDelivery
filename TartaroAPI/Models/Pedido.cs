namespace TartaroAPI.Models
{
    public class Pedido
    {
        public int Id { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Aguardando Pagamento";
        public string FormaPagamento { get; set; } = string.Empty;

        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;
        public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();
        public Pagamento Pagamento { get; set; } = null!;
    }
}