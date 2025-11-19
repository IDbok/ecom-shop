using System;
using API.Entities;

namespace API.Interfaces;

public interface IProductRepository
{
    void Update(Product product);
    Task<IReadOnlyList<Product>> GetProductsAsync();
    Task<Product?> GetProductByIdAsync(long id);
    Task<IReadOnlyList<Photo>> GetPhotosForProductAsync(long id);
    Task<Product?> GetProductByPhotoIdAsync(int id);
    Task<Product?> GetProductForUpdateAsync(long id);
    Task<bool> SaveAllAsync();
}
