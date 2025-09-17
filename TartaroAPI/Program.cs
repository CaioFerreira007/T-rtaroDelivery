using TartaroAPI.Data;
using TartaroAPI.Models;
using TartaroAPI.Services;

using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.AddConsole();

#region 🔗 Conexão com MySQL via Pomelo
builder.Services.AddDbContext<TartaroDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("TartaroDb"),
        new MySqlServerVersion(new Version(8, 0, 34))
    ));
#endregion

//EmailService
builder.Services.AddScoped<IEmailService, EmailService>();

#region  Configuração de autenticação JWT
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    Console.WriteLine("❌ Configurações de JWT ausentes ou inválidas.");
    throw new InvalidOperationException("JWT mal configurado. Verifique appsettings.json.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
#endregion

#region  CORS para acesso externo
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontEnd", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
#endregion

#region  Serviços, Swagger, Controllers e JSON
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IFileStorageService, LocalStorageService>();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Tartaro API",
        Version = "v1",
        Description = "Documentação da API Tartaro com autenticação JWT"
    });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Digite o token JWT no campo abaixo. Exemplo: Bearer {seu token}",

        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

builder.Services.AddControllers()
  .AddJsonOptions(opts =>
  {
      opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
      // mantém ReferenceHandler se precisar
  });
#endregion

var app = builder.Build();
#region  Seed segura de administrador (via admin.json)

#endregion
#region  Middlewares
app.UseCors("PermitirFrontEnd");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles(); // serve a pasta wwwroot automaticamente
app.MapControllers();
// app.UseHttpsRedirection(); ← opcional
#endregion

#region Endpoint de teste (weatherforecast)
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm",
    "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast(
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        )
    ).ToArray();

    return forecast;
}).WithName("GetWeatherForecast");
#endregion

app.Run();

#region  Modelo usado no /weatherforecast
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
#endregion
