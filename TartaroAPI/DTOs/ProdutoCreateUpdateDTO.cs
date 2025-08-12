using System.ComponentModel.DataAnnotations;

namespace TartaroAPI.DTOs
{

    public class ProdutoCreateUpdateDTO
    {
        [Required(ErrorMessage = "Nome do produto é obrigatório.")]
        [StringLength(150, ErrorMessage = "Nome do produto não pode exceder 150 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tipo do produto é obrigatório.")]
        public string Tipo { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Descrição não pode exceder 500 caracteres.")]
        public string Descricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "Categoria é obrigatória.")]
        [StringLength(100, ErrorMessage = "Categoria não pode exceder 100 caracteres.")]
        public string Categoria { get; set; } = string.Empty;

        [Required(ErrorMessage = "Preço é obrigatório.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Preço deve ser maior que zero.")]
        public decimal Preco { get; set; }

    }
}