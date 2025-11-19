using System;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class ProductRepository(AppDbContext context) : IProductRepository
{
    public async Task<Product?> GetProductByIdAsync(long id)
    {
        return await context.Products.FindAsync(id);
    }

    public async Task<Product?> GetProductForUpdateAsync(long id)
    {
        return await context.Products
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetProductByPhotoIdAsync(int id)
    {
        return await context.Products
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(p => p.Photos.Any(ph => ph.Id == id));
    }

    public async Task<IReadOnlyList<Photo>> GetPhotosForProductAsync(long id)
    {
        return await context.Photos.Where(p => p.ProductId == id).ToListAsync();
    }

    public async Task<IReadOnlyList<Product>> GetProductsAsync()
    {
        return await context.Products.ToListAsync();
    }

    public async Task<bool> SaveAllAsync()
    {
        return await context.SaveChangesAsync() > 0;
    }

    public void Update(Product product)
    {
        context.Entry(product).State = EntityState.Modified;
    }

}
