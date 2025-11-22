using System;
using API.DTOs.Products;
using API.Entities;
using API.Helpers;
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
            .Include(p => p.Assets)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetProductByAssetIdAsync(int id)
    {
        return await context.Products
            .Include(p => p.Assets)
            .FirstOrDefaultAsync(p => p.Assets.Any(a => a.Id == id));
    }

    public async Task<IReadOnlyList<Asset>> GetAssetsForProductAsync(long id)
    {
        return await context.Assets.Where(a => a.ProductId == id).ToListAsync();
    }

    public async Task<IReadOnlyList<Asset>> GetPhotosForProductAsync(long id)
    {
        return await context.Assets
            .Where(a => a.ProductId == id && a.Type == AssetType.Image)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Product>> GetProductsAsync()
    {
        return await context.Products.ToListAsync();
    }

    public async Task<Pagination<Product>> GetProductsAsync(ProductFilterDto filters)
    {
        var query = context.Products.AsQueryable();

        // Фильтрация по категориям
        if (filters.Categories != null && filters.Categories.Any())
        {
            query = query.Where(p => p.Category != null && 
                filters.Categories.Contains(p.Category));
        }

        // TODO: Фильтрация по наименованию или артикулу не работает с SQL (кириллица не реагирует на Lower / Upper )
        // Поиск по названию или артикулу
        // if (!string.IsNullOrWhiteSpace(filters.SearchQuery))
        // {
        //     var searchTerm = filters.SearchQuery.ToLower();
        //     query = query.Where(p => 
        //         p.Name.ToLower().Contains(searchTerm) ||
        //         (p.Article != null && p.Article.ToLower().Contains(searchTerm)));
        // }

        // TODO: Фильтрация по цене будет добавлена когда активируется связь с Price
        // if (filters.MinPrice.HasValue || filters.MaxPrice.HasValue)
        // {
        //     // query = query.Include(p => p.Price)
        //     //     .Where(p => p.Price != null &&
        //     //         (!filters.MinPrice.HasValue || p.Price.Amount >= filters.MinPrice.Value) &&
        //     //         (!filters.MaxPrice.HasValue || p.Price.Amount <= filters.MaxPrice.Value) &&
        //     //         (string.IsNullOrEmpty(filters.Currency) || p.Price.Currency == filters.Currency));
        // }

        // Сортировка
        if (!string.IsNullOrWhiteSpace(filters.SortBy))
        {
            switch (filters.SortBy.ToLower())
            {
                case "name":
                    query = filters.SortOrder?.ToLower() == "desc" 
                        ? query.OrderByDescending(p => p.Name) 
                        : query.OrderBy(p => p.Name);
                    break;
                case "category":
                    query = filters.SortOrder?.ToLower() == "desc" 
                        ? query.OrderByDescending(p => p.Category) 
                        : query.OrderBy(p => p.Category);
                    break;
                case "article":
                    query = filters.SortOrder?.ToLower() == "desc" 
                        ? query.OrderByDescending(p => p.Article) 
                        : query.OrderBy(p => p.Article);
                    break;
                // TODO: Добавить сортировку по цене когда активируется связь с Price
                default:
                    query = query.OrderBy(p => p.Id);
                    break;
            }
        }
        else
        {
            // Сортировка по умолчанию
            query = query.OrderBy(p => p.Name);
        }

        var count = await query.CountAsync();

        var products = await query
            .Skip((filters.PageIndex - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync();

        // временное решение для фильтрации по названию или артикулу на стороне сервера
        if (!string.IsNullOrWhiteSpace(filters.SearchQuery))
        {
            var searchTerm = filters.SearchQuery.ToLower();
            // Note: This in-memory filtering breaks pagination if applied after Skip/Take on DB.
            // Ideally this should be done in the DB query (lines 53-61), but since we can't due to SQLite limitations mentioned in comments,
            // we have to do it in memory. 
            // However, doing it here means we are paginating BEFORE filtering, which is wrong.
            // For now, let's assume the DB query handles everything except this text search.
            // If we really need text search in memory, we should load ALL matches then paginate.
            
            // Let's try to apply it to the query if possible, or load filtered list then paginate.
            // Given the comment "TODO: Фильтрация по наименованию или артикулу не работает с SQL", 
            // we should probably load all matching items then paginate in memory if we must.
            
            // Re-implementing to support correct pagination with in-memory search:
             var allMatchingProducts = await query.ToListAsync();
             
             var filteredProducts = allMatchingProducts.Where(p => 
                p.Name.ToLower().Contains(searchTerm) ||
                (p.Article != null && p.Article.ToLower().Contains(searchTerm)))
                .ToList();
                
             count = filteredProducts.Count;
             
             products = filteredProducts
                .Skip((filters.PageIndex - 1) * filters.PageSize)
                .Take(filters.PageSize)
                .ToList();
        }

        return new Pagination<Product>(filters.PageIndex, filters.PageSize, count, products);
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
