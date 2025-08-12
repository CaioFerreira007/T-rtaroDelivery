using System.ComponentModel.DataAnnotations;

namespace TartaroAPI.DTO
{
    public class AlterarSenhaDTO
    {
        [Required(ErrorMessage = "Token de recuperação é obrigatório.")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nova senha é obrigatória.")]
        [MinLength(6, ErrorMessage = "Nova senha deve ter ao menos 6 caracteres.")]
        public string NovaSenha { get; set; } = string.Empty;
    }
}
