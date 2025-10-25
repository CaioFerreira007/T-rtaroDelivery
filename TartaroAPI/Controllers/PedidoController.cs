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
        private readonly IGoogleSheetsService _googleSheetsService;
        private readonly ILogger<PedidoController> _logger;

        public PedidoController(
            TartaroDbContext context,
            IPedidoService pedidoService,
            IGoogleSheetsService googleSheetsService,
            ILogger<PedidoController> logger)
        {
            _context = context;
            _pedidoService = pedidoService;
            _googleSheetsService = googleSheetsService;
            _logger = logger;
        }

        // ===================================================================
        // POST: api/Pedido
        // Criar um novo pedido
        // ===================================================================
       [HttpPost]
public async Task<IActionResult> CriarPedido([FromBody] PedidoCreateDTO dto)
{
    if (!ModelState.IsValid)
    {
        _logger.LogWarning(" ModelState inválido ao criar pedido");
        return BadRequest(ModelState);
    }

    try
    {
        _logger.LogInformation(" Iniciando criação de pedido para cliente: {ClienteNome}", dto.NomeCliente);

        var pedido = await _pedidoService.CriarPedidoAsync(dto);

        _logger.LogInformation(" Pedido {Codigo} criado com sucesso! ID: {Id}, Total: R$ {Total}", 
            pedido.Codigo, pedido.Id, pedido.TotalFinal);

        //  SINCRONIZAR PEDIDOS E ESTATÍSTICAS NO GOOGLE SHEETS
        try
        {
            _logger.LogInformation(" Sincronizando pedido no Google Sheets...");

            await _googleSheetsService.SincronizarPedidosAsync();
            await _googleSheetsService.AtualizarEstatisticasAsync();
            
            _logger.LogInformation(" Pedido sincronizado no Google Sheets");
        }
        catch (Exception exSheets)
        {
            _logger.LogError(exSheets, "❌ Erro ao sincronizar pedido no Google Sheets (continuando)");
        }

        var resposta = new
        {
            id = pedido.Id,
            codigo = pedido.Codigo,
            status = pedido.Status,
            dataPedido = pedido.DataPedido,
            subtotal = pedido.Subtotal,
            totalFinal = pedido.TotalFinal
        };

        return CreatedAtAction(nameof(ObterPedido), new { id = pedido.Id }, resposta);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, " Erro crítico ao criar pedido");
        return BadRequest(new { 
            message = ex.Message,
            details = ex.InnerException?.Message
        });
    }
}

        // ===================================================================
        // GET: api/Pedido
        // Listar todos os pedidos (apenas ADM)
        // ===================================================================
        [HttpGet]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> ListarPedidos()
        {
            try
            {
                _logger.LogInformation(" Listando todos os pedidos (ADM)");

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

                _logger.LogInformation(" {Count} pedidos encontrados", pedidosDto.Count);

                return Ok(pedidosDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao listar pedidos");
                return StatusCode(500, new { message = "Erro ao listar pedidos" });
            }
        }

        // ===================================================================
        // GET: api/Pedido/{id}
        // Obter detalhes de um pedido específico
        // ===================================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPedido(int id)
        {
            try
            {
                _logger.LogInformation(" Buscando pedido {Id}...", id);

                var pedido = await _context.Pedidos
                    .Include(p => p.Itens)
                        .ThenInclude(i => i.Produto)
                    .Include(p => p.Pagamento)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (pedido == null)
                {
                    _logger.LogWarning(" Pedido {Id} não encontrado", id);
                    return NotFound(new { message = "Pedido não encontrado" });
                }

                _logger.LogInformation(" Pedido {Id} encontrado. ClienteId: {ClienteId}", id, pedido.ClienteId);

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userRole = User.FindFirstValue(ClaimTypes.Role);

                _logger.LogInformation(" UserId: {UserId}, Role: {Role}", userId, userRole);

                // Verificação de permissão
                if (userRole != "ADM" && pedido.ClienteId.HasValue && pedido.ClienteId.ToString() != userId)
                {
                    _logger.LogWarning(" Acesso negado para pedido {Id}", id);
                    return Forbid();
                }

                _logger.LogInformation(" Retornando pedido {Id} com {ItensCount} itens", id, pedido.Itens?.Count ?? 0);

                // Mapear para DTO
                var pedidoDto = new PedidoComItensDTO
                {
                    Id = pedido.Id,
                    Codigo = pedido.Codigo ?? string.Empty,
                    DataPedido = pedido.DataPedido,
                    Status = pedido.Status ?? string.Empty,
                    NomeCliente = pedido.NomeCliente ?? string.Empty,
                    Endereco = pedido.Endereco ?? string.Empty,
                    Referencia = pedido.Referencia,
                    Observacoes = pedido.Observacoes,
                    Subtotal = pedido.Subtotal,
                    TaxaEntrega = pedido.TaxaEntrega,
                    TotalFinal = pedido.TotalFinal,
                    Itens = pedido.Itens?.Select(i => new ItemPedidoComProdutoDTO
                    {
                        Id = i.Id,
                        ProdutoId = i.ProdutoId,
                        Quantidade = i.Quantidade,
                        Produto = i.Produto != null ? new ProdutoInfoDTO
                        {
                            Id = i.Produto.Id,
                            Nome = i.Produto.Nome ?? string.Empty,
                            Preco = i.Produto.Preco,
                            Categoria = i.Produto.Categoria
                        } : null
                    }).ToList() ?? new List<ItemPedidoComProdutoDTO>(),
                    Pagamento = pedido.Pagamento != null ? new PagamentoInfoDTO
                    {
                        Id = pedido.Pagamento.Id,
                        ValorTotal = pedido.Pagamento.ValorTotal,
                        FormaPagamento = pedido.Pagamento.FormaPagamento ?? string.Empty,
                        Pago = pedido.Pagamento.Pago
                    } : null
                };

                return Ok(pedidoDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " ERRO ao buscar pedido {Id}", id);

                return StatusCode(500, new
                {
                    message = "Erro interno ao buscar pedido",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // ===================================================================
        // GET: api/Pedido/meus
        // Obter pedidos do cliente logado
        // ===================================================================
        [HttpGet("meus")]
        public async Task<IActionResult> MeusPedidos()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var emailClaim = User.FindFirstValue(ClaimTypes.Email);

                _logger.LogInformation(" Buscando pedidos - UserId: {UserId}, Email: {Email}", userIdClaim, emailClaim);

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
                {
                    _logger.LogWarning("Cliente não encontrado para token");
                    return Unauthorized("Cliente não encontrado para este token.");
                }

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

                _logger.LogInformation(" {Count} pedidos encontrados para cliente {ClienteId}", pedidosDto.Count, cliente.Id);

                return Ok(pedidosDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao buscar pedidos do cliente");
                return StatusCode(500, new { message = "Erro ao buscar seus pedidos" });
            }
        }

        // ===================================================================
        // PUT: api/Pedido/{id}/confirmar-pagamento
        // Confirmar pagamento de um pedido
        // ===================================================================
        [HttpPut("{id}/confirmar-pagamento")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> ConfirmarPagamento(int id)
        {
            try
            {
                var pedido = await _context.Pedidos
                    .Include(p => p.Pagamento)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (pedido?.Pagamento == null)
                {
                    _logger.LogWarning(" Pedido {Id} ou pagamento não encontrado", id);
                    return NotFound("Pedido ou pagamento não encontrado.");
                }

                pedido.Pagamento.Pago = true;
                await _context.SaveChangesAsync();

                _logger.LogInformation(" Pagamento do pedido {Codigo} confirmado", pedido.Codigo);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao confirmar pagamento do pedido {Id}", id);
                return StatusCode(500, new { message = "Erro ao confirmar pagamento" });
            }
        }

        // ===================================================================
        // PUT: api/Pedido/{id}/status
        // Atualizar status de um pedido
        // ===================================================================
      [HttpPut("{id}/status")]
[Authorize(Roles = "ADM")]
public async Task<IActionResult> AtualizarStatus(int id, [FromBody] string novoStatus)
{
    try
    {
        var pedido = await _context.Pedidos.FirstOrDefaultAsync(p => p.Id == id);
        
        if (pedido == null)
        {
            _logger.LogWarning(" Pedido {Id} não encontrado", id);
            return NotFound("Pedido não encontrado.");
        }

        var statusAnterior = pedido.Status;
        pedido.Status = novoStatus;
        await _context.SaveChangesAsync();

        _logger.LogInformation(" Status do pedido {Codigo} alterado: '{StatusAnterior}' → '{NovoStatus}'", 
            pedido.Codigo, statusAnterior, novoStatus);

        //  SINCRONIZAR NO GOOGLE SHEETS
        try
        {
            _logger.LogInformation(" Sincronizando status no Google Sheets...");

            await _googleSheetsService.SincronizarPedidosAsync();
            await _googleSheetsService.AtualizarEstatisticasAsync();
            
            _logger.LogInformation(" Status sincronizado no Google Sheets");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, " Erro ao sincronizar status no Google Sheets");
        }

        return Ok(new { pedido.Id, pedido.Status });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, " Erro ao atualizar status do pedido {Id}", id);
        return StatusCode(500, new { message = "Erro ao atualizar status" });
    }
}
    }
}