using System.Collections.Concurrent;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace TartaroAPI.Middleware
{
    public class SecurityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityMiddleware> _logger;
        private readonly IMemoryCache _cache;
        private readonly SecurityOptions _options;

        // Cache para rate limiting por IP
        private static readonly ConcurrentDictionary<string, List<DateTime>> _requestCounts = new();
        
        // Cache para tentativas de login falhadas
        private static readonly ConcurrentDictionary<string, LoginAttempts> _loginAttempts = new();

        public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger, IMemoryCache cache, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _cache = cache;
            _options = configuration.GetSection("Security").Get<SecurityOptions>() ?? new SecurityOptions();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var clientIp = GetClientIpAddress(context);
            var path = context.Request.Path.ToString().ToLowerInvariant();
            var method = context.Request.Method;

            try
            {
                // 1. Rate Limiting Geral
                if (!await CheckRateLimit(clientIp, path))
                {
                    await ReturnErrorResponse(context, HttpStatusCode.TooManyRequests, 
                        "Muitas requisições. Tente novamente em alguns minutos.");
                    return;
                }

                // 2. Rate Limiting Específico para Auth
                if (IsAuthEndpoint(path) && !await CheckAuthRateLimit(clientIp))
                {
                    await ReturnErrorResponse(context, HttpStatusCode.TooManyRequests, 
                        "Muitas tentativas de autenticação. Aguarde antes de tentar novamente.");
                    return;
                }

                // 3. Validação de Headers de Segurança
                if (!ValidateSecurityHeaders(context))
                {
                    await ReturnErrorResponse(context, HttpStatusCode.BadRequest, 
                        "Headers de segurança inválidos.");
                    return;
                }

                // 4. Proteção contra ataques de força bruta no login
                if (path.Contains("/auth/login") && method == "POST")
                {
                    if (!await CheckLoginBruteForce(context, clientIp))
                    {
                        return; // Resposta já enviada
                    }
                }

                // 5. Log de requisições suspeitas
                LogSuspiciousActivity(context, clientIp);

                // Adicionar headers de segurança na resposta
                AddSecurityHeaders(context);

                await _next(context);

                // 6. Monitorar tentativas de login após a requisição
                if (path.Contains("/auth/login") && method == "POST")
                {
                    await MonitorLoginAttempt(context, clientIp);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no middleware de segurança para IP {ClientIp}", clientIp);
                await ReturnErrorResponse(context, HttpStatusCode.InternalServerError, 
                    "Erro interno do servidor.");
            }
        }

        private async Task<bool> CheckRateLimit(string clientIp, string path)
        {
            var key = $"rate_limit_{clientIp}";
            var now = DateTime.UtcNow;
            
            var requests = _requestCounts.GetOrAdd(key, _ => new List<DateTime>());
            
            lock (requests)
            {
                // Remove requisições antigas (fora da janela de tempo)
                requests.RemoveAll(r => now.Subtract(r).TotalMinutes > _options.RateLimitWindowMinutes);
                
                // Verifica se excedeu o limite
                if (requests.Count >= _options.MaxRequestsPerWindow)
                {
                    return false;
                }
                
                requests.Add(now);
            }

            return true;
        }

        private async Task<bool> CheckAuthRateLimit(string clientIp)
        {
            var key = $"auth_rate_limit_{clientIp}";
            var now = DateTime.UtcNow;
            
            if (_cache.TryGetValue(key, out List<DateTime> attempts))
            {
                attempts.RemoveAll(a => now.Subtract(a).TotalMinutes > _options.AuthRateLimitWindowMinutes);
                
                if (attempts.Count >= _options.MaxAuthRequestsPerWindow)
                {
                    _logger.LogWarning("Auth rate limit excedido para IP {ClientIp}", clientIp);
                    return false;
                }
                
                attempts.Add(now);
            }
            else
            {
                attempts = new List<DateTime> { now };
            }

            _cache.Set(key, attempts, TimeSpan.FromMinutes(_options.AuthRateLimitWindowMinutes));
            return true;
        }

        private async Task<bool> CheckLoginBruteForce(HttpContext context, string clientIp)
        {
            var loginData = await GetLoginDataFromRequest(context);
            if (loginData == null) return true;

            var key = $"login_attempts_{clientIp}_{loginData.Email}";
            var attempts = _loginAttempts.GetOrAdd(key, _ => new LoginAttempts());
            
            var now = DateTime.UtcNow;
            
            lock (attempts)
            {
                // Remove tentativas antigas
                attempts.Attempts.RemoveAll(a => now.Subtract(a).TotalMinutes > _options.LoginBruteForceWindowMinutes);
                
                // Verifica se está bloqueado
                if (attempts.Attempts.Count >= _options.MaxLoginAttempts)
                {
                    var timeRemaining = _options.LoginBruteForceWindowMinutes - 
                        now.Subtract(attempts.Attempts.First()).TotalMinutes;
                    
                    _logger.LogWarning("Login bloqueado por força bruta - IP: {ClientIp}, Email: {Email}", 
                        clientIp, loginData.Email);
                    
                    await ReturnErrorResponse(context, HttpStatusCode.TooManyRequests, 
                        $"Muitas tentativas de login falhadas. Tente novamente em {Math.Ceiling(timeRemaining)} minutos.");
                    
                    return false;
                }
            }

            return true;
        }

        private async Task MonitorLoginAttempt(HttpContext context, string clientIp)
        {
            var loginData = await GetLoginDataFromRequest(context);
            if (loginData == null) return;

            var isSuccess = context.Response.StatusCode == 200;
            var key = $"login_attempts_{clientIp}_{loginData.Email}";
            
            if (!isSuccess)
            {
                var attempts = _loginAttempts.GetOrAdd(key, _ => new LoginAttempts());
                lock (attempts)
                {
                    attempts.Attempts.Add(DateTime.UtcNow);
                }
                
                _logger.LogWarning("Tentativa de login falhada - IP: {ClientIp}, Email: {Email}", 
                    clientIp, loginData.Email);
            }
            else
            {
                // Limpar tentativas em caso de sucesso
                _loginAttempts.TryRemove(key, out _);
            }
        }

        private bool ValidateSecurityHeaders(HttpContext context)
        {
            // Validações básicas de headers
            var headers = context.Request.Headers;
            
            // Verificar User-Agent suspeito
            if (headers.TryGetValue("User-Agent", out var userAgent))
            {
                var ua = userAgent.ToString().ToLowerInvariant();
                var suspiciousPatterns = new[] { "bot", "crawler", "scanner", "hack", "sql" };
                
                if (suspiciousPatterns.Any(pattern => ua.Contains(pattern) && !ua.Contains("google")))
                {
                    _logger.LogWarning("User-Agent suspeito detectado: {UserAgent}", userAgent);
                    return false;
                }
            }

            return true;
        }

        private void LogSuspiciousActivity(HttpContext context, string clientIp)
        {
            var path = context.Request.Path.ToString().ToLowerInvariant();
            var suspiciousPaths = new[] { "/admin", "/.env", "/wp-admin", "/phpmyadmin", ".php", ".asp" };
            
            if (suspiciousPaths.Any(p => path.Contains(p)))
            {
                _logger.LogWarning("Atividade suspeita detectada - IP: {ClientIp}, Path: {Path}", 
                    clientIp, path);
            }
        }

        private void AddSecurityHeaders(HttpContext context)
        {
            var headers = context.Response.Headers;
            
            // Prevent clickjacking
            headers["X-Frame-Options"] = "DENY";
            
            // Prevent MIME type sniffing
            headers["X-Content-Type-Options"] = "nosniff";
            
            // XSS Protection
            headers["X-XSS-Protection"] = "1; mode=block";
            
            // Referrer Policy
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            
            // Content Security Policy (básica)
            headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
        }

        private string GetClientIpAddress(HttpContext context)
        {
            // Tentar obter o IP real (considerando proxies)
            var xForwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xForwardedFor))
            {
                return xForwardedFor.Split(',')[0].Trim();
            }

            var xRealIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xRealIp))
            {
                return xRealIp;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private bool IsAuthEndpoint(string path)
        {
            var authPaths = new[] { "/auth/login", "/auth/register", "/auth/refresh", "/auth/forgot-password" };
            return authPaths.Any(p => path.Contains(p));
        }

        private async Task<LoginData?> GetLoginDataFromRequest(HttpContext context)
        {
            try
            {
                context.Request.EnableBuffering();
                context.Request.Body.Position = 0;
                
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                var body = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
                
                if (string.IsNullOrEmpty(body)) return null;
                
                var loginData = JsonSerializer.Deserialize<LoginData>(body, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                return loginData;
            }
            catch
            {
                return null;
            }
        }

        private async Task ReturnErrorResponse(HttpContext context, HttpStatusCode statusCode, string message)
        {
            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json";
            
            var response = new { message, timestamp = DateTime.UtcNow };
            var json = JsonSerializer.Serialize(response);
            
            await context.Response.WriteAsync(json);
        }

        private class LoginAttempts
        {
            public List<DateTime> Attempts { get; set; } = new();
        }

        private class LoginData
        {
            public string Email { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        }
    }

    public class SecurityOptions
    {
        public int MaxRequestsPerWindow { get; set; } = 100;
        public int RateLimitWindowMinutes { get; set; } = 1;
        public int MaxAuthRequestsPerWindow { get; set; } = 10;
        public int AuthRateLimitWindowMinutes { get; set; } = 1;
        public int MaxLoginAttempts { get; set; } = 5;
        public int LoginBruteForceWindowMinutes { get; set; } = 15;
    }

    // Extension method para facilitar o registro
    public static class SecurityMiddlewareExtensions
    {
        public static IApplicationBuilder UseSecurityMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SecurityMiddleware>();
        }
    }
}