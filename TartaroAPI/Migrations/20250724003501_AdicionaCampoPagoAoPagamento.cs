using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TartaroAPI.Migrations
{
    public partial class AdicionaCampoPagoAoPagamento : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Pago",
                table: "Pagamentos",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Pago",
                table: "Pagamentos");
        }
    }
}