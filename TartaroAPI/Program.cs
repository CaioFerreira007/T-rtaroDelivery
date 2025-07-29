using TartaroAPI.Data;
using TartaroAPI.Models; // ← importa Cliente e UsuarioSeed
using TartaroAPI.Services;

using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.AddConsole();

#region 🔌 Conexão com MySQL via Pomelo
builder.Services.AddDbContext<TartaroDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("TartaroDb"),
        new MySqlServerVersion(new Version(8, 0, 34))
    ));
#endregion

#region 🔐 Configuração de autenticação JWT
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

#region 🌐 CORS para acesso externo
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

#region 📦 Serviços, Swagger, Controllers e JSON
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
        options.JsonSerializerOptions.WriteIndented = true;
    });
#endregion

var app = builder.Build();

#region 🧪 Seed segura de administrador (via admin.json)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TartaroDbContext>();

    string jsonPath = Path.Combine("Data", "admin.json"); // ajuste o caminho se necessário

    if (File.Exists(jsonPath))
    {
        var json = File.ReadAllText(jsonPath);
        var admins = JsonSerializer.Deserialize<List<UsuarioSeed>>(json);

        if (admins != null)
        {
            foreach (var admin in admins)
            {
                if (admin.Tipo?.ToLower() != "adm")
                {
                    Console.WriteLine($"⚠️ Tipo inválido para admin {admin.Email}. Esperado 'ADM', recebido '{admin.Tipo}'");
                    continue;
                }

                var existente = db.Clientes.FirstOrDefault(c => c.Email == admin.Email);
                if (existente == null)
                {
                    var novoAdm = new Cliente
                    {
                        Nome = admin.Nome,
                        Email = admin.Email,
                        SenhaHash = BCrypt.Net.BCrypt.HashPassword(admin.Senha),
                        Tipo = "ADM"
                    };

                    db.Clientes.Add(novoAdm);
                    Console.WriteLine($"✅ Usuário ADM {admin.Email} inserido.");
                }
                else
                {
                    Console.WriteLine($"ℹ️ ADM {admin.Email} já existe.");
                }
            }

            db.SaveChanges();
        }
        else
        {
            Console.WriteLine($"⚠️ Falha ao deserializar admin.json.");
        }
    }
    else
    {
        Console.WriteLine($"⚠️ Arquivo admin.json não encontrado em: {jsonPath}");
    }
}
#endregion

#region 🚀 Middlewares
app.UseCors("PermitirFrontEnd");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();
// app.UseHttpsRedirection(); ← opcional
#endregion

#region 🌤 Endpoint de teste (weatherforecast)
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

#region 🎯 Modelo usado no /weatherforecast
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
#endregion