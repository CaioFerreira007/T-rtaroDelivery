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
        private static readonly TimeSpan TokenTtl = TimeSpan.FromHours(1);

        public AuthController(TartaroDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        // TESTE - Endpoint para verificar se a API está funcionando
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new { 
                message = "API Tartaro Delivery funcionando!", 
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {
            try
            {
                // Log para debug
                Console.WriteLine($"Tentativa de login: {login.Email}");

                if (string.IsNullOrWhiteSpace(login.Email) || string.IsNullOrWhiteSpace(login.Senha))
                {
                    return BadRequest("Email e senha são obrigatórios.");
                }

                var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower().Trim() == login.Email.ToLower().Trim());
                
                if (cliente is null)
                {
                    Console.WriteLine($"Cliente não encontrado: {login.Email}");
                    return Unauthorized("E-mail ou senha incorretos.");
                }

                if (!BCrypt.Net.BCrypt.Verify(login.Senha, cliente.SenhaHash))
                {
                    Console.WriteLine($"Senha incorreta para: {login.Email}");
                    return Unauthorized("E-mail ou senha incorretos.");
                }

                string jwt = GerarJwt(cliente);
                string rToken = await CriarRefreshTokenAsync(cliente.Id);
                
                var response = new { token = jwt, refreshToken = rToken, user = MapUser(cliente) };
                Console.WriteLine($"Login bem-sucedido: {cliente.Email}");
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro no login: {ex.Message}");
                return StatusCode(500, "Erro interno do servidor.");
            }
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            try
            {
                Console.WriteLine($"Tentativa de cadastro: {dto.Email}");

                // Validações
                if (string.IsNullOrWhiteSpace(dto.Nome) || dto.Nome.Trim().Length < 2)
                {
                    return BadRequest("Nome deve ter pelo menos 2 caracteres.");
                }

                if (string.IsNullOrWhiteSpace(dto.Email) || !IsValidEmail(dto.Email))
                {
                    return BadRequest("Email inválido.");
                }

                if (string.IsNullOrWhiteSpace(dto.Senha) || dto.Senha.Length < 6)
                {
                    return BadRequest("Senha deve ter pelo menos 6 caracteres.");
                }

                var telefoneNumeros = dto.Telefone?.Replace(System.Text.RegularExpressions.Regex.Replace(dto.Telefone, @"\D", ""), "") ?? "";
                if (telefoneNumeros.Length < 10)
                {
                    return BadRequest("Telefone inválido. Inclua o DDD.");
                }

                var email = dto.Email.ToLower().Trim();
                
                if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email))
                {
                    Console.WriteLine($"Email já existe: {email}");
                    return BadRequest("E-mail já cadastrado.");
                }

                var cliente = new Cliente
                {
                    Nome = dto.Nome.Trim(),
                    Email = email,
                    Telefone = telefoneNumeros,
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                    Tipo = "cliente"
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                string jwt = GerarJwt(cliente);
                string rToken = await CriarRefreshTokenAsync(cliente.Id);
                
                var response = new { token = jwt, refreshToken = rToken, user = MapUser(cliente) };
                Console.WriteLine($"Cadastro bem-sucedido: {cliente.Email} - ID: {cliente.Id}");
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro no cadastro: {ex.Message}");
                return StatusCode(500, "Erro interno do servidor.");
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenDTO dto)
        {
            try
            {
                var refreshToken = await _context.RefreshTokens
                    .Include(r => r.Cliente)
                    .FirstOrDefaultAsync(r => r.Token == dto.Token && r.Expiracao > DateTime.UtcNow);

                if (refreshToken == null)
                {
                    return Unauthorized("Refresh token inválido ou expirado.");
                }

                // Gerar novo JWT
                string newJwt = GerarJwt(refreshToken.Cliente);
                
                // Opcional: Gerar novo refresh token
                string newRefreshToken = await CriarRefreshTokenAsync(refreshToken.ClienteId);
                
                // Remover o refresh token usado
                _context.RefreshTokens.Remove(refreshToken);
                await _context.SaveChangesAsync();

                return Ok(new { token = newJwt, refreshToken = newRefreshToken });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro no refresh token: {ex.Message}");
                return StatusCode(500, "Erro interno do servidor.");
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
                    var refreshToken = await _context.RefreshTokens.FirstOrDefaultAsync(r => r.Token == dto.Token);
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
                Console.WriteLine($"Erro no logout: {ex.Message}");
                return Ok(new { message = "Logout realizado." }); // Mesmo com erro, considera logout
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO dto)
        {
            try
            {
                var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower() == dto.Email.ToLower());
                
                if (cliente == null)
                {
                    // Por segurança, sempre retorna sucesso mesmo se email não existir
                    return Ok(new { message = "Se o email existir, você receberá instruções para redefinir sua senha." });
                }

                // Gerar token de recuperação
                var resetToken = Guid.NewGuid().ToString();
                cliente.TokenRecuperacao = resetToken;
                cliente.TokenExpiraEm = DateTime.UtcNow.AddHours(1);

                await _context.SaveChangesAsync();

                // Enviar email (implementar conforme seu IEmailService)
                // await _emailService.SendPasswordResetEmail(cliente.Email, resetToken);

                return Ok(new { message = "Se o email existir, você receberá instruções para redefinir sua senha." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro no forgot password: {ex.Message}");
                return StatusCode(500, "Erro interno do servidor.");
            }
        }

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
                Tipo = "ADM"
            };
            _context.Clientes.Add(admin);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Administrador criado com sucesso.", user = MapUser(admin) });
        }
        
        [AllowAnonymous]
        [HttpPost("setup-admins")]
        public async Task<IActionResult> SetupAdmins([FromQuery] string secretKey)
        {
            var setupKey = _configuration["SetupSecretKey"];
            if (string.IsNullOrEmpty(setupKey) || secretKey != setupKey)
            {
                return Unauthorized("Chave secreta para setup inválida.");
            }

            var results = new List<string>();

            if (!await _context.Clientes.AnyAsync(c => c.Email == "myprofilejobs07@outlook.com"))
            {
                _context.Clientes.Add(new Cliente { Nome = "Caio Gustavo", Email = "myprofilejobs07@outlook.com", SenhaHash = BCrypt.Net.BCrypt.HashPassword("cocodopou"), Tipo = "ADM", Telefone = "" });
                results.Add("Usuário 'Caio Gustavo' criado com sucesso.");
            } else { results.Add("Usuário 'Caio Gustavo' já existe."); }

            if (!await _context.Clientes.AnyAsync(c => c.Email == "gabriel@tartaro.com"))
            {
                _context.Clientes.Add(new Cliente { Nome = "Gabriel", Email = "gabriel@tartaro.com", SenhaHash = BCrypt.Net.BCrypt.HashPassword("tartarohamburgueriadelivery2025"), Tipo = "ADM", Telefone = "" });
                results.Add("Usuário 'Gabriel' criado com sucesso.");
            } else { results.Add("Usuário 'Gabriel' já existe."); }
            
            await _context.SaveChangesAsync();
            return Ok(results);
        }

        // Métodos auxiliares
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
            };
            var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, expires: expiresAt, signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<string> CriarRefreshTokenAsync(int clienteId)
        {
            var refresh = new RefreshToken { Token = Guid.NewGuid().ToString(), Expiracao = DateTime.UtcNow.AddDays(7), ClienteId = clienteId };
            _context.RefreshTokens.Add(refresh);
            await _context.SaveChangesAsync();
            return refresh.Token;
        }

        private object MapUser(Cliente cliente) => new { id = cliente.Id, nome = cliente.Nome, email = cliente.Email, telefone = cliente.Telefone, role = cliente.Tipo };

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
    }
}