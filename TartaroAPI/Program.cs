using TartaroAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 🔌 Conexão com MySQL via EF Core
builder.Services.AddDbContext<TartaroDbContext>(options =>
    options.UseMySQL(
        builder.Configuration.GetConnectionString("TartaroDb")
        ?? throw new InvalidOperationException("Connection string 'TartaroDb' not found.")
    )
);

// 📦 Ativando Swagger e Controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.WriteIndented = true;
    });

var app = builder.Build();

// 🚀 Ativando Swagger na pipeline
app.UseSwagger();
app.UseSwaggerUI();

// 🔐 Redirecionamento HTTPS (se quiser ativar)
app.UseHttpsRedirection();

// 🌤 Endpoint de teste padrão
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
})
.WithName("GetWeatherForecast");

// ✅ Mapeando os Controllers corretamente
app.MapControllers();

app.Run();

// 🎯 Modelo para o endpoint de teste
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}