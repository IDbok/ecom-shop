using System;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<AppUser> Users { get; set; }
    public DbSet<Member> Members { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Asset> Assets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Настройка связи Asset -> Product (многие к одному)
        modelBuilder.Entity<Asset>()
            .HasOne(a => a.Product)
            .WithMany(p => p.Assets)
            .HasForeignKey(a => a.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Настройка owned типа для размеров продукта
        modelBuilder.Entity<Product>(entity =>
        {
            entity.OwnsOne(p => p.Size, size =>
            {
                size.Property(s => s.WidthMm).HasColumnName("SizeWidthMm");
                size.Property(s => s.HeightMm).HasColumnName("SizeHeightMm"); 
                size.Property(s => s.DepthMm).HasColumnName("SizeDepthMm");
            });
        });

        // Настройка индексов для производительности
        modelBuilder.Entity<Asset>()
            .HasIndex(a => a.ProductId);
            
        modelBuilder.Entity<Asset>()
            .HasIndex(a => a.Type);
    }
}
