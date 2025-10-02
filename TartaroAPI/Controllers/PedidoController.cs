using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TartaroAPI.Data;
using TartaroAPI.DTO;
using TartaroAPI.DTOs;
using TartaroAPI.Models;
using TartaroAPI.Services;

namespace TartaroAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PedidoController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IPedidoService _pedidoService;

        public PedidoController(TartaroDbContext context, IPedidoService pedidoService)
        {
            _context = context;
            _pedidoService = pedidoService;
        }

        [HttpPost]
        public async Task<IActionResult> CriarPedido([FromBody] PedidoCreateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var pedido = await _pedidoService.CriarPedidoAsync(dto);

                var resposta = new
                {
                    id = pedido.Id,
                    codigo = pedido.Codigo,
                    status = pedido.Status,
                    dataPedido = pedido.DataPedido,
                    subtotal = pedido.Subtotal
                };

                return CreatedAtAction(nameof(ObterPedido), new { id = pedido.Id }, resposta);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> ListarPedidos()
        {
            var pedidosDto = await _context.Pedidos
                .AsNoTracking()
                .OrderByDescending(p => p.DataPedido)
                .Select(p => new PedidoResumoDTO
                {
                    Id = p.Id,
                    Codigo = p.Codigo,
                    DataPedido = p.DataPedido,
                    Status = p.Status,
                    NomeCliente = p.NomeCliente,
                    Subtotal = p.Subtotal
                })
                .ToListAsync();

            return Ok(pedidosDto);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Itens).ThenInclude(i => i.Produto)
                .Include(p => p.Pagamento)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole != "ADM" && pedido.ClienteId.ToString() != userId)
            {
                return Forbid();
            }

            return Ok(pedido);
        }

        // ✅ CORRIGIDO: /meus agora resolve ClienteId com segurança
        [HttpGet("meus")]
        public async Task<IActionResult> MeusPedidos()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var emailClaim = User.FindFirstValue(ClaimTypes.Email);

            // tentar encontrar o cliente por ID OU Email
            Cliente? cliente = null;

            if (int.TryParse(userIdClaim, out int parsedId))
            {
                cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == parsedId);
            }

            if (cliente == null && !string.IsNullOrEmpty(emailClaim))
            {
                cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == emailClaim);
            }

            if (cliente == null)
                return Unauthorized("Cliente não encontrado para este token.");

            var pedidosDto = await _context.Pedidos
                .Where(p => p.ClienteId == cliente.Id)
                .AsNoTracking()
                .OrderByDescending(p => p.DataPedido)
                .Select(p => new PedidoResumoDTO
                {
                    Id = p.Id,
                    Codigo = p.Codigo,
                    DataPedido = p.DataPedido,
                    Status = p.Status,
                    NomeCliente = p.NomeCliente,
                    Subtotal = p.Subtotal
                })
                .ToListAsync();

            return Ok(pedidosDto);
        }

        [HttpPut("{id}/confirmar-pagamento")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> ConfirmarPagamento(int id)
        {
            var pedido = await _context.Pedidos.Include(p => p.Pagamento).FirstOrDefaultAsync(p => p.Id == id);
            if (pedido?.Pagamento == null) return NotFound("Pedido ou pagamento não encontrado.");

            pedido.Pagamento.Pago = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> AtualizarStatus(int id, [FromBody] string novoStatus)
        {
            var pedido = await _context.Pedidos.FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return NotFound("Pedido não encontrado.");

            pedido.Status = novoStatus;
            await _context.SaveChangesAsync();
            return Ok(new { pedido.Id, pedido.Status });
        }
    }
}
