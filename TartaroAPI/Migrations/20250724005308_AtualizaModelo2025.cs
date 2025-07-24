using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TartaroAPI.Migrations
{
    /// <inheritdoc />
    public partial class AtualizaModelo2025 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Produtos",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Pedidos",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Pagamentos",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Clientes",
                type: "longtext",
                nullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Pagamentos");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Clientes");
        }
    }
}
