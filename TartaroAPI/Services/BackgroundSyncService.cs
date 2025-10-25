namespace TartaroAPI.Services
{
    public class BackgroundSyncService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackgroundSyncService> _logger;
        private readonly TimeSpan _intervalo = TimeSpan.FromMinutes(30);

            public BackgroundSyncService(IServiceProvider serviceProvider, ILogger<BackgroundSyncService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(" Serviço de sincronização automática iniciado");

            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation(" Executando sincronização automática...");

                    using var scope = _serviceProvider.CreateScope();
                    var googleSheetsService = scope.ServiceProvider.GetRequiredService<IGoogleSheetsService>();

                    await googleSheetsService.SincronizarTudoAsync();

                    _logger.LogInformation(" Sincronização automática concluída com sucesso");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, " Erro na sincronização automática");
                }

                _logger.LogInformation(" Próxima sincronização em {Minutos} minutos", _intervalo.TotalMinutes);
                await Task.Delay(_intervalo, stoppingToken);
            }

            _logger.LogInformation(" Serviço de sincronização automática encerrado");
        }
    }
}