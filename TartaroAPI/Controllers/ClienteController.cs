using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTO;
using TartaroAPI.Models;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly TartaroDbContext _context;

        public ClienteController(TartaroDbContext context)
        {
            _context = context;
        }

        // 🧾 Cadastro de cliente + login automático
        [AllowAnonymous]
        [HttpPost("cadastro")]
        public async Task<IActionResult> CadastrarCliente([FromBody] RegisterDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == dto.Email.ToLower()))
                return BadRequest("E-mail já cadastrado.");

            try
            {
                var novo = new Cliente
                {
                    Nome = dto.Nome,
                    Email = dto.Email,
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                    Tipo = dto.Tipo ?? "cliente"
                };
                _context.Clientes.Add(novo);
                await _context.SaveChangesAsync();

                var token = GerarJwt(novo);
                return Ok(new { token, nome = novo.Nome, email = novo.Email });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao cadastrar cliente: {ex.Message}");
            }
        }

        // 🔓 Login
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Email.ToLower() == dto.Email.ToLower());
            if (cliente == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, cliente.SenhaHash))
                return Unauthorized("Credenciais inválidas.");

            var token = GerarJwt(cliente);
            return Ok(new { token, nome = cliente.Nome });
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
        [Authorize(Roles = "ADM")]
        [HttpGet("admin")]
        public IActionResult AdminArea() =>
            Ok("Bem-vindo à área administrativa.");

        // 🚪 Logout simbólico
        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout() =>
            Ok("Logout efetuado com sucesso. Remova o token no cliente.");

        // ─── Helper ────────────────────────────────────────────────────────────────
        private string GerarJwt(Cliente c)
        {
            // mesma implementação do AuthController...
            var keyString = HttpContext.RequestServices
                              .GetRequiredService<IConfiguration>()["Jwt:Key"]
                          ?? throw new InvalidOperationException("JWT Key não configurada.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, c.Nome),
                new Claim(ClaimTypes.Email, c.Email),
                new Claim(ClaimTypes.Role, c.Tipo)
            };

            var token = new JwtSecurityToken(
                issuer: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Issuer"],
                audience: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
