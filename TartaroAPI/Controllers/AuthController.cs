using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TartaroAPI.Data;
using TartaroAPI.DTO;
using TartaroAPI.Models;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IConfiguration _configuration;

        // Sliding expiration de 1 hora
        private static readonly TimeSpan TokenTtl = TimeSpan.FromHours(1);

        public AuthController(TartaroDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // 🔑 LOGIN
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {
            // Validação automática via ValidateModelAttribute
            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c =>
                    c.Email.ToLower().Trim() == login.Email.ToLower().Trim());

            if (cliente is null)
                return Unauthorized("E-mail não encontrado.");

            if (!BCrypt.Net.BCrypt.Verify(login.Senha, cliente.SenhaHash))
                return Unauthorized("Senha incorreta.");

            string jwt = GerarJwt(cliente);
            string rToken = CriarRefreshToken(cliente.Id);

            return Ok(new
            {
                token = jwt,
                refreshToken = rToken,
                user = MapUser(cliente)
            });
        }

        // 👤 REGISTRO DE CLIENTE
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            var email = dto.Email.ToLower().Trim();
            if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email))
                return BadRequest("E-mail já cadastrado.");

            var cliente = new Cliente
            {
                Nome = dto.Nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Tipo = "cliente"
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            string jwt = GerarJwt(cliente);
            string rToken = CriarRefreshToken(cliente.Id);

            return Ok(new
            {
                token = jwt,
                refreshToken = rToken,
                user = MapUser(cliente)
            });
        }

        // 👑 REGISTRO DE ADMINISTRADOR
        [Authorize(Roles = "ADM")]
        [HttpPost("register-adm")]
        public async Task<IActionResult> RegisterADM([FromBody] RegisterDTO dto)
        {
            var email = dto.Email.ToLower().Trim();
            if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email))
                return BadRequest("E-mail já cadastrado.");

            var cliente = new Cliente
            {
                Nome = dto.Nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Tipo = "ADM"
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            string jwt = GerarJwt(cliente);
            string rToken = CriarRefreshToken(cliente.Id);

            return Ok(new
            {
                token = jwt,
                refreshToken = rToken,
                user = MapUser(cliente)
            });
        }

        // 🔄 REFRESH (sliding expiration)
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] TokenDTO dto)
        {
            var tokenSalvo = await _context.RefreshTokens
                .Include(r => r.Cliente)
                .FirstOrDefaultAsync(r =>
                    r.Token == dto.RefreshToken &&
                    r.Expiracao > DateTime.UtcNow);

            if (tokenSalvo is null)
                return Unauthorized("Refresh token inválido ou expirado.");

            // Remove o antigo e cria um novo
            _context.RefreshTokens.Remove(tokenSalvo);
            await _context.SaveChangesAsync();

            string novoJwt = GerarJwt(tokenSalvo.Cliente);
            string novoRToken = CriarRefreshToken(tokenSalvo.ClienteId);

            return Ok(new
            {
                token = novoJwt,
                refreshToken = novoRToken,
                user = MapUser(tokenSalvo.Cliente)
            });
        }

        // 🚪 LOGOUT
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] TokenDTO dto)
        {
            var tokenSalvo = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == dto.RefreshToken);

            if (tokenSalvo is null)
                return NotFound("Refresh token não encontrado.");

            _context.RefreshTokens.Remove(tokenSalvo);
            await _context.SaveChangesAsync();

            return Ok("Logout realizado com sucesso.");
        }

        // ─── Helpers ─────────────────────────────────────────────────────────────

        private string GerarJwt(Cliente cliente)
        {
            var keyString = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key não configurada.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiresAt = DateTime.UtcNow.Add(TokenTtl);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, cliente.Id.ToString()),
                new Claim(ClaimTypes.Name, cliente.Nome),
                new Claim(ClaimTypes.Email, cliente.Email),
                new Claim("tipo", cliente.Tipo),
                new Claim(ClaimTypes.Role, cliente.Tipo.ToUpper())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string CriarRefreshToken(int clienteId)
        {
            var refresh = new RefreshToken
            {
                Token = Guid.NewGuid().ToString(),
                Expiracao = DateTime.UtcNow.Add(TokenTtl),
                ClienteId = clienteId
            };

            _context.RefreshTokens.Add(refresh);
            _context.SaveChanges();

            return refresh.Token;
        }

        private object MapUser(Cliente cliente) => new
        {
            id = cliente.Id,
            nome = cliente.Nome,
            email = cliente.Email,
            role = cliente.Tipo
        };
    }
}
