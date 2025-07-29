using System.ComponentModel.DataAnnotations;

namespace TartaroAPI.DTOs
{
    public class ProdutoDTO
    {
        [Required, MaxLength(50)]
        public string Tipo { get; set; } = "Padrão";

        [Required, MaxLength(100)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Descricao { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Categoria { get; set; } = string.Empty;

        [Required, Range(0.01, double.MaxValue)]
        public decimal Preco { get; set; }

        [Url]
        public string ImagemUrl { get; set; } = string.Empty;
    }
}