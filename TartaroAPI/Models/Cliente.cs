namespace TartaroAPI.Models
{
    public class Cliente
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = "Padrão";
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string SenhaHash { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;

        public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
    }
}