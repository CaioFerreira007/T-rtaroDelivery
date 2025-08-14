using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTO;
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

        public PedidoController(TartaroDbContext context)
        {
            _context = context;
        }

        // 🔹 Criar pedido (rascunho ou tradicional)
        [HttpPost]
        public async Task<IActionResult> CriarPedido([FromBody] PedidoCreateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ids = dto.Itens.Select(i => i.ProdutoId).ToList();
            var produtos = await _context.Produtos
                .Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            if (produtos.Count != ids.Distinct().Count())
                return BadRequest("Um ou mais produtos são inválidos ou indisponíveis.");

            decimal subtotal = 0m;
            var itens = dto.Itens.Select(i =>
            {
                var prod = produtos[i.ProdutoId];
                subtotal += prod.Preco * i.Quantidade;

                return new ItemPedido
                {
                    ProdutoId = prod.Id,
                    Quantidade = i.Quantidade
                };
            }).ToList();

            // 🔐 Gera código único
            string codigo;
            do
            {
                codigo = OrderCodeGenerator.NewCode();
            } while (await _context.Pedidos.AnyAsync(p => p.Codigo == codigo));

            var pedido = new Pedido
            {
                ClienteId = dto.ClienteId,
                DataPedido = DateTime.UtcNow,
                Status = dto.IsRascunho ? "AGUARDANDO_CONFIRMACAO" : "Recebido",
                Codigo = codigo,
                NomeCliente = dto.NomeCliente,
                Endereco = dto.Endereco,
                Referencia = dto.Referencia,
                Observacoes = dto.Observacoes,
                Subtotal = subtotal,
                Itens = itens
            };

            if (!dto.IsRascunho)
            {
                if (string.IsNullOrWhiteSpace(dto.FormaPagamento))
                    return BadRequest("Forma de pagamento é obrigatória para pedidos tradicionais.");

                pedido.Pagamento = new Pagamento
                {
                    ValorTotal = subtotal,
                    FormaPagamento = dto.FormaPagamento,
                    Pago = false
                };
            }

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            // 🔄 Retorno padronizado com orderId
            var resposta = new
            {
                id = pedido.Id,
                codigo = pedido.Codigo,
                subtotal = pedido.Subtotal,
                status = pedido.Status,
                dataPedido = pedido.DataPedido,
                nomeCliente = pedido.NomeCliente,
                endereco = pedido.Endereco,
                referencia = pedido.Referencia,
                observacoes = pedido.Observacoes,
                formaPagamento = pedido.Pagamento?.FormaPagamento
            };

            if (dto.IsRascunho)
                return Ok(resposta);

            return CreatedAtAction(nameof(ObterPedido), new { id = pedido.Id }, resposta);
        }

        // 🔹 Listar todos os pedidos
        [HttpGet]
        public async Task<IActionResult> ListarPedidos() =>
            Ok(await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Itens).ThenInclude(i => i.Produto)
                .Include(p => p.Pagamento)
                .ToListAsync());

        // 🔹 Obter pedido por ID
        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Itens).ThenInclude(i => i.Produto)
                .Include(p => p.Pagamento)
                .FirstOrDefaultAsync(p => p.Id == id);

            return pedido == null ? NotFound() : Ok(pedido);
        }

        // 🔹 Confirmar pagamento
        [HttpPut("{id}/confirmar-pagamento")]
        public async Task<IActionResult> ConfirmarPagamento(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Pagamento)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido?.Pagamento == null)
                return NotFound("Pedido ou pagamento não encontrado.");

            pedido.Pagamento.Pago = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // 🔹 Finalizar pedido
        [HttpPut("{id}/finalizar")]
        public async Task<IActionResult> FinalizarPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Pagamento)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
                return NotFound("Pedido não encontrado.");

            if (pedido.Status == "Finalizado")
                return BadRequest("Pedido já está finalizado.");

            pedido.Status = "Finalizado";
            pedido.DataPedido = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                pedido.Id,
                pedido.Status,
                pedido.DataPedido
            });
        }

        // 🔒 Meus pedidos
        [HttpGet("meus")]
        public async Task<IActionResult> MeusPedidos()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim))
                return Unauthorized("Token JWT inválido.");

            var lista = await _context.Pedidos
                .Where(p => p.ClienteId == int.Parse(claim))
                .Include(p => p.Itens).ThenInclude(i => i.Produto)
                .Include(p => p.Pagamento)
                .ToListAsync();

            return Ok(lista);
        }
    }
}