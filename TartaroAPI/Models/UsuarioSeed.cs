// Models/UsuarioSeed.cs
namespace TartaroAPI.Models
{
    public class UsuarioSeed
    {
        public required string Nome { get; set; }
        public required string Email { get; set; }
        public required string Senha { get; set; }
        public required string Tipo { get; set; }
    }
}