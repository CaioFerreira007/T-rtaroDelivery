using TartaroAPI.Models;
public class ItemPedido
{
    public int Id { get; set; }

    public int ProdutoId { get; set; }
    public Produto? Produto { get; set; }

    public int Quantidade { get; set; }

    public int PedidoId { get; set; }
    public Pedido? Pedido { get; set; }
}