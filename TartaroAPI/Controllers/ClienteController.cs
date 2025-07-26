using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TartaroAPI.Data;
using TartaroAPI.Models;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IConfiguration _config;

        public ClienteController(TartaroDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // 🧾 Cadastro de cliente
        [AllowAnonymous]
        [HttpPost("cadastro")]
        public async Task<IActionResult> CadastrarCliente([FromBody] ClienteCadastroDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest("Dados inválidos.");

            if (await _context.Clientes.AnyAsync(c => c.Email == dto.Email))
                return BadRequest("Email já cadastrado.");

            try
            {
                var novoCliente = new Cliente
                {
                    Nome = dto.Nome,
                    Email = dto.Email,
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                    Tipo = dto.Tipo ?? "cliente"
                };

                _context.Clientes.Add(novoCliente);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(CadastrarCliente), new { id = novoCliente.Id }, new
                {
                    id = novoCliente.Id,
                    nome = novoCliente.Nome,
                    email = novoCliente.Email
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao cadastrar cliente: {ex.Message}");
            }
        }

        // 🔓 Login
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] ClienteLoginDto dto)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == dto.Email);
            if (cliente == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, cliente.SenhaHash))
                return Unauthorized("Credenciais inválidas.");

            var token = GerarJwt(cliente);
            return Ok(new { token, nome = cliente.Nome });
        }

        // 📩 Recuperação de senha
        [AllowAnonymous]
        [HttpPost("recuperar-senha")]
        public async Task<IActionResult> RecuperarSenha([FromBody] string email)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == email);
            if (cliente == null) return NotFound("Email não encontrado.");

            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            cliente.TokenRecuperacao = token;
            cliente.TokenExpiraEm = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            var link = $"https://seusite.com/alterar-senha?token={token}";
            Console.WriteLine($"[DEV MODE] Link de recuperação: {link}");

            return Ok("Email enviado com instruções para redefinir senha.");
        }

        // 🔐 Alterar senha
        [AllowAnonymous]
        [HttpPost("alterar-senha")]
        public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaDto dto)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.TokenRecuperacao == dto.Token);
            if (cliente == null || cliente.TokenExpiraEm < DateTime.UtcNow)
                return BadRequest("Token inválido ou expirado.");

            cliente.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
            cliente.TokenRecuperacao = null;
            cliente.TokenExpiraEm = null;
            await _context.SaveChangesAsync();

            return Ok("Senha alterada com sucesso.");
        }

        // 👤 Perfil
        [Authorize]
        [HttpGet("perfil")]
        public IActionResult Perfil()
        {
            var nome = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var tipo = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new { nome, email, tipo });
        }

        // 🛑 Área admin
        [Authorize(Roles = "admin")]
        [HttpGet("admin")]
        public IActionResult AdminArea()
        {
            return Ok("Bem-vindo à área administrativa.");
        }

        // 🚪 Logout simbólico
        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok("Logout efetuado com sucesso. Remova o token do cliente.");
        }

        // 🧠 Gerar JWT
        private string GerarJwt(Cliente cliente)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, cliente.Id.ToString()),
                new Claim(ClaimTypes.Email, cliente.Email),
                new Claim(ClaimTypes.Role, cliente.Tipo)
            };

            var keyString = _config["Jwt:Key"];
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(keyString) || string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
                throw new InvalidOperationException("Configurações JWT ausentes em appsettings.json.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // DTOs auxiliares
    public class ClienteCadastroDto
    {
        [Required]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Senha { get; set; } = string.Empty;

        public string? Tipo { get; set; }
    }

    public class ClienteLoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Senha { get; set; } = string.Empty;
    }

    public class AlterarSenhaDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string NovaSenha { get; set; } = string.Empty;
    }
}