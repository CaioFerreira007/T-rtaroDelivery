using System.ComponentModel.DataAnnotations;
namespace TartaroAPI.DTO
{
    public class SolicitarRecuperacaoDTO
    {
        [Required(ErrorMessage = "E-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "E-mail inválido.")]
        public string Email { get; set; } = string.Empty;
    }
}