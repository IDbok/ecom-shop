using API.Entities;
using CloudinaryDotNet.Actions;
using AssetType = API.Entities.AssetType;

namespace API.Interfaces;

public class AssetUploadResult
{
    public string Url { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? ThumbnailPublicId { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public long FileSize { get; set; }
    public AssetType Type { get; set; }
    public string FileName { get; set; } = string.Empty;
    public bool IsSuccess => !string.IsNullOrEmpty(Url);
}

public interface IAssetService
{
    // Основные методы загрузки
    Task<AssetUploadResult> UploadImageAsync(IFormFile file, bool createThumbnail = true);
    Task<AssetUploadResult> UploadDocumentAsync(IFormFile file);
    Task<AssetUploadResult> UploadVideoAsync(IFormFile file);
    Task<AssetUploadResult> UploadFileAsync(IFormFile file);
    
    // Удаление файлов
    Task<DeletionResult> DeleteAssetAsync(string publicId);
    Task<DeletionResult> DeleteAssetWithThumbnailAsync(string publicId, string? thumbnailPublicId);
    
    // Вспомогательные методы
    bool IsValidImageType(string contentType);
    bool IsValidDocumentType(string contentType);
    bool IsValidVideoType(string contentType);
}