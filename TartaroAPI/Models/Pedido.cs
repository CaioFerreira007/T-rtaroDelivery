using TartaroAPI.Models;
public class Pedido
{
    public int Id { get; set; }
    public string Tipo { get; set; } = "Padrão";
    public DateTime DataPedido { get; set; } = DateTime.Now;

    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();
    public Pagamento? Pagamento { get; set; }

    public string Status { get; set; } = "Recebido"; // Ex: Em Preparo, Entregue
}