using System;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<AppUser> Users { get; set; }
    public DbSet<Member> Members { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Photo> Photos { get; set; }

    // protected override void OnModelCreating(ModelBuilder modelBuilder)
    // {
    //     modelBuilder.Entity<Product>(entity =>
    //     {
    //         entity.OwnsOne(p => p.Size, size =>
    //         {
    //             size.Property(s => s.WidthMm).HasColumnName("SizeWidthMm");
    //             size.Property(s => s.HeightMm).HasColumnName("SizeHeightMm"); 
    //             size.Property(s => s.DepthMm).HasColumnName("SizeDepthMm");
    //         });
    //     });
    // }
}
