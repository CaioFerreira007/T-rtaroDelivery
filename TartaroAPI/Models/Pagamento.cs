namespace TartaroAPI.Models
{
    public class Pagamento
    {
        public int Id { get; set; }
        public decimal Valor { get; set; }
        public string Tipo { get; set; } = "Pix";
        public string Status { get; set; } = "Aguardando";

        public int PedidoId { get; set; }
        public Pedido Pedido { get; set; } = null!;
    }
}