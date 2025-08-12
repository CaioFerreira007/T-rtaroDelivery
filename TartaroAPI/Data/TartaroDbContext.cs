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
        public DbSet<ProdutoImage> ProductImages { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<Pagamento> Pagamentos { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        #endregion

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ===== PEDIDO: defaults e campos do checkout WhatsApp =====
            modelBuilder.Entity<Pedido>(e =>
            {
                e.Property(p => p.DataPedido)
                    .HasColumnType("timestamp")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                e.Property(p => p.Subtotal).HasColumnType("decimal(10,2)");
                e.Property(p => p.TaxaEntrega).HasColumnType("decimal(10,2)");
                e.Property(p => p.TotalFinal).HasColumnType("decimal(10,2)");

                e.Property(p => p.Codigo).HasMaxLength(12);
                e.HasIndex(p => p.Codigo).IsUnique();

                e.Property(p => p.NomeCliente).HasMaxLength(120).IsRequired();
                e.Property(p => p.Endereco).HasMaxLength(220).IsRequired();
                e.Property(p => p.Referencia).HasMaxLength(160);
                e.Property(p => p.Observacoes).HasMaxLength(300);

                // ClienteId opcional (checkout anônimo)
                e.Property(p => p.ClienteId)
                    .IsRequired(false);
            });

            // ===== RELACIONAMENTOS =====

            modelBuilder.Entity<ItemPedido>()
                .HasOne(i => i.Pedido)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ItemPedido>()
                .HasOne(i => i.Produto)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.ProdutoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Pagamento>()
                .HasOne(pg => pg.Pedido)
                .WithOne(p => p.Pagamento)
                .HasForeignKey<Pagamento>(pg => pg.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Produto>()
                .HasMany(p => p.Imagens)
                .WithOne(img => img.Produto)
                .HasForeignKey(img => img.ProdutoId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}