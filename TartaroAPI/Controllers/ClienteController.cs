using TartaroAPI.Services;
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
        private readonly IEmailService _emailService;

        public ClienteController(TartaroDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // 🧾 Cadastro de cliente + login automático

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

        // 📧 SOLICITAR RESET DE SENHA

        [HttpPost("esqueci-senha")]
        public async Task<IActionResult> EsqueciSenha([FromBody] SolicitarRecuperacaoDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Email.ToLower() == dto.Email.ToLower());

            // Sempre retorna sucesso (por segurança, não revelar se email existe)
            if (cliente == null)
                return Ok("Se o e-mail existir, um link de recuperação será enviado.");

            try
            {
                // Remove tokens antigos para este cliente
                var tokensAntigos = _context.PasswordResetTokens
                    .Where(t => t.ClienteId == cliente.Id);
                _context.PasswordResetTokens.RemoveRange(tokensAntigos);

                // Cria novo token
                var resetToken = new PasswordResetToken
                {
                    Token = Guid.NewGuid().ToString(),
                    ExpiraEm = DateTime.UtcNow.AddHours(1), // Expira em 1 hora
                    ClienteId = cliente.Id,
                    Usado = false
                };

                _context.PasswordResetTokens.Add(resetToken);
                await _context.SaveChangesAsync();

                await _emailService.EnviarEmailRecuperacaoAsync(cliente.Email, resetToken.Token);


                // Por enquanto, vou logar o token (REMOVER EM PRODUÇÃO)
                Console.WriteLine($"Token de reset para {cliente.Email}: {resetToken.Token}");
                Console.WriteLine($"Link de reset: http://localhost:3000/alterar-senha/{resetToken.Token}");

                return Ok("Se o e-mail existir, um link de recuperação será enviado.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao processar solicitação: {ex.Message}");
            }
        }

        // 🔄 ALTERAR SENHA COM TOKEN
        [HttpPost("alterar-senha")]
        public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.Cliente)
                .FirstOrDefaultAsync(t =>
                    t.Token == dto.Token &&
                    !t.Usado &&
                    t.ExpiraEm > DateTime.UtcNow);

            if (resetToken == null)
                return BadRequest("Token inválido, expirado ou já utilizado.");

            // Verifica se o e-mail confere
            if (resetToken.Cliente.Email.ToLower() != dto.Email.ToLower())
                return BadRequest("E-mail não confere com o token.");

            try
            {
                // Atualiza a senha
                resetToken.Cliente.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);

                // Marca o token como usado
                resetToken.Usado = true;

                await _context.SaveChangesAsync();

                return Ok("Senha alterada com sucesso!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao alterar senha: {ex.Message}");
            }
        }

        // 🔍 VALIDAR TOKEN (opcional - para verificar se token é válido)
        [AllowAnonymous]
        [HttpGet("validar-token-reset/{token}")]
        public async Task<IActionResult> ValidarTokenReset(string token)
        {
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.Cliente)
                .FirstOrDefaultAsync(t =>
                    t.Token == token &&
                    !t.Usado &&
                    t.ExpiraEm > DateTime.UtcNow);

            if (resetToken == null)
                return BadRequest("Token inválido ou expirado.");

            return Ok(new
            {
                email = resetToken.Cliente.Email,
                expiraEm = resetToken.ExpiraEm
            });
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