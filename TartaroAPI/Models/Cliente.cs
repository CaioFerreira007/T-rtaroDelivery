using System.ComponentModel.DataAnnotations;

namespace TartaroAPI.Models
{
    public class Cliente
    {
        public int Id { get; set; }

        // Tipo pode ser usado para controle de nível de acesso (Ex: "Padrão", "VIP", "Admin")
        public string Tipo { get; set; } = "Padrão";

        [Required]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string SenhaHash { get; set; } = string.Empty;

        // Campo opcional de telefone para contato do cliente
        public string Telefone { get; set; } = string.Empty;

        // Recuperação de senha: token gerado via email
        public string? TokenRecuperacao { get; set; }

        // Expiração do token de recuperação (ex: 15 min após geração)
        public DateTime? TokenExpiraEm { get; set; }

        // Relacionamento com pedidos
        public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
    }
}