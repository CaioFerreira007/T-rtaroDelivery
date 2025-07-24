using System.Text.Json.Serialization;

namespace TartaroAPI.Models
{
    public class Produto
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = "Padrão";
        public string Nome { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public decimal Preco { get; set; }
        public string ImagemUrl { get; set; } = string.Empty;


        [JsonIgnore] public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();
    }
}