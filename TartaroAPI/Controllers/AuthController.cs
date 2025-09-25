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
using TartaroAPI.Services;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;
        private static readonly TimeSpan TokenTtl = TimeSpan.FromHours(1);

        public AuthController(
            TartaroDbContext context, 
            IConfiguration configuration, 
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new { 
                message = "API Tartaro Delivery funcionando!", 
                timestamp = DateTime.UtcNow,
                version = "2.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {
            try
            {
                _logger.LogInformation("Tentativa de login para email: {Email}", login.Email);

                // Validações básicas
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);
                    return BadRequest(new { errors });
                }

                var cliente = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Email.ToLower().Trim() == login.Email.ToLower().Trim() && c.Ativo);
                
                if (cliente == null || !BCrypt.Net.BCrypt.Verify(login.Senha, cliente.SenhaHash))
                {
                    _logger.LogWarning("Falha no login para email: {Email}", login.Email);
                    return Unauthorized(new { message = "Email ou senha incorretos." });
                }

                // Limpar refresh tokens expirados
                await LimparRefreshTokensExpirados(cliente.Id);

                var jwt = GerarJwt(cliente);
                var refreshToken = await CriarRefreshTokenAsync(cliente.Id);
                
                _logger.LogInformation("Login bem-sucedido para cliente: {ClienteId}", cliente.Id);
                
                return Ok(new { 
                    token = jwt, 
                    refreshToken = refreshToken, 
                    user = MapUser(cliente),
                    expiresAt = DateTime.UtcNow.Add(TokenTtl)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro interno no login para email: {Email}", login.Email);
                return StatusCode(500, new { message = "Erro interno do servidor." });
            }
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            try
            {
                _logger.LogInformation("Tentativa de cadastro para email: {Email}", dto.Email);

                // Validações de modelo
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);
                    return BadRequest(new { errors });
                }

                // Validações de negócio
                var validationResult = await ValidarDadosCadastro(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                // Criar cliente
                var cliente = new Cliente
                {
                    Nome = dto.Nome.Trim(),
                    Email = dto.Email.ToLower().Trim(),
                    Telefone = LimparTelefone(dto.Telefone),
                    Endereco = dto.Endereco?.Trim(),
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                    Tipo = "cliente",
                    DataCriacao = DateTime.UtcNow
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                var jwt = GerarJwt(cliente);
                var refreshToken = await CriarRefreshTokenAsync(cliente.Id);
                
                _logger.LogInformation("Cadastro bem-sucedido para cliente: {ClienteId}", cliente.Id);
                
                return Ok(new { 
                    token = jwt, 
                    refreshToken = refreshToken, 
                    user = MapUser(cliente),
                    message = "Cadastro realizado com sucesso!"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro interno no cadastro para email: {Email}", dto.Email);
                return StatusCode(500, new { message = "Erro interno do servidor." });
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Token))
                {
                    return BadRequest(new { message = "Refresh token é obrigatório." });
                }

                var refreshToken = await _context.RefreshTokens
                    .Include(r => r.Cliente)
                    .FirstOrDefaultAsync(r => r.Token == dto.Token && r.Expiracao > DateTime.UtcNow);

                if (refreshToken?.Cliente?.Ativo != true)
                {
                    return Unauthorized(new { message = "Refresh token inválido ou expirado." });
                }

                // Gerar novos tokens
                var newJwt = GerarJwt(refreshToken.Cliente);
                var newRefreshToken = await CriarRefreshTokenAsync(refreshToken.ClienteId);
                
                // Remover o refresh token usado
                _context.RefreshTokens.Remove(refreshToken);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    token = newJwt, 
                    refreshToken = newRefreshToken,
                    expiresAt = DateTime.UtcNow.Add(TokenTtl)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao renovar token: {Token}", dto.Token);
                return StatusCode(500, new { message = "Erro interno do servidor." });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenDTO dto)
        {
            try
            {
                if (!string.IsNullOrEmpty(dto.Token))
                {
                    var refreshToken = await _context.RefreshTokens
                        .FirstOrDefaultAsync(r => r.Token == dto.Token);
                    
                    if (refreshToken != null)
                    {
                        _context.RefreshTokens.Remove(refreshToken);
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new { message = "Logout realizado com sucesso." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no logout");
                return Ok(new { message = "Logout realizado." });
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Email inválido." });
                }

                var cliente = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Email.ToLower() == dto.Email.ToLower() && c.Ativo);
                
                if (cliente != null)
                {
                    var resetToken = Guid.NewGuid().ToString();
                    cliente.TokenRecuperacao = resetToken;
                    cliente.TokenExpiraEm = DateTime.UtcNow.AddHours(1);

                    await _context.SaveChangesAsync();
                    await _emailService.EnviarEmailRecuperacaoAsync(cliente.Email, resetToken);
                }

                // Sempre retorna sucesso por segurança
                return Ok(new { message = "Se o email existir, você receberá instruções para redefinir sua senha." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no forgot password para email: {Email}", dto.Email);
                return StatusCode(500, new { message = "Erro interno do servidor." });
            }
        }

        // Métodos auxiliares privados
        private async Task<ValidationResult> ValidarDadosCadastro(RegisterDTO dto)
        {
            // Verificar email único
            if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == dto.Email.ToLower().Trim()))
            {
                return ValidationResult.Fail("Email já está em uso.");
            }

            // Validar telefone
            var telefoneNumeros = LimparTelefone(dto.Telefone);
            if (string.IsNullOrEmpty(telefoneNumeros) || !ValidarTelefoneBrasileiro(telefoneNumeros))
            {
                return ValidationResult.Fail("Telefone inválido. Use o formato brasileiro com DDD.");
            }

            // Verificar telefone único
            if (await _context.Clientes.AnyAsync(c => c.Telefone == telefoneNumeros))
            {
                return ValidationResult.Fail("Telefone já está em uso.");
            }

            return ValidationResult.Success();
        }

        private static string LimparTelefone(string telefone)
        {
            return string.IsNullOrEmpty(telefone) ? "" : 
                System.Text.RegularExpressions.Regex.Replace(telefone, @"\D", "");
        }

        private static bool ValidarTelefoneBrasileiro(string telefone)
        {
            if (telefone.Length < 10 || telefone.Length > 11)
                return false;

            var ddd = int.Parse(telefone.Substring(0, 2));
            if (ddd < 11 || ddd > 99)
                return false;

            // Se tem 11 dígitos, deve ser celular (9 na terceira posição)
            if (telefone.Length == 11 && telefone[2] != '9')
                return false;

            return true;
        }

        private async Task LimparRefreshTokensExpirados(int clienteId)
        {
            var tokensExpirados = await _context.RefreshTokens
                .Where(r => r.ClienteId == clienteId && r.Expiracao <= DateTime.UtcNow)
                .ToListAsync();

            if (tokensExpirados.Any())
            {
                _context.RefreshTokens.RemoveRange(tokensExpirados);
                await _context.SaveChangesAsync();
            }
        }

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
                new Claim(ClaimTypes.Role, cliente.Tipo.ToUpper()),
                new Claim("telefone", cliente.Telefone ?? ""),
                new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };
            
            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"], 
                _configuration["Jwt:Audience"], 
                claims, 
                expires: expiresAt, 
                signingCredentials: creds
            );
            
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<string> CriarRefreshTokenAsync(int clienteId)
        {
            var refresh = new RefreshToken 
            { 
                Token = Guid.NewGuid().ToString() + Guid.NewGuid().ToString(), // Token mais longo
                Expiracao = DateTime.UtcNow.AddDays(30), // 30 dias
                ClienteId = clienteId 
            };
            
            _context.RefreshTokens.Add(refresh);
            await _context.SaveChangesAsync();
            
            return refresh.Token;
        }

        private object MapUser(Cliente cliente) => new 
        { 
            id = cliente.Id, 
            nome = cliente.Nome, 
            email = cliente.Email, 
            telefone = cliente.Telefone,
            endereco = cliente.Endereco,
            tipo = cliente.Tipo,
            role = cliente.Tipo?.ToUpper(),
            dataCriacao = cliente.DataCriacao,
            ativo = cliente.Ativo
        };

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // Classe auxiliar para validação
        private class ValidationResult
        {
            public bool IsValid { get; set; }
            public string ErrorMessage { get; set; } = string.Empty;

            public static ValidationResult Success() => new() { IsValid = true };
            public static ValidationResult Fail(string message) => new() { IsValid = false, ErrorMessage = message };
        }
    }
}