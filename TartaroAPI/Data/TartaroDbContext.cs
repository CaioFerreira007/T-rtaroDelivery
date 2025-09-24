using Microsoft.EntityFrameworkCore;
using TartaroAPI.Models;

namespace TartaroAPI.Data
{
    public class TartaroDbContext : DbContext
    {
        public TartaroDbContext(DbContextOptions<TartaroDbContext> options)
            : base(options) { }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<ProdutoImage> ProductImages { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<Pagamento> Pagamentos { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Produto>().Property(p => p.Preco).HasPrecision(18, 2);
            modelBuilder.Entity<Pagamento>().Property(p => p.ValorTotal).HasPrecision(18, 2);
            modelBuilder.Entity<Pedido>().Property(p => p.Subtotal).HasColumnType("decimal(10,2)");
            modelBuilder.Entity<Pedido>().Property(p => p.TaxaEntrega).HasColumnType("decimal(10,2)");
            modelBuilder.Entity<Pedido>().Property(p => p.TotalFinal).HasColumnType("decimal(10,2)");

            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.Property(e => e.Tipo).IsRequired().HasMaxLength(20).HasDefaultValue("cliente");
                entity.HasIndex(e => e.Email).IsUnique();
            });
            
            modelBuilder.Entity<Pedido>(e =>
            {
                e.Property(p => p.DataPedido).HasColumnType("datetime2").HasDefaultValueSql("GETDATE()");
                e.HasIndex(p => p.Codigo).IsUnique();
                e.HasIndex(p => p.ClienteId);
            });

            modelBuilder.Entity<Produto>().HasIndex(p => p.Categoria);
            
            modelBuilder.Entity<RefreshToken>().HasIndex(e => e.Token).IsUnique();
            modelBuilder.Entity<PasswordResetToken>().HasIndex(e => e.Token).IsUnique();
            
            modelBuilder.Entity<ItemPedido>().HasOne(i => i.Pedido).WithMany(p => p.Itens).HasForeignKey(i => i.PedidoId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ItemPedido>().HasOne(i => i.Produto).WithMany(p => p.Itens).HasForeignKey(i => i.ProdutoId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Pagamento>().HasOne(pg => pg.Pedido).WithOne(p => p.Pagamento).HasForeignKey<Pagamento>(pg => pg.PedidoId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Produto>().HasMany(p => p.Imagens).WithOne(img => img.Produto).HasForeignKey(img => img.ProdutoId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}