using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;

namespace TartaroAPI.Services
{
    public interface IGoogleSheetsService
    {
        Task SincronizarTudoAsync();
        Task SincronizarClientesAsync();
        Task SincronizarProdutosAsync();
        Task SincronizarPedidosAsync();
        Task SincronizarPagamentosAsync();
        Task AtualizarEstatisticasAsync();
    }

    public class GoogleSheetsService : IGoogleSheetsService
    {
        private readonly SheetsService _sheetsService;
        private readonly string _spreadsheetId;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GoogleSheetsService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public GoogleSheetsService(
            IConfiguration configuration, 
            ILogger<GoogleSheetsService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _scopeFactory = scopeFactory;
            _spreadsheetId = configuration["GoogleSheets:SpreadsheetId"]
                ?? throw new Exception("SpreadsheetId não configurado");

            _sheetsService = InitializeAsync().GetAwaiter().GetResult();
        }

        private async Task<SheetsService> InitializeAsync()
        {
            try
            {
                string credentialsPath = Path.Combine(AppContext.BaseDirectory, "google-credentials.json");

                if (!File.Exists(credentialsPath))
                    throw new FileNotFoundException($"Arquivo de credenciais não encontrado: {credentialsPath}");

                using var stream = new FileStream(credentialsPath, FileMode.Open, FileAccess.Read);
                
                var googleCredential = await GoogleCredential.FromStreamAsync(stream, CancellationToken.None);
                var credential = googleCredential.CreateScoped(SheetsService.Scope.Spreadsheets);

                _logger.LogInformation("✅ Google Sheets Service inicializado com sucesso");

                return new SheetsService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "Tartaro Delivery"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao inicializar Google Sheets Service");
                throw;
            }
        }

        public async Task SincronizarTudoAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Iniciando sincronização COMPLETA com Google Sheets...");

                await SincronizarClientesAsync();
                await SincronizarProdutosAsync();
                await SincronizarPedidosAsync();
                await SincronizarPagamentosAsync();
                await AtualizarEstatisticasAsync();

                _logger.LogInformation("✅ Sincronização COMPLETA finalizada com sucesso!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro na sincronização completa");
                throw;
            }
        }

        public async Task SincronizarClientesAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Sincronizando CLIENTES...");

                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();

                var clientes = await context.Clientes
                    .AsNoTracking()
                    .OrderBy(c => c.DataCriacao)
                    .ToListAsync();

                await LimparAba("Clientes!A2:F");

                var valores = new List<IList<object>>
                {
                    new List<object> { "ID", "Nome", "Email", "Telefone", "Endereço", "Data Cadastro" }
                };

                foreach (var cliente in clientes)
                {
                    valores.Add(new List<object>
                    {
                        cliente.Id,
                        cliente.Nome ?? "",
                        cliente.Email ?? "",
                        cliente.Telefone ?? "",
                        cliente.Endereco ?? "",
                        cliente.DataCriacao.ToString("dd/MM/yyyy HH:mm")
                    });
                }

                var range = "Clientes!A1:F";
                var valueRange = new ValueRange { Values = valores };
                var updateRequest = _sheetsService.Spreadsheets.Values.Update(valueRange, _spreadsheetId, range);
                updateRequest.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
                await updateRequest.ExecuteAsync();

                await FormatarAbaClientes();

                _logger.LogInformation("✅ {Count} clientes sincronizados", clientes.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar clientes");
                throw;
            }
        }

        public async Task SincronizarProdutosAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Sincronizando PRODUTOS...");

                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();

                var produtos = await context.Produtos
                    .AsNoTracking()
                    .OrderBy(p => p.Categoria)
                    .ThenBy(p => p.Nome)
                    .ToListAsync();

                await LimparAba("Produtos!A2:E");

                var valores = new List<IList<object>>
                {
                    new List<object> { "ID", "Nome", "Categoria", "Preço", "Descrição" }
                };

                foreach (var produto in produtos)
                {
                    valores.Add(new List<object>
                    {
                        produto.Id,
                        produto.Nome ?? "",
                        produto.Categoria ?? "",
                        produto.Preco,
                        produto.Descricao ?? ""
                    });
                }

                var range = "Produtos!A1:E";
                var valueRange = new ValueRange { Values = valores };
                var updateRequest = _sheetsService.Spreadsheets.Values.Update(valueRange, _spreadsheetId, range);
                updateRequest.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
                await updateRequest.ExecuteAsync();

                await FormatarAbaProdutos();

                _logger.LogInformation("✅ {Count} produtos sincronizados", produtos.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar produtos");
                throw;
            }
        }

        public async Task SincronizarPedidosAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Sincronizando PEDIDOS...");

                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();

                var pedidos = await context.Pedidos
                    .AsNoTracking()
                    .OrderByDescending(p => p.DataPedido)
                    .ToListAsync();

                // --- ALTERAÇÃO --- Limpando menos colunas (A-F)
                await LimparAba("Pedidos!A2:F");

                var valores = new List<IList<object>>
                {
                    // --- ALTERAÇÃO --- Cabeçalho atualizado
                    new List<object> { "ID", "Código", "Data", "Cliente", "Total", "Status" }
                };

                foreach (var pedido in pedidos)
                {
                    // --- ALTERAÇÃO --- Lista de valores atualizada
                    valores.Add(new List<object>
                    {
                        pedido.Id,
                        pedido.Codigo ?? "",
                        pedido.DataPedido.ToString("dd/MM/yyyy HH:mm"),
                        pedido.NomeCliente ?? "",
                        pedido.Subtotal, // Coluna "Total" agora usa o Subtotal
                        pedido.Status ?? ""
                    });
                }

                // --- ALTERAÇÃO --- Range de atualização (A-F)
                var range = "Pedidos!A1:F";
                var valueRange = new ValueRange { Values = valores };
                var updateRequest = _sheetsService.Spreadsheets.Values.Update(valueRange, _spreadsheetId, range);
                updateRequest.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
                await updateRequest.ExecuteAsync();

                await FormatarAbaPedidos();

                _logger.LogInformation("✅ {Count} pedidos sincronizados", pedidos.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar pedidos");
                throw;
            }
        }

        public async Task SincronizarPagamentosAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Sincronizando PAGAMENTOS...");

                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();

                var pagamentos = await context.Pagamentos
                    .Include(p => p.Pedido)
                    .AsNoTracking()
                    .OrderByDescending(p => p.Id)
                    .ToListAsync();

                // --- ALTERAÇÃO --- Limpando menos colunas (A-D)
                await LimparAba("Pagamentos!A2:D");

                var valores = new List<IList<object>>
                {
                    // --- ALTERAÇÃO --- Cabeçalho atualizado
                    new List<object> { "ID", "Pedido Código", "Valor Total", "Forma Pagamento" }
                };

                foreach (var pagamento in pagamentos)
                {
                    // --- ALTERAÇÃO --- Lista de valores atualizada (removido Pago e Data)
                    valores.Add(new List<object>
                    {
                        pagamento.Id,
                        pagamento.Pedido?.Codigo ?? "N/A",
                        pagamento.ValorTotal,
                        pagamento.FormaPagamento ?? ""
                    });
                }

                // --- ALTERAÇÃO --- Range de atualização (A-D)
                var range = "Pagamentos!A1:D";
                var valueRange = new ValueRange { Values = valores };
                var updateRequest = _sheetsService.Spreadsheets.Values.Update(valueRange, _spreadsheetId, range);
                updateRequest.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
                await updateRequest.ExecuteAsync();

                await FormatarAbaPagamentos();

                _logger.LogInformation("✅ {Count} pagamentos sincronizados", pagamentos.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar pagamentos");
                throw;
            }
        }

        public async Task AtualizarEstatisticasAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Atualizando ESTATÍSTICAS...");

                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();

                var hoje = DateTime.Now.Date;
                var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);

                var pedidos = await context.Pedidos.AsNoTracking().ToListAsync();
                var clientes = await context.Clientes.AsNoTracking().ToListAsync();
                var produtos = await context.Produtos.AsNoTracking().ToListAsync();

                var pedidosHoje = pedidos.Count(p => p.DataPedido.Date == hoje);
                var vendasHoje = pedidos.Where(p => p.DataPedido.Date == hoje).Sum(p => p.TotalFinal);

                var pedidosMes = pedidos.Count(p => p.DataPedido >= inicioMes);
                var vendasMes = pedidos.Where(p => p.DataPedido >= inicioMes).Sum(p => p.TotalFinal);

                var valores = new List<IList<object>>
                {
                    new List<object> { "Métrica", "Valor" },
                    new List<object> { "Total de Clientes", clientes.Count },
                    new List<object> { "Total de Produtos", produtos.Count },
                    new List<object> { "Pedidos Hoje", pedidosHoje },
                    new List<object> { "Vendas Hoje", vendasHoje?? 0 },
                    new List<object> { "Pedidos no Mês", pedidosMes },
                    new List<object> { "Vendas no Mês", vendasMes?? 0 },
                    new List<object> { "Total de Pedidos", pedidos.Count },
                    new List<object> { "Ticket Médio", pedidos.Any() ? pedidos.Average(p => p.TotalFinal?? 0) : 0 }
                };

                var range = "Estatisticas!A1:B9";
                var valueRange = new ValueRange { Values = valores };
                var updateRequest = _sheetsService.Spreadsheets.Values.Update(valueRange, _spreadsheetId, range);
                updateRequest.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
                await updateRequest.ExecuteAsync();

                await FormatarAbaEstatisticas();

                _logger.LogInformation("✅ Estatísticas atualizadas");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao atualizar estatísticas");
                throw;
            }
        }

        private async Task LimparAba(string range)
        {
            try
            {
                var clearRequest = _sheetsService.Spreadsheets.Values.Clear(
                    new ClearValuesRequest(), _spreadsheetId, range);
                await clearRequest.ExecuteAsync();
            }
            catch { }
        }

        private async Task FormatarAbaClientes()
        {
            try
            {
                var requests = new List<Request>
                {
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 0, StartRowIndex = 0, EndRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    BackgroundColor = new Color { Red = 0.2f, Green = 0.4f, Blue = 0.6f },
                                    TextFormat = new TextFormat { Bold = true, ForegroundColor = new Color { Red = 1f, Green = 1f, Blue = 1f }, FontSize = 11 },
                                    HorizontalAlignment = "CENTER"
                                }
                            },
                            Fields = "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                        }
                    }
                };

                await ExecutarFormatacao(requests);
            }
            catch { }
        }

        private async Task FormatarAbaProdutos()
        {
            try
            {
                var requests = new List<Request>
                {
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 1, StartRowIndex = 0, EndRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    BackgroundColor = new Color { Red = 0.3f, Green = 0.6f, Blue = 0.3f },
                                    TextFormat = new TextFormat { Bold = true, ForegroundColor = new Color { Red = 1f, Green = 1f, Blue = 1f }, FontSize = 11 },
                                    HorizontalAlignment = "CENTER"
                                }
                            },
                            Fields = "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                        }
                    },
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 1, StartColumnIndex = 3, EndColumnIndex = 4, StartRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    NumberFormat = new NumberFormat { Type = "CURRENCY", Pattern = "R$ #,##0.00" }
                                }
                            },
                            Fields = "userEnteredFormat.numberFormat"
                        }
                    }
                };

                await ExecutarFormatacao(requests);
            }
            catch { }
        }

        private async Task FormatarAbaPedidos()
        {
            try
            {
                var requests = new List<Request>
                {
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 2, StartRowIndex = 0, EndRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    BackgroundColor = new Color { Red = 0.2f, Green = 0.5f, Blue = 0.3f },
                                    TextFormat = new TextFormat { Bold = true, ForegroundColor = new Color { Red = 1f, Green = 1f, Blue = 1f }, FontSize = 11 },
                                    HorizontalAlignment = "CENTER"
                                }
                            },
                            Fields = "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                        }
                    },
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            // --- ALTERAÇÃO --- Range de formatação de moeda (agora só coluna E, índice 4)
                            Range = new GridRange { SheetId = 2, StartColumnIndex = 4, EndColumnIndex = 5, StartRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    NumberFormat = new NumberFormat { Type = "CURRENCY", Pattern = "R$ #,##0.00" }
                                }
                            },
                            Fields = "userEnteredFormat.numberFormat"
                        }
                    },
                    // --- ALTERAÇÃO --- Adiciona o filtro básico na aba
                    new Request
                    {
                        SetBasicFilter = new SetBasicFilterRequest
                        {
                            Filter = new BasicFilter
                            {
                                Range = new GridRange
                                {
                                    SheetId = 2, // ID da aba Pedidos
                                    StartRowIndex = 0, // Começa na linha do cabeçalho
                                    StartColumnIndex = 0,
                                    EndColumnIndex = 6 // Temos 6 colunas (A-F)
                                }
                            }
                        }
                    }
                };

                await ExecutarFormatacao(requests);
            }
            catch { }
        }

        private async Task FormatarAbaPagamentos()
        {
            try
            {
                var requests = new List<Request>
                {
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 3, StartRowIndex = 0, EndRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    BackgroundColor = new Color { Red = 0.6f, Green = 0.3f, Blue = 0.6f },
                                    TextFormat = new TextFormat { Bold = true, ForegroundColor = new Color { Red = 1f, Green = 1f, Blue = 1f }, FontSize = 11 },
                                    HorizontalAlignment = "CENTER"
                                }
                            },
                            Fields = "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                        }
                    },
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            // Este range continua correto (coluna C, índice 2)
                            Range = new GridRange { SheetId = 3, StartColumnIndex = 2, EndColumnIndex = 3, StartRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    NumberFormat = new NumberFormat { Type = "CURRENCY", Pattern = "R$ #,##0.00" }
                                }
                            },
                            Fields = "userEnteredFormat.numberFormat"
                        }
                    },
                    // --- ALTERAÇÃO --- Adiciona o filtro básico na aba
                    new Request
                    {
                        SetBasicFilter = new SetBasicFilterRequest
                        {
                            Filter = new BasicFilter
                            {
                                Range = new GridRange
                                {
                                    SheetId = 3, // ID da aba Pagamentos
                                    StartRowIndex = 0, // Começa na linha do cabeçalho
                                    StartColumnIndex = 0,
                                    EndColumnIndex = 4 // Temos 4 colunas (A-D)
                                }
                            }
                        }
                    }
                };

                await ExecutarFormatacao(requests);
            }
            catch { }
        }

        private async Task FormatarAbaEstatisticas()
        {
            try
            {
                var requests = new List<Request>
                {
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 4, StartRowIndex = 0, EndRowIndex = 1 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    BackgroundColor = new Color { Red = 0.9f, Green = 0.5f, Blue = 0.2f },
                                    TextFormat = new TextFormat { Bold = true, ForegroundColor = new Color { Red = 1f, Green = 1f, Blue = 1f }, FontSize = 12 },
                                    HorizontalAlignment = "CENTER"
                                }
                            },
                            Fields = "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                        }
                    },
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 4, StartRowIndex = 4, EndRowIndex = 5, StartColumnIndex = 1, EndColumnIndex = 2 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    NumberFormat = new NumberFormat { Type = "CURRENCY", Pattern = "R$ #,##0.00" }
                                }
                            },
                            Fields = "userEnteredFormat.numberFormat"
                        }
                    },
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 4, StartRowIndex = 6, EndRowIndex = 7, StartColumnIndex = 1, EndColumnIndex = 2 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    NumberFormat = new NumberFormat { Type = "CURRENCY", Pattern = "R$ #,##0.00" }
                                }
                            },
                            Fields = "userEnteredFormat.numberFormat"
                        }
                    },
                    new Request
                    {
                        RepeatCell = new RepeatCellRequest
                        {
                            Range = new GridRange { SheetId = 4, StartRowIndex = 8, EndRowIndex = 9, StartColumnIndex = 1, EndColumnIndex = 2 },
                            Cell = new CellData
                            {
                                UserEnteredFormat = new CellFormat
                                {
                                    NumberFormat = new NumberFormat { Type = "CURRENCY", Pattern = "R$ #,##0.00" }
                                }
                            },
                            Fields = "userEnteredFormat.numberFormat"
                        }
                    }
                };

                await ExecutarFormatacao(requests);
            }
            catch { }
        }

        private async Task ExecutarFormatacao(List<Request> requests)
        {
            var batchUpdateRequest = new BatchUpdateSpreadsheetRequest { Requests = requests };
            await _sheetsService.Spreadsheets.BatchUpdate(batchUpdateRequest, _spreadsheetId).ExecuteAsync();
        }
    }
}