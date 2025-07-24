using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TartaroAPI.Migrations
{
    public partial class AjustaPagamento : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
      name: "FormaPagamento",
      table: "Pagamentos",
      type: "varchar(100)",
      unicode: false,
      nullable: false,
      defaultValue: "Pix");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FormaPagamento",
                table: "Pagamentos");
        }
    }
}