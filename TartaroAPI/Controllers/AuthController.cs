using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using TartaroAPI.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;
using TartaroAPI.DTOs;
using Microsoft.EntityFrameworkCore;
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

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDTO login)
    {
        var cliente = _context.Clientes.FirstOrDefault(c => c.Email == login.Email);
        if (cliente is null)
            return Unauthorized("Email não encontrado.");

        bool senhaValida = BCrypt.Net.BCrypt.Verify(login.Senha, cliente.SenhaHash);
        if (!senhaValida)
            return Unauthorized("Senha incorreta.");

        var token = GerarJwt(cliente);

        var refresh = new RefreshToken
        {
            Token = Guid.NewGuid().ToString(),
            Expiracao = DateTime.UtcNow.AddDays(7),
            ClienteId = cliente.Id
        };

        _context.RefreshTokens.Add(refresh);
        _context.SaveChanges();

        // ✅ Agora retorna o objeto completo do usuário
        return Ok(new
        {
            token,
            refreshToken = refresh.Token,
            user = new
            {
                id = cliente.Id,
                nome = cliente.Nome,
                email = cliente.Email,
                tipo = cliente.Tipo
            }
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] registerDTO dto)
    {
        if (await _context.Clientes.AnyAsync(c => c.Email == dto.Email))
            return BadRequest("Email já cadastrado.");

        var senhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);

        var cliente = new Cliente
        {
            Nome = dto.Nome,
            Email = dto.Email,
            SenhaHash = senhaHash,
            Tipo = "cliente"
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

        // ✅ Também retorna o usuário completo aqui
        return Ok(new
        {
            token,
            refreshToken = refresh.Token,
            user = new
            {
                id = cliente.Id,
                nome = cliente.Nome,
                email = cliente.Email,
                tipo = cliente.Tipo
            }
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken)
    {
        var tokenSalvo = await _context.RefreshTokens
            .Include(r => r.Cliente)
            .FirstOrDefaultAsync(r => r.Token == refreshToken && r.Expiracao > DateTime.UtcNow);

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
            user = new
            {
                id = tokenSalvo.Cliente.Id,
                nome = tokenSalvo.Cliente.Nome,
                email = tokenSalvo.Cliente.Email,
                tipo = tokenSalvo.Cliente.Tipo
            }
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] string refreshToken)
    {
        var tokenSalvo = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (tokenSalvo is null)
            return NotFound("Refresh token não encontrado.");

        _context.RefreshTokens.Remove(tokenSalvo);
        await _context.SaveChangesAsync();

        return Ok("Logout realizado com sucesso.");
    }

    private string GerarJwt(Cliente cliente)
    {
        var chaveString = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(chaveString))
            throw new InvalidOperationException("A chave JWT não foi configurada corretamente.");

        var chave = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(chaveString));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, cliente.Id.ToString()),
            new Claim(ClaimTypes.Name, cliente.Nome),
            new Claim(ClaimTypes.Email, cliente.Email),
            new Claim("tipo", cliente.Tipo)
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
}