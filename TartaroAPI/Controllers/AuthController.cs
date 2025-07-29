using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TartaroAPI.Data;
using TartaroAPI.DTOs;
using TartaroAPI.Models;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TartaroDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(TartaroDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // 🔑 LOGIN
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO login)
    {
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Email.ToLower().Trim() == login.Email.ToLower().Trim());

        if (cliente is null)
            return Unauthorized("Email não encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(login.Senha, cliente.SenhaHash))
            return Unauthorized("Senha incorreta.");

        var token = GerarJwt(cliente);

        var refresh = new RefreshToken
        {
            Token = Guid.NewGuid().ToString(),
            Expiracao = DateTime.UtcNow.AddDays(7),
            ClienteId = cliente.Id
        };

        _context.RefreshTokens.Add(refresh);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            token,
            refreshToken = refresh.Token,
            user = MapUser(cliente)
        });
    }

    // 👤 REGISTRO DE CLIENTE
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] registerDTO dto)
    {
        var email = dto.Email.ToLower().Trim();

        if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email))
            return BadRequest("Email já cadastrado.");

        var senhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);

        var cliente = new Cliente
        {
            Nome = dto.Nome,
            Email = email,
            SenhaHash = senhaHash,
            Tipo = "cliente"
        };

        _context.Clientes.Add(cliente);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var inner = ex.InnerException?.Message;
            if (inner != null && inner.Contains("UNIQUE"))
                return BadRequest("Email já cadastrado.");
            throw;
        }

        var token = GerarJwt(cliente);
        var refresh = new RefreshToken
        {
            Token = Guid.NewGuid().ToString(),
            Expiracao = DateTime.UtcNow.AddDays(7),
            ClienteId = cliente.Id
        };

        _context.RefreshTokens.Add(refresh);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            token,
            refreshToken = refresh.Token,
            user = MapUser(cliente)
        });
    }

    // 👑 REGISTRO DE ADMINISTRADOR
    [Authorize(Roles = "ADM")]
    [HttpPost("register-adm")]
    public async Task<IActionResult> RegisterADM([FromBody] registerDTO dto)
    {
        var email = dto.Email.ToLower().Trim();

        if (await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email))
            return BadRequest("Email já cadastrado.");

        var cliente = new Cliente
        {
            Nome = dto.Nome,
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            Tipo = "ADM"
        };

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var token = GerarJwt(cliente);
        var refresh = new RefreshToken
        {
            Token = Guid.NewGuid().ToString(),
            Expiracao = DateTime.UtcNow.AddDays(7),
            ClienteId = cliente.Id
        };

        _context.RefreshTokens.Add(refresh);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            token,
            refreshToken = refresh.Token,
            user = MapUser(cliente)
        });
    }

    // 🔄 REFRESH
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] TokenDTO dto)
    {
        var tokenSalvo = await _context.RefreshTokens
            .Include(r => r.Cliente)
            .FirstOrDefaultAsync(r => r.Token == dto.RefreshToken && r.Expiracao > DateTime.UtcNow);

        if (tokenSalvo is null)
            return Unauthorized("Refresh token inválido ou expirado.");

        _context.RefreshTokens.Remove(tokenSalvo);

        var novoRefresh = new RefreshToken
        {
            Token = Guid.NewGuid().ToString(),
            Expiracao = DateTime.UtcNow.AddDays(7),
            ClienteId = tokenSalvo.ClienteId
        };

        _context.RefreshTokens.Add(novoRefresh);
        await _context.SaveChangesAsync();

        var novoJwt = GerarJwt(tokenSalvo.Cliente);

        return Ok(new
        {
            token = novoJwt,
            refreshToken = novoRefresh.Token,
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

    // 🔐 GERAÇÃO DE TOKEN JWT
    private string GerarJwt(Cliente cliente)
    {
        var chaveString = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(chaveString))
            throw new InvalidOperationException("JWT mal configurado.");

        var chave = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(chaveString));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

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
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // 🧬 MAPEIA OBJETO DO USUÁRIO
    private object MapUser(Cliente cliente)
    {
        return new
        {
            id = cliente.Id,
            nome = cliente.Nome,
            email = cliente.Email,
            tipo = cliente.Tipo
        };
    }
}

// DTO auxiliar
public class TokenDTO
{
    public required string RefreshToken { get; set; }
}