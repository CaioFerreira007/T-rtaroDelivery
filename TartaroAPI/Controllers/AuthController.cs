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
using TartaroAPI.Services; // Precisa do IEmailService

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/auth")] // Rota base para autenticação
    public class AuthController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService; // Adicionada dependência

        // Sliding expiration de 1 hora
        private static readonly TimeSpan TokenTtl = TimeSpan.FromHours(1);

        public AuthController(TartaroDbContext context, IConfiguration configuration, IEmailService emailService) // Injetar IEmailService
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        //  LOGIN
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {
            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Email.ToLower().Trim() == login.Email.ToLower().Trim());

            if (cliente is null)
                return Unauthorized("E-mail ou senha incorretos.");

            if (!BCrypt.Net.BCrypt.Verify(login.Senha, cliente.SenhaHash))
                return Unauthorized("E-mail ou senha incorretos.");

            string jwt = GerarJwt(cliente);
            string rToken = await CriarRefreshTokenAsync(cliente.Id);

            return Ok(new
            {
                token = jwt,
                refreshToken = rToken,
                user = MapUser(cliente)
            });
        }

        //  REGISTRO DE CLIENTE
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
                Telefone = dto.Telefone,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Tipo = "cliente" // Define explicitamente o tipo
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            string jwt = GerarJwt(cliente);
            string rToken = await CriarRefreshTokenAsync(cliente.Id);

            return Ok(new
            {
                token = jwt,
                refreshToken = rToken,
                user = MapUser(cliente)
            });
        }

        //  REGISTRO DE ADMINISTRADOR (Apenas ADMs logados podem fazer)
        [Authorize(Roles = "ADM")]
        [HttpPost("register-adm")]
        public async Task<IActionResult> RegisterADM([FromBody] RegisterDTO dto)
        {
            var email = dto.Email.ToLower().Trim();
            if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email))
                return BadRequest("E-mail já cadastrado.");

            var admin = new Cliente
            {
                Nome = dto.Nome,
                Email = email,
                Telefone = dto.Telefone,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Tipo = "ADM" // Define explicitamente o tipo
            };

            _context.Clientes.Add(admin);
            await _context.SaveChangesAsync();

            // Para registro de admin, não retornamos login automático, apenas sucesso.
            return Ok(new { message = "Administrador criado com sucesso.", user = MapUser(admin) });
        }

        //  REFRESH (sliding expiration)
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] TokenDTO dto)
        {
            var tokenSalvo = await _context.RefreshTokens
                .Include(r => r.Cliente)
                .FirstOrDefaultAsync(r => r.Token == dto.RefreshToken && r.Expiracao > DateTime.UtcNow);

            if (tokenSalvo is null)
                return Unauthorized("Refresh token inválido ou expirado.");

            // Remove o antigo
            _context.RefreshTokens.Remove(tokenSalvo);
            await _context.SaveChangesAsync();

            // Cria um novo par de tokens
            string novoJwt = GerarJwt(tokenSalvo.Cliente);
            string novoRToken = await CriarRefreshTokenAsync(tokenSalvo.ClienteId);

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
            var tokenSalvo = await _context.RefreshTokens.FirstOrDefaultAsync(r => r.Token == dto.RefreshToken);

            if (tokenSalvo != null)
            {
                _context.RefreshTokens.Remove(tokenSalvo);
                await _context.SaveChangesAsync();
            }

            return Ok("Logout realizado com sucesso.");
        }

        //  ESQUECI SENHA (SOLICITAÇÃO)
        [HttpPost("esqueci-senha")]
        public async Task<IActionResult> EsqueciSenha([FromBody] SolicitarRecuperacaoDTO dto)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower() == dto.Email.ToLower());

            // Por segurança, não revele se o email existe ou não.
            if (cliente != null)
            {
                var tokensAntigos = _context.PasswordResetTokens.Where(t => t.ClienteId == cliente.Id);
                _context.PasswordResetTokens.RemoveRange(tokensAntigos);

                var resetToken = new PasswordResetToken
                {
                    Token = Guid.NewGuid().ToString(),
                    ExpiraEm = DateTime.UtcNow.AddHours(1),
                    ClienteId = cliente.Id,
                };

                _context.PasswordResetTokens.Add(resetToken);
                await _context.SaveChangesAsync();

                await _emailService.EnviarEmailRecuperacaoAsync(cliente.Email, resetToken.Token);
            }

            return Ok("Se o e-mail existir em nossa base, um link de recuperação será enviado.");
        }

        //  ALTERAR SENHA (COM TOKEN)
        [HttpPost("alterar-senha")]
        public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaDTO dto)
        {
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.Cliente)
                .FirstOrDefaultAsync(t => t.Token == dto.Token && !t.Usado && t.ExpiraEm > DateTime.UtcNow);

            if (resetToken == null)
                return BadRequest("Token inválido, expirado ou já utilizado.");

            if (resetToken.Cliente.Email.ToLower() != dto.Email.ToLower())
                return BadRequest("E-mail não corresponde ao token.");

            resetToken.Cliente.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
            resetToken.Usado = true;
            await _context.SaveChangesAsync();

            return Ok("Senha alterada com sucesso!");
        }

        //  VALIDAR TOKEN DE RESET
        [HttpGet("validar-token-reset/{token}")]
        public async Task<IActionResult> ValidarTokenReset(string token)
        {
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.Cliente)
                .FirstOrDefaultAsync(t => t.Token == token && !t.Usado && t.ExpiraEm > DateTime.UtcNow);

            if (resetToken == null)
                return BadRequest("Token inválido ou expirado.");

            return Ok(new { email = resetToken.Cliente.Email, expiraEm = resetToken.ExpiraEm });
        }


        // ─── Métodos Auxiliares ──────────────────────────────────────────────────

        private string GerarJwt(Cliente cliente)
        {
            var keyString = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key não configurada.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiresAt = DateTime.UtcNow.Add(TokenTtl);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, cliente.Id.ToString()),
                new Claim(ClaimTypes.Name, cliente.Nome),
                new Claim(ClaimTypes.Email, cliente.Email),
                new Claim(ClaimTypes.Role, cliente.Tipo.ToUpper()), // Padroniza para maiúsculas
                new Claim("tipo", cliente.Tipo) // Claim customizada se necessário
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

        private async Task<string> CriarRefreshTokenAsync(int clienteId)
        {
            var refresh = new RefreshToken
            {
                Token = Guid.NewGuid().ToString(),
                Expiracao = DateTime.UtcNow.AddDays(7), // Refresh token com maior duração
                ClienteId = clienteId
            };

            _context.RefreshTokens.Add(refresh);
            await _context.SaveChangesAsync(); // Usar versão assíncrona

            return refresh.Token;
        }

        private object MapUser(Cliente cliente) => new
        {
            id = cliente.Id,
            nome = cliente.Nome,
            email = cliente.Email,
            telefone = cliente.Telefone,
            role = cliente.Tipo
        };
    }
}