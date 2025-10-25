using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TartaroAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarConfiguracaoLoja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConfiguracoesLoja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LojaAberta = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    MensagemFechamento = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SegundaAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    SegundaFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    SegundaFechado = table.Column<bool>(type: "bit", nullable: false),
                    TercaAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    TercaFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    TercaFechado = table.Column<bool>(type: "bit", nullable: false),
                    QuartaAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    QuartaFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    QuartaFechado = table.Column<bool>(type: "bit", nullable: false),
                    QuintaAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    QuintaFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    QuintaFechado = table.Column<bool>(type: "bit", nullable: false),
                    SextaAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    SextaFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    SextaFechado = table.Column<bool>(type: "bit", nullable: false),
                    SabadoAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    SabadoFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    SabadoFechado = table.Column<bool>(type: "bit", nullable: false),
                    DomingoAbertura = table.Column<TimeSpan>(type: "time", nullable: true),
                    DomingoFechamento = table.Column<TimeSpan>(type: "time", nullable: true),
                    DomingoFechado = table.Column<bool>(type: "bit", nullable: false),
                    UltimaAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracoesLoja", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ConfiguracoesLoja",
                columns: new[] { "Id", "DomingoAbertura", "DomingoFechado", "DomingoFechamento", "LojaAberta", "MensagemFechamento", "QuartaAbertura", "QuartaFechado", "QuartaFechamento", "QuintaAbertura", "QuintaFechado", "QuintaFechamento", "SabadoAbertura", "SabadoFechado", "SabadoFechamento", "SegundaAbertura", "SegundaFechado", "SegundaFechamento", "SextaAbertura", "SextaFechado", "SextaFechamento", "TercaAbertura", "TercaFechado", "TercaFechamento", "UltimaAtualizacao" },
                values: new object[] { 1, new TimeSpan(0, 19, 0, 0, 0), false, new TimeSpan(0, 22, 0, 0, 0), true, "Estamos fechados no momento. Voltamos em breve!", new TimeSpan(0, 19, 0, 0, 0), false, new TimeSpan(0, 22, 0, 0, 0), new TimeSpan(0, 19, 0, 0, 0), false, new TimeSpan(0, 22, 0, 0, 0), new TimeSpan(0, 19, 0, 0, 0), false, new TimeSpan(0, 23, 0, 0, 0), null, true, null, new TimeSpan(0, 19, 0, 0, 0), false, new TimeSpan(0, 23, 0, 0, 0), null, true, null, new DateTime(2025, 10, 21, 23, 57, 34, 180, DateTimeKind.Utc).AddTicks(5094) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracoesLoja");
        }
    }
}
