using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using System.Threading.RateLimiting;
using TartaroAPI.Data;
using TartaroAPI.Middleware;
using TartaroAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// ==================== CONFIGURAÇÃO DE LOGGING AVANÇADO ====================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/tartaro-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        fileSizeLimitBytes: 10_000_000,
        rollOnFileSizeLimit: true,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/errors/tartaro-error-.txt",
        restrictedToMinimumLevel: Serilog.Events.LogEventLevel.Error,
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 90)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "TartaroAPI")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .CreateLogger();

builder.Host.UseSerilog();

// ==================== CONFIGURAÇÃO DE CORS AVANÇADA ====================
var corsPolicy = "TartaroCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicy, policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy
                .WithOrigins(
                    "https://tartarodelivery.com.br",
                    "https://www.tartarodelivery.com.br")
                .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
                .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .AllowCredentials()
                .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
        }
    });
});

// ==================== RATE LIMITING AVANÇADO ====================
builder.Services.AddRateLimiter(options =>
{
    // Rate limit geral
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 10
            }));

    // Rate limit específico para autenticação
    options.AddPolicy("AuthPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 2
            }));

    // Rate limit para uploads
    options.AddPolicy("UploadPolicy", httpContext =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 10,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 3,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                TokensPerPeriod = 2,
                AutoReplenishment = true
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync(
            "Muitas requisições. Tente novamente em alguns instantes.", 
            cancellationToken: token);
    };
});

// ==================== CONFIGURAÇÃO DE BANCO DE DADOS ====================
builder.Services.AddDbContext<TartaroDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("TartaroDb");
    
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
        
        sqlOptions.CommandTimeout(30);
    });

    // Configurações para desenvolvimento
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// ==================== CONFIGURAÇÃO DE CACHE E PERFORMANCE ====================
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 100; // Limite de 100 entradas
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

// ==================== CONFIGURAÇÃO DE AUTENTICAÇÃO E AUTORIZAÇÃO ====================
var jwtKey = builder.Configuration["Jwt:Key"] ?? 
    throw new InvalidOperationException("JWT Key não configurada.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(5), // Tolerância de 5 minutos
            RequireExpirationTime = true,
            RequireSignedTokens = true
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Warning("Falha na autenticação JWT: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Log.Information("Token JWT validado para usuário: {UserId}", 
                    context.Principal?.FindFirst("sub")?.Value);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("ADM"));
    
    options.AddPolicy("ClienteOrAdmin", policy => 
        policy.RequireRole("CLIENTE", "ADM"));
});

// ==================== CONFIGURAÇÃO DE SERVIÇOS ====================
builder.Services.AddControllers(options =>
{
    options.ModelValidatorProviders.Clear(); // Remove validação automática para controle manual
})
.ConfigureApiBehaviorOptions(options =>
{
    options.SuppressModelStateInvalidFilter = true; // Permite validação customizada
});

// Serviços customizados
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IFileStorageService, LocalStorageService>();
builder.Services.AddAdvancedLogging(); // Extension method do sistema de logs
builder.Services.AddHttpContextAccessor();

// Background services
builder.Services.AddHostedService<LogCleanupService>();

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContext<TartaroDbContext>()
    .AddCheck<EmailService>("email_service")
    .AddCheck<IFileStorageService>("file_storage");

// ==================== CONFIGURAÇÃO DO SWAGGER AVANÇADA ====================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Tártaro Delivery API",
        Version = "v2.0",
        Description = "API profissional para sistema de delivery com recursos avançados",
        Contact = new OpenApiContact
        {
            Name = "Equipe Tártaro",
            Email = "dev@tartarodelivery.com.br"
        }
    });

    // Configuração de autenticação no Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT no formato: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Incluir comentários XML se disponível
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    options.EnableAnnotations();
});

// ==================== BUILD DA APLICAÇÃO ====================
var app = builder.Build();

// ==================== PIPELINE DE MIDDLEWARES ====================

// Logging de requisições
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.GetLevel = (httpContext, elapsed, ex) => ex != null 
        ? Serilog.Events.LogEventLevel.Error 
        : elapsed > 10000 
            ? Serilog.Events.LogEventLevel.Warning 
            : Serilog.Events.LogEventLevel.Information;
});

// Middleware de segurança (deve vir antes de outros middlewares)
app.UseSecurityMiddleware();

// Response compression
app.UseResponseCompression();

// Swagger (apenas em desenvolvimento ou com flag específica)
if (app.Environment.IsDevelopment() || 
    builder.Configuration.GetValue<bool>("EnableSwaggerInProduction"))
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tártaro API v2.0");
        options.RoutePrefix = "docs"; // Acesso via /docs
        options.DisplayRequestDuration();
        options.EnableDeepLinking();
        options.EnableFilter();
        options.ShowExtensions();
        options.DocumentTitle = "Tártaro Delivery API - Documentação";
    });
}

// Health checks
app.UseHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(x => new
            {
                name = x.Key,
                status = x.Value.Status.ToString(),
                duration = x.Value.Duration.TotalMilliseconds,
                description = x.Value.Description,
                data = x.Value.Data
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    }
});

// Rate limiting
app.UseRateLimiter();

// Headers de segurança
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", 
            "max-age=31536000; includeSubDomains; preload");
    }
    
    await next();
});

// HTTPS redirection (apenas em produção)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Arquivos estáticos
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Cache de 1 ano para recursos estáticos
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000");
        
        // Headers de segurança para arquivos
        ctx.Context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    }
});

// Roteamento
app.UseRouting();

// CORS
app.UseCors(corsPolicy);

// Autenticação e Autorização
app.UseAuthentication();
app.UseAuthorization();

// Logging avançado
app.UseAdvancedLogging();

// Controllers
app.MapControllers().RequireRateLimiting("AuthPolicy");

// Fallback para SPA
app.MapFallbackToFile("index.html").AllowAnonymous();

// ==================== INICIALIZAÇÃO E VERIFICAÇÕES ====================

// Verificar e criar banco de dados se necessário
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();
    
    try
    {
        // Verificar conexão
        await context.Database.CanConnectAsync();
        Log.Information("Conexão com banco de dados estabelecida com sucesso");
        
        // Aplicar migrações pendentes em produção
        if (!app.Environment.IsDevelopment())
        {
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                Log.Information("Aplicando {Count} migrações pendentes", pendingMigrations.Count());
                await context.Database.MigrateAsync();
                Log.Information("Migrações aplicadas com sucesso");
            }
        }
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Erro crítico ao conectar com o banco de dados");
        throw;
    }
}

// Logging de inicialização
app.Lifetime.ApplicationStarted.Register(() =>
{
    Log.Information("🚀 Tártaro Delivery API iniciada com sucesso");
    Log.Information("Ambiente: {Environment}", app.Environment.EnvironmentName);
    Log.Information("URLs: {Urls}", string.Join(", ", app.Urls));
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    Log.Information("🛑 Tártaro Delivery API está sendo finalizada");
});

// ==================== EXECUÇÃO DA APLICAÇÃO ====================
try
{
    Log.Information("Iniciando Tártaro Delivery API...");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Aplicação encerrada inesperadamente");
}
finally
{
    Log.CloseAndFlush();
}