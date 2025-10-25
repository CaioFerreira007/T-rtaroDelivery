using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TartaroAPI.Services;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADM")]
    public class SyncController : ControllerBase
    {
        private readonly IGoogleSheetsService _googleSheetsService;
        private readonly ILogger<SyncController> _logger;

        public SyncController(IGoogleSheetsService googleSheetsService, ILogger<SyncController> logger)
        {
            _googleSheetsService = googleSheetsService;
            _logger = logger;
        }

        [HttpPost("tudo")]
        public async Task<IActionResult> SincronizarTudo()
        {
            try
            {
                _logger.LogInformation(" Iniciando sincronização manual COMPLETA");

                await _googleSheetsService.SincronizarTudoAsync();

                return Ok(new { message = " Sincronização completa realizada com sucesso!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro na sincronização completa");
                return StatusCode(500, new { message = "Erro ao sincronizar", error = ex.Message });
            }
        }

        [HttpPost("clientes")]
        public async Task<IActionResult> SincronizarClientes()
        {
            try
            {
                await _googleSheetsService.SincronizarClientesAsync();
                return Ok(new { message = " Clientes sincronizados!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao sincronizar clientes");
                return StatusCode(500, new { message = "Erro ao sincronizar clientes" });
            }
        }

        [HttpPost("produtos")]
        public async Task<IActionResult> SincronizarProdutos()
        {
            try
            {
                await _googleSheetsService.SincronizarProdutosAsync();
                return Ok(new { message = " Produtos sincronizados!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao sincronizar produtos");
                return StatusCode(500, new { message = "Erro ao sincronizar produtos" });
            }
        }

        [HttpPost("pedidos")]
        public async Task<IActionResult> SincronizarPedidos()
        {
            try
            {
                await _googleSheetsService.SincronizarPedidosAsync();
                return Ok(new { message = " Pedidos sincronizados!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao sincronizar pedidos");
                return StatusCode(500, new { message = "Erro ao sincronizar pedidos" });
            }
        }

        [HttpPost("pagamentos")]
        public async Task<IActionResult> SincronizarPagamentos()
        {
            try
            {
                await _googleSheetsService.SincronizarPagamentosAsync();
                return Ok(new { message = " Pagamentos sincronizados!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao sincronizar pagamentos");
                return StatusCode(500, new { message = "Erro ao sincronizar pagamentos" });
            }
        }

        [HttpPost("estatisticas")]
        public async Task<IActionResult> AtualizarEstatisticas()
        {
            try
            {
                await _googleSheetsService.AtualizarEstatisticasAsync();
                return Ok(new { message = " Estatísticas atualizadas!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao atualizar estatísticas");
                return StatusCode(500, new { message = "Erro ao atualizar estatísticas" });
            }
        }
    }
}