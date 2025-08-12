using System.ComponentModel.DataAnnotations;

namespace TartaroAPI.DTO
{
    public class TokenDTO
    {
        [Required(ErrorMessage = "Refresh token é obrigatório.")]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
