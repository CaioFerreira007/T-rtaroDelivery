using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
        [HttpPost("cadastro")]
        public async Task<IActionResult> CadastrarCliente([FromBody] Cliente cliente)
        {
            if (await _context.Clientes.AnyAsync(c => c.Email == cliente.Email))
                return BadRequest("Email já cadastrado.");

            cliente.SenhaHash = BCrypt.Net.BCrypt.HashPassword(cliente.SenhaHash);
            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(CadastrarCliente), new { id = cliente.Id }, cliente);
        }

        // 🔓 Login de cliente
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] ClienteLoginDto dto)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == dto.Email);
            if (cliente == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, cliente.SenhaHash))
                return Unauthorized("Credenciais inválidas.");

            var token = GerarJwt(cliente);
            return Ok(new { token, nome = cliente.Nome });
        }

        // 🧠 Geração de token JWT
        private string GerarJwt(Cliente cliente)
        {
            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, cliente.Id.ToString()),
        new Claim(ClaimTypes.Email, cliente.Email),
        new Claim(ClaimTypes.Role, cliente.Tipo)
    };

            // 🔐 Garantir que a chave está presente no appsettings.json
            var keyString = _config["Jwt:Key"];
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(keyString) || string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
            {
                throw new InvalidOperationException("Configurações JWT ausentes em appsettings.json.");
            }

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

        // 📩 Recuperação de senha
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

        // 🔐 Alterar senha com token
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
    }

    // DTOs auxiliares
    public class ClienteLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }

    public class AlterarSenhaDto
    {
        public string Token { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}