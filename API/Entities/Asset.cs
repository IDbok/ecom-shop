using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace API.Entities;

public enum AssetType
{
    Image = 0,
    Document = 1,
    Video = 2,
    Audio = 3,
    Archive = 4,
    Other = 5
}

public class Asset
{
    public int Id { get; set; }
    
    [Required]
    public required string Url { get; set; }
    
    public string? PublicId { get; set; }
    
    [Required]
    public required string FileName { get; set; }
    
    public long FileSize { get; set; }
    
    [Required]
    public AssetType Type { get; set; }
    
    // Для изображений - URL миниатюры
    public string? ThumbnailUrl { get; set; }
    
    // PublicId миниатюры в облачном хранилище
    public string? ThumbnailPublicId { get; set; }
    
    // Дополнительная информация для изображений
    public int? Width { get; set; }
    public int? Height { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Связь с продуктом
    public long ProductId { get; set; }
    
    [JsonIgnore]
    public Product Product { get; set; } = null!;

    // Методы для работы с типами файлов
    public bool IsImage => Type == AssetType.Image;
    public bool IsVideo => Type == AssetType.Video;
    public bool IsDocument => Type == AssetType.Document;
}
