
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] //  Protege todos os endpoints deste controller. Apenas usuários logados podem acessar.
    public class ClienteController : ControllerBase
    {
        private readonly TartaroDbContext _context;

        public ClienteController(TartaroDbContext context)
        {
            _context = context;
        }

        //  BUSCAR DADOS DO PRÓPRIO PERFIL
        [HttpGet("perfil")]
        public async Task<IActionResult> GetPerfil()
        {
            // Pega o ID do usuário a partir do token JWT
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized("Token inválido.");
            }

            var cliente = await _context.Clientes
                .AsNoTracking() // Otimização de performance: apenas para leitura
                .FirstOrDefaultAsync(c => c.Id == int.Parse(userId));

            if (cliente == null)
            {
                return NotFound("Cliente não encontrado.");
            }

            // Retorna um objeto anônimo seguro (sem o hash da senha)
            return Ok(new
            {
                id = cliente.Id,
                nome = cliente.Nome,
                email = cliente.Email,
                telefone = cliente.Telefone,
                role = cliente.Tipo
            });
        }

        // Futuramente, você pode adicionar outros endpoints aqui, como:
        // [HttpPut("perfil")] para atualizar dados
        // [HttpGet("meus-pedidos")] para listar os pedidos do cliente
    }
}