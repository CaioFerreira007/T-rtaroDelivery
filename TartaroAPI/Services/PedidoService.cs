using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTO;
using TartaroAPI.Models;
using TartaroAPI.Services;

namespace TartaroAPI.Services
{
    public class PedidoService : IPedidoService
    {
        private readonly TartaroDbContext _context;
        private readonly IGoogleSheetsService _googleSheetsService;

        public PedidoService(TartaroDbContext context, IGoogleSheetsService googleSheetsService)
        {
            _context = context;
            _googleSheetsService = googleSheetsService;
        }

        public async Task<Pedido> CriarPedidoAsync(PedidoCreateDTO dto)
        {
            // 1. Validar Produtos e Calcular Subtotal
            var ids = dto.Itens.Select(i => i.ProdutoId).ToList();
            var produtos = await _context.Produtos
                .Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            if (produtos.Count != ids.Distinct().Count())
            {
                throw new Exception("Um ou mais produtos são inválidos ou indisponíveis.");
            }

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

            // 2. Gerar Código Único para o Pedido
            string codigo;
            do
            {
                codigo = OrderCodeGenerator.NewCode();
            } while (await _context.Pedidos.AnyAsync(p => p.Codigo == codigo));

            // 3. Montar o Objeto Pedido
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

            // 4. Adicionar Pagamento se não for Rascunho
            if (!dto.IsRascunho)
            {
                if (string.IsNullOrWhiteSpace(dto.FormaPagamento))
                    throw new Exception("Forma de pagamento é obrigatória para pedidos tradicionais.");

                pedido.Pagamento = new Pagamento
                {
                    ValorTotal = subtotal,
                    FormaPagamento = dto.FormaPagamento,
                    Pago = false
                };
            }

            // 5. Salvar no Banco de Dados
            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            return pedido;
        }
    }
}