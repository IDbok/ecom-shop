using System;
using API.DTOs.Products;
using API.Entities;

namespace API.Interfaces;

public interface IProductRepository
{
    void Update(Product product);
    Task<IReadOnlyList<Product>> GetProductsAsync();
    Task<Helpers.Pagination<Product>> GetProductsAsync(ProductFilterDto filters);
    Task<Product?> GetProductByIdAsync(long id);
    Task<IReadOnlyList<Asset>> GetAssetsForProductAsync(long id);
    Task<IReadOnlyList<Asset>> GetPhotosForProductAsync(long id);
    Task<Product?> GetProductByAssetIdAsync(int id);
    Task<Product?> GetProductForUpdateAsync(long id);
    Task<bool> SaveAllAsync();
}
