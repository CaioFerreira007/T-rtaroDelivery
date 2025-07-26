using System.ComponentModel.DataAnnotations;
public class registerDTO
{
    // DTO para cadastro de cliente
    // Inclui validações básicas e tipo opcional para controle de acesso
    // Ex: "cliente", "admin", etc.

    [Required]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Senha { get; set; } = string.Empty;

    public string? Tipo { get; set; }
}