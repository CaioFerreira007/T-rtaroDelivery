using System.ComponentModel.DataAnnotations;

namespace TartaroAPI.DTO
{
    public class RegisterDTO
    {
        [Required(ErrorMessage = "Nome é obrigatório.")]
        [StringLength(100, ErrorMessage = "Nome não pode exceder 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Telefone é obrigatório.")]
        public string Telefone { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "Formato de e-mail inválido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha é obrigatória.")]
        [MinLength(6, ErrorMessage = "Senha deve ter ao menos 6 caracteres.")]
        public string Senha { get; set; } = string.Empty;

        // Opcional: só para o Admin usar
        public string Tipo { get; set; } = string.Empty;
    }
}
