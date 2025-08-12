using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TartaroAPI.Models;

namespace TartaroAPI.Models
{
    public class Pagamento
    {
        public int Id { get; set; }

        public string Tipo { get; set; } = "Padrão";

        public decimal ValorTotal { get; set; }

        [Column(TypeName = "varchar(100)")]
        public string FormaPagamento { get; set; } = "Pix";

        public bool Pago { get; set; } = false;

        public int PedidoId { get; set; }

        // O EF vai cuidar da atribuição. Null! evita warning de inicialização obrigatória.
        public Pedido Pedido { get; set; } = null!;
    }
}