using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTOs;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClienteController : ControllerBase
    {
        private readonly TartaroDbContext _context;

        public ClienteController(TartaroDbContext context)
        {
            _context = context;
        }

        [HttpPut("perfil")]
        public async Task<IActionResult> UpdatePerfil([FromBody] ClienteUpdateDTO dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Token inválido." });
                }

                var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == int.Parse(userId));

                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente não encontrado." });
                }

                // Validações básicas
                if (string.IsNullOrWhiteSpace(dto.Nome))
                {
                    return BadRequest(new { message = "Nome é obrigatório." });
                }

                // Atualiza os dados
                cliente.Nome = dto.Nome.Trim();
                cliente.Telefone = dto.Telefone?.Trim() ?? "";

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Perfil atualizado com sucesso!",
                    user = new
                    {
                        id = cliente.Id,
                        nome = cliente.Nome,
                        email = cliente.Email,
                        telefone = cliente.Telefone,
                        role = cliente.Tipo
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        [HttpGet("perfil")]
        public async Task<IActionResult> GetPerfil()
        {
            try
            {
                // Pega o ID do usuário a partir do token JWT
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Token inválido." });
                }

                var cliente = await _context.Clientes
                    .AsNoTracking() // Otimização de performance: apenas para leitura
                    .FirstOrDefaultAsync(c => c.Id == int.Parse(userId));

                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente não encontrado." });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        [HttpGet("listar")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> ListarClientes([FromQuery] int page = 1, [FromQuery] int size = 10)
        {
            try
            {
                var skip = (page - 1) * size;
                
                var clientes = await _context.Clientes
                    .AsNoTracking()
                    .Where(c => c.Tipo == "cliente") // Só clientes, não ADMs
                    .OrderBy(c => c.Nome)
                    .Skip(skip)
                    .Take(size)
                    .Select(c => new
                    {
                        id = c.Id,
                        nome = c.Nome,
                        email = c.Email,
                        telefone = c.Telefone,
                        tipo = c.Tipo
                    })
                    .ToListAsync();

                var total = await _context.Clientes.CountAsync(c => c.Tipo == "cliente");

                return Ok(new
                {
                    clientes,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = size,
                        totalItems = total,
                        totalPages = (int)Math.Ceiling(total / (double)size)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> DeletarCliente(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == id);

                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente não encontrado." });
                }

                // Não permite deletar ADMs
                if (cliente.Tipo.ToUpper() == "ADM")
                {
                    return BadRequest(new { message = "Não é possível deletar um administrador." });
                }

                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cliente deletado com sucesso." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }
    }
}