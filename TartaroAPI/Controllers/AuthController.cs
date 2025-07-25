using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TartaroAPI.Models;         // Supondo que Cliente esteja aqui
using TartaroAPI.DTOs;          // Para LoginDTO
using TartaroAPI.Services;      // Se IClienteService estiver nessa pasta
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public AuthController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDTO login)
    {
        var cliente = _clienteService.Autenticar(login.Email, login.Senha);
        if (cliente is null)
            return Unauthorized("Credenciais inválidas");

        var token = GerarJwt(cliente!); // 👈 O operador ! diz “confie, não é null”
        return Ok(new { Token = token });
    }

    private string GerarJwt(Cliente cliente)
    {

        var token = new JwtSecurityToken();
        return new JwtSecurityTokenHandler().WriteToken(token); // ✅ garante que token existe
    }
}