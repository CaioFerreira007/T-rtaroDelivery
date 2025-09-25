using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;

namespace TartaroAPI.Services
{
    public interface IAdvancedLoggingService
    {
        Task LogUserActionAsync(int? userId, string action, string details, string ipAddress = null);
        Task LogSystemEventAsync(string eventType, string message, object data = null);
        Task LogSecurityEventAsync(string eventType, string ipAddress, string details, int? userId = null);
        Task LogErrorAsync(Exception exception, string context, int? userId = null);
        Task LogPerformanceAsync(string operation, TimeSpan duration, object metadata = null);
        Task<List<LogEntry>> GetLogsAsync(LogFilter filter);
        Task CleanOldLogsAsync();
    }

    public class AdvancedLoggingService : IAdvancedLoggingService
    {
        private readonly TartaroDbContext _context;
        private readonly ILogger<AdvancedLoggingService> _logger;
        private readonly IConfiguration _configuration;

        public AdvancedLoggingService(TartaroDbContext context, ILogger<AdvancedLoggingService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task LogUserActionAsync(int? userId, string action, string details, string ipAddress = null)
        {
            try
            {
                var logEntry = new LogEntry
                {
                    LogType = LogType.UserAction,
                    UserId = userId,
                    Action = action,
                    Details = details,
                    IpAddress = ipAddress,
                    Timestamp = DateTime.UtcNow,
                    Level = LogLevel.Information
                };

                await SaveLogEntryAsync(logEntry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar ação do usuário: {Action}", action);
            }
        }

        public async Task LogSystemEventAsync(string eventType, string message, object data = null)
        {
            try
            {
                var logEntry = new LogEntry
                {
                    LogType = LogType.System,
                    Action = eventType,
                    Details = message,
                    Metadata = data != null ? JsonSerializer.Serialize(data) : null,
                    Timestamp = DateTime.UtcNow,
                    Level = LogLevel.Information
                };

                await SaveLogEntryAsync(logEntry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar evento do sistema: {EventType}", eventType);
            }
        }

        public async Task LogSecurityEventAsync(string eventType, string ipAddress, string details, int? userId = null)
        {
            try
            {
                var logEntry = new LogEntry
                {
                    LogType = LogType.Security,
                    UserId = userId,
                    Action = eventType,
                    Details = details,
                    IpAddress = ipAddress,
                    Timestamp = DateTime.UtcNow,
                    Level = LogLevel.Warning
                };

                await SaveLogEntryAsync(logEntry);

                // Para eventos de segurança críticos, também logar no console
                if (IsCriticalSecurityEvent(eventType))
                {
                    _logger.LogWarning("EVENTO DE SEGURANÇA CRÍTICO: {EventType} - IP: {IpAddress} - Detalhes: {Details}", 
                        eventType, ipAddress, details);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar evento de segurança: {EventType}", eventType);
            }
        }

        public async Task LogErrorAsync(Exception exception, string context, int? userId = null)
        {
            try
            {
                var logEntry = new LogEntry
                {
                    LogType = LogType.Error,
                    UserId = userId,
                    Action = "Exception",
                    Details = $"Context: {context}",
                    ErrorMessage = exception.Message,
                    StackTrace = exception.StackTrace,
                    Timestamp = DateTime.UtcNow,
                    Level = LogLevel.Error,
                    Metadata = JsonSerializer.Serialize(new
                    {
                        ExceptionType = exception.GetType().Name,
                        InnerException = exception.InnerException?.Message,
                        Source = exception.Source
                    })
                };

                await SaveLogEntryAsync(logEntry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar erro: {Context}", context);
            }
        }

        public async Task LogPerformanceAsync(string operation, TimeSpan duration, object metadata = null)
        {
            try
            {
                var logEntry = new LogEntry
                {
                    LogType = LogType.Performance,
                    Action = operation,
                    Details = $"Duration: {duration.TotalMilliseconds}ms",
                    Timestamp = DateTime.UtcNow,
                    Level = duration.TotalSeconds > 5 ? LogLevel.Warning : LogLevel.Information,
                    Metadata = metadata != null ? JsonSerializer.Serialize(metadata) : null
                };

                await SaveLogEntryAsync(logEntry);

                // Alertar para operações muito lentas
                if (duration.TotalSeconds > 10)
                {
                    _logger.LogWarning("Operação lenta detectada: {Operation} levou {Duration}ms", 
                        operation, duration.TotalMilliseconds);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar performance: {Operation}", operation);
            }
        }

        public async Task<List<LogEntry>> GetLogsAsync(LogFilter filter)
        {
            try
            {
                var query = _context.LogEntries.AsQueryable();

                if (filter.StartDate.HasValue)
                    query = query.Where(l => l.Timestamp >= filter.StartDate);

                if (filter.EndDate.HasValue)
                    query = query.Where(l => l.Timestamp <= filter.EndDate);

                if (filter.UserId.HasValue)
                    query = query.Where(l => l.UserId == filter.UserId);

                if (!string.IsNullOrEmpty(filter.LogType))
                    query = query.Where(l => l.LogType.ToString() == filter.LogType);

                if (!string.IsNullOrEmpty(filter.Level))
                    query = query.Where(l => l.Level.ToString() == filter.Level);

                if (!string.IsNullOrEmpty(filter.IpAddress))
                    query = query.Where(l => l.IpAddress == filter.IpAddress);

                if (!string.IsNullOrEmpty(filter.SearchTerm))
                {
                    query = query.Where(l => 
                        l.Action.Contains(filter.SearchTerm) ||
                        l.Details.Contains(filter.SearchTerm) ||
                        (l.ErrorMessage != null && l.ErrorMessage.Contains(filter.SearchTerm))
                    );
                }

                return await query
                    .OrderByDescending(l => l.Timestamp)
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar logs");
                return new List<LogEntry>();
            }
        }

        public async Task CleanOldLogsAsync()
        {
            try
            {
                var retentionDays = _configuration.GetValue<int>("Logging:RetentionDays", 90);
                var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);

                var oldLogs = await _context.LogEntries
                    .Where(l => l.Timestamp < cutoffDate)
                    .ToListAsync();

                if (oldLogs.Any())
                {
                    _context.LogEntries.RemoveRange(oldLogs);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Limpeza de logs concluída. {Count} entradas removidas", oldLogs.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro durante limpeza de logs");
            }
        }

        private async Task SaveLogEntryAsync(LogEntry logEntry)
        {
            _context.LogEntries.Add(logEntry);
            await _context.SaveChangesAsync();
        }

        private bool IsCriticalSecurityEvent(string eventType)
        {
            var criticalEvents = new[] 
            { 
                "BRUTE_FORCE_ATTEMPT", 
                "SQL_INJECTION_ATTEMPT", 
                "UNAUTHORIZED_ACCESS", 
                "SUSPICIOUS_ACTIVITY",
                "MULTIPLE_LOGIN_FAILURES"
            };

            return criticalEvents.Contains(eventType);
        }
    }

    // Modelos para logging
    public class LogEntry
    {
        public int Id { get; set; }
        public LogType LogType { get; set; }
        public LogLevel Level { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public string? StackTrace { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Metadata { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public enum LogType
    {
        UserAction,
        System,
        Security,
        Error,
        Performance,
        Business
    }

    public class LogFilter
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? UserId { get; set; }
        public string? LogType { get; set; }
        public string? Level { get; set; }
        public string? IpAddress { get; set; }
        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    // Middleware para logging automático
    public class LoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IAdvancedLoggingService _loggingService;
        private readonly ILogger<LoggingMiddleware> _logger;

        public LoggingMiddleware(RequestDelegate next, IAdvancedLoggingService loggingService, ILogger<LoggingMiddleware> logger)
        {
            _next = next;
            _loggingService = loggingService;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var originalBodyStream = context.Response.Body;
            
            try
            {
                using var responseBody = new MemoryStream();
                context.Response.Body = responseBody;
                
                await _next(context);
                
                stopwatch.Stop();
                
                // Log performance para requisições lentas
                if (stopwatch.ElapsedMilliseconds > 1000)
                {
                    await _loggingService.LogPerformanceAsync(
                        $"{context.Request.Method} {context.Request.Path}",
                        stopwatch.Elapsed,
                        new
                        {
                            StatusCode = context.Response.StatusCode,
                            ContentLength = responseBody.Length,
                            IpAddress = GetClientIpAddress(context)
                        }
                    );
                }
                
                // Log ações específicas
                await LogSpecificActions(context, stopwatch.Elapsed);
                
                responseBody.Seek(0, SeekOrigin.Begin);
                await responseBody.CopyToAsync(originalBodyStream);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _loggingService.LogErrorAsync(ex, 
                    $"{context.Request.Method} {context.Request.Path}",
                    GetUserIdFromContext(context)
                );
                
                throw;
            }
        }

        private async Task LogSpecificActions(HttpContext context, TimeSpan duration)
        {
            var path = context.Request.Path.ToString().ToLowerInvariant();
            var method = context.Request.Method;
            var statusCode = context.Response.StatusCode;
            var userId = GetUserIdFromContext(context);
            var ipAddress = GetClientIpAddress(context);

            // Log de login
            if (path.Contains("/auth/login") && method == "POST")
            {
                if (statusCode == 200)
                {
                    await _loggingService.LogUserActionAsync(userId, "LOGIN_SUCCESS", "Usuário fez login com sucesso", ipAddress);
                }
                else
                {
                    await _loggingService.LogSecurityEventAsync("LOGIN_FAILURE", ipAddress, $"Falha no login - Status: {statusCode}");
                }
            }
            
            // Log de cadastro
            else if (path.Contains("/auth/register") && method == "POST")
            {
                if (statusCode == 200)
                {
                    await _loggingService.LogUserActionAsync(userId, "REGISTER_SUCCESS", "Novo usuário registrado", ipAddress);
                }
                else
                {
                    await _loggingService.LogUserActionAsync(null, "REGISTER_FAILURE", $"Falha no cadastro - Status: {statusCode}", ipAddress);
                }
            }
            
            // Log de logout
            else if (path.Contains("/auth/logout") && method == "POST")
            {
                await _loggingService.LogUserActionAsync(userId, "LOGOUT", "Usuário fez logout", ipAddress);
            }
            
            // Log de criação de produtos
            else if (path.Contains("/produtos") && method == "POST" && statusCode == 201)
            {
                await _loggingService.LogUserActionAsync(userId, "PRODUCT_CREATED", "Novo produto criado", ipAddress);
            }
            
            // Log de pedidos
            else if (path.Contains("/pedido") && method == "POST" && statusCode == 201)
            {
                await _loggingService.LogUserActionAsync(userId, "ORDER_CREATED", "Novo pedido criado", ipAddress);
            }
        }

        private int? GetUserIdFromContext(HttpContext context)
        {
            var userIdClaim = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }

        private string GetClientIpAddress(HttpContext context)
        {
            var xForwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xForwardedFor))
            {
                return xForwardedFor.Split(',')[0].Trim();
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }

    // Extension methods
    public static class LoggingExtensions
    {
        public static IApplicationBuilder UseAdvancedLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<LoggingMiddleware>();
        }

        public static IServiceCollection AddAdvancedLogging(this IServiceCollection services)
        {
            services.AddScoped<IAdvancedLoggingService, AdvancedLoggingService>();
            return services;
        }
    }

    // Background service para limpeza automática de logs
    public class LogCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LogCleanupService> _logger;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24); // Executa a cada 24 horas

        public LogCleanupService(IServiceProvider serviceProvider, ILogger<LogCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var loggingService = scope.ServiceProvider.GetRequiredService<IAdvancedLoggingService>();
                    
                    await loggingService.CleanOldLogsAsync();
                    
                    _logger.LogInformation("Limpeza automática de logs executada às {Time}", DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro durante limpeza automática de logs");
                }

                await Task.Delay(_cleanupInterval, stoppingToken);
            }
        }
    }
}