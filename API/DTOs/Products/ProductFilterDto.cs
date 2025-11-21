namespace API.DTOs.Products;

public class ProductFilterDto
{
    /// <summary>
    /// Список категорий для фильтрации
    /// </summary>
    public List<string>? Categories { get; set; }
    
    /// <summary>
    /// Минимальная цена
    /// </summary>
    public long? MinPrice { get; set; }
    
    /// <summary>
    /// Максимальная цена
    /// </summary>
    public long? MaxPrice { get; set; }
    
    /// <summary>
    /// Поисковый запрос (по названию или артикулу)
    /// </summary>
    public string? SearchQuery { get; set; }
    
    /// <summary>
    /// Поле для сортировки
    /// </summary>
    public string? SortBy { get; set; }
    
    /// <summary>
    /// Направление сортировки (asc/desc)
    /// </summary>
    public string? SortOrder { get; set; } = "asc";
    
    /// <summary>
    /// Валюта для фильтрации по цене
    /// </summary>
    public string? Currency { get; set; } = "RUB";

    /// <summary>
    /// Номер страницы для пагинации (минимум 1)
    /// </summary>
    public int PageIndex { get; set; } = 1;

    /// <summary>
    /// Размер страницы для пагинации (от 1 до 100)
    /// </summary>
    public int PageSize { get; set; } = 10;
}