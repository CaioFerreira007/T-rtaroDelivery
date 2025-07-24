using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.Models;

namespace TartaroAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PedidoController : ControllerBase
{
    private readonly TartaroDbContext _context;

    public PedidoController(TartaroDbContext context)
    {
        _context = context;
    }

    // 🔹 Criar pedido
    [HttpPost]
    public async Task<IActionResult> CriarPedido(Pedido pedido)
    {
        pedido.DataPedido = DateTime.Now;

        decimal total = pedido.Itens.Sum(item =>
        {
            var produto = _context.Produtos.Find(item.ProdutoId);
            return produto != null ? produto.Preco * item.Quantidade : 0;
        });

        pedido.Pagamento = new Pagamento
        {
            ValorTotal = total,
            FormaPagamento = pedido.Pagamento?.FormaPagamento ?? "Pix",
            Pago = false
        };

        _context.Pedidos.Add(pedido);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPedido), new { id = pedido.Id }, pedido);
    }

    // 🔹 Listar todos os pedidos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pedido>>> ListarPedidos()
    {
        return await _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Itens).ThenInclude(i => i.Produto)
            .Include(p => p.Pagamento)
            .ToListAsync();
    }

    // 🔹 Obter pedido por ID
    [HttpGet("{id}")]
    public async Task<ActionResult<Pedido>> ObterPedido(int id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Itens).ThenInclude(i => i.Produto)
            .Include(p => p.Pagamento)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pedido == null) return NotFound();

        return pedido;
    }

    // 🔹 Confirmar pagamento do pedido
    [HttpPut("{id}/confirmar-pagamento")]
    public async Task<IActionResult> ConfirmarPagamento(int id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.Pagamento)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pedido == null || pedido.Pagamento == null)
            return NotFound("Pedido ou pagamento não encontrado.");

        pedido.Pagamento.Pago = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}