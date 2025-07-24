using Microsoft.EntityFrameworkCore;
using TartaroAPI.Models;

namespace TartaroAPI.Data
{
    public class TartaroDbContext : DbContext
    {
        public TartaroDbContext(DbContextOptions<TartaroDbContext> options)
            : base(options) { }

        // Tabelas principais
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Produto> Produtos { get; set; }

        // 🔥 Novos registros
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<Pagamento> Pagamentos { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Relacionamento: Pedido → Cliente
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.Cliente)
                .WithMany(c => c.Pedidos)
                .HasForeignKey(p => p.ClienteId);

            // Relacionamento: ItemPedido → Pedido
            modelBuilder.Entity<ItemPedido>()
                .HasOne(i => i.Pedido)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.PedidoId);

            // Relacionamento: ItemPedido → Produto
            modelBuilder.Entity<ItemPedido>()
                .HasOne(i => i.Produto)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.ProdutoId);

            // Relacionamento: Pagamento → Pedido (um pra um)
            modelBuilder.Entity<Pagamento>()
                .HasOne(pg => pg.Pedido)
                .WithOne(p => p.Pagamento)
                .HasForeignKey<Pagamento>(pg => pg.PedidoId);
        }
    }
}