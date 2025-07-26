using Microsoft.EntityFrameworkCore;
using TartaroAPI.Models;

namespace TartaroAPI.Data
{
    public class TartaroDbContext : DbContext
    {
        public TartaroDbContext(DbContextOptions<TartaroDbContext> options)
            : base(options) { }

        #region Tabelas principais
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<Pagamento> Pagamentos { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        #endregion

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Relacionamento: Pedido → Cliente (muitos para um)
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.Cliente)
                .WithMany(c => c.Pedidos)
                .HasForeignKey(p => p.ClienteId)
                .OnDelete(DeleteBehavior.Cascade); // remove pedidos quando cliente é removido

            // Relacionamento: ItemPedido → Pedido
            modelBuilder.Entity<ItemPedido>()
                .HasOne(i => i.Pedido)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.PedidoId)
                .OnDelete(DeleteBehavior.Cascade); // remove itens quando pedido é removido

            // Relacionamento: ItemPedido → Produto
            modelBuilder.Entity<ItemPedido>()
                .HasOne(i => i.Produto)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.ProdutoId)
                .OnDelete(DeleteBehavior.Restrict); // protege produtos de deleção acidental

            // Relacionamento: Pagamento → Pedido (um pra um)
            modelBuilder.Entity<Pagamento>()
                .HasOne(pg => pg.Pedido)
                .WithOne(p => p.Pagamento)
                .HasForeignKey<Pagamento>(pg => pg.PedidoId)
                .OnDelete(DeleteBehavior.Cascade); // remove pagamento junto com pedido
        }
    }
}