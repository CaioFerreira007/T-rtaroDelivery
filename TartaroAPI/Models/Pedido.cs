namespace TartaroAPI.Models
{
    public class Pedido
    {
        public int Id { get; set; }

        public string Tipo { get; set; } = "Padrão";

        public DateTime DataPedido { get; set; } = DateTime.Now;

        // 🔹 Agora opcional para permitir checkout anônimo via WhatsApp
        public int? ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();

        public Pagamento? Pagamento { get; set; }

        // 🔹 Status padrão antigo era "Recebido". Para o fluxo WhatsApp, usaremos "AGUARDANDO_CONFIRMACAO".
        public string Status { get; set; } = "Recebido";

        // ====== NOVOS CAMPOS PARA WHATSAPP CHECKOUT ======
        // Código curto amigável pra rastrear no WhatsApp (ex.: "AB12CD")
        public string Codigo { get; set; } = string.Empty;

        // Dados básicos do cliente informados no checkout
        public string NomeCliente { get; set; } = string.Empty;
        public string Endereco { get; set; } = string.Empty;
        public string? Referencia { get; set; }
        public string? Observacoes { get; set; }

        // Valores calculados no servidor
        public decimal Subtotal { get; set; }          // sem entrega
        public decimal? TaxaEntrega { get; set; }      // definido pelo atendente depois
        public decimal? TotalFinal { get; set; }       // Subtotal + TaxaEntrega
    }
}
