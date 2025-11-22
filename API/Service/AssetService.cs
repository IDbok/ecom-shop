using API.Entities;
using API.Helpers;
using API.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using AssetType = API.Entities.AssetType;

namespace API.Service;

public class AssetService : IAssetService
{
    private readonly Cloudinary _cloudinary;
    private readonly string[] _allowedImageTypes = { "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif" };
    private readonly string[] _allowedDocumentTypes = { 
        "application/pdf", 
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain" 
    };
    private readonly string[] _allowedVideoTypes = { "video/mp4", "video/mpeg", "video/quicktime", "video/webm" };

    public AssetService(IOptions<CloudinarySettings> cloudinaryConfig)
    {
        var account = new Account(
            cloudinaryConfig.Value.CloudName,
            cloudinaryConfig.Value.ApiKey,
            cloudinaryConfig.Value.ApiSecret
        );
        _cloudinary = new Cloudinary(account);
    }

    public async Task<AssetUploadResult> UploadImageAsync(IFormFile file, bool createThumbnail = true)
    {
        var result = new AssetUploadResult
        {
            Type = AssetType.Image,
            FileName = file.FileName
        };

        if (file.Length <= 0 || !IsValidImageType(file.ContentType))
        {
            return result;
        }

        try
        {
            await using var stream = file.OpenReadStream();
            
            // Загружаем основное изображение
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Transformation = new Transformation().Height(1200).Width(1200).Crop("limit").Quality("auto:good"),
                Folder = "ecomshop/images"
            };
            
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                result.Url = uploadResult.SecureUrl.ToString();
                result.PublicId = uploadResult.PublicId;
                result.Width = uploadResult.Width;
                result.Height = uploadResult.Height;
                result.FileSize = uploadResult.Bytes;

                // Создаем миниатюру, если требуется
                if (createThumbnail)
                {
                    stream.Seek(0, SeekOrigin.Begin);
                    var thumbnailParams = new ImageUploadParams
                    {
                        File = new FileDescription($"thumb_{file.FileName}", stream),
                        Transformation = new Transformation()
                            .Height(300)
                            .Width(300)
                            .Crop("fill")
                            .Gravity("auto")
                            .Quality("auto:good"),
                        Folder = "ecomshop/thumbnails"
                    };
                    
                    var thumbnailResult = await _cloudinary.UploadAsync(thumbnailParams);
                    
                    if (thumbnailResult.StatusCode == System.Net.HttpStatusCode.OK)
                    {
                        result.ThumbnailUrl = thumbnailResult.SecureUrl.ToString();
                        result.ThumbnailPublicId = thumbnailResult.PublicId;
                    }
                }
            }
        }
        catch (Exception)
        {
            // Логирование ошибки
            return result;
        }

        return result;
    }

    public async Task<AssetUploadResult> UploadDocumentAsync(IFormFile file)
    {
        var result = new AssetUploadResult
        {
            Type = AssetType.Document,
            FileName = file.FileName
        };

        if (file.Length <= 0 || !IsValidDocumentType(file.ContentType))
        {
            return result;
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "ecomshop/documents"
            };
            
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                result.Url = uploadResult.SecureUrl.ToString();
                result.PublicId = uploadResult.PublicId;
                result.FileSize = uploadResult.Bytes;
            }
        }
        catch (Exception)
        {
            // Логирование ошибки
            return result;
        }

        return result;
    }

    public async Task<AssetUploadResult> UploadVideoAsync(IFormFile file)
    {
        var result = new AssetUploadResult
        {
            Type = AssetType.Video,
            FileName = file.FileName
        };

        if (file.Length <= 0 || !IsValidVideoType(file.ContentType))
        {
            return result;
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var uploadParams = new VideoUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "ecomshop/videos"
            };
            
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                result.Url = uploadResult.SecureUrl.ToString();
                result.PublicId = uploadResult.PublicId;
                result.FileSize = uploadResult.Bytes;
                result.Width = uploadResult.Width;
                result.Height = uploadResult.Height;
            }
        }
        catch (Exception)
        {
            // Логирование ошибки
            return result;
        }

        return result;
    }

    public async Task<AssetUploadResult> UploadFileAsync(IFormFile file)
    {
        var assetType = GetAssetTypeFromFileName(file.FileName, file.ContentType);
        
        return assetType switch
        {
            AssetType.Image => await UploadImageAsync(file),
            AssetType.Document => await UploadDocumentAsync(file),
            AssetType.Video => await UploadVideoAsync(file),
            _ => await UploadGenericFileAsync(file)
        };
    }

    private async Task<AssetUploadResult> UploadGenericFileAsync(IFormFile file)
    {
        var result = new AssetUploadResult
        {
            Type = GetAssetTypeFromFileName(file.FileName, file.ContentType),
            FileName = file.FileName
        };

        if (file.Length <= 0)
        {
            return result;
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "ecomshop/files"
            };
            
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                result.Url = uploadResult.SecureUrl.ToString();
                result.PublicId = uploadResult.PublicId;
                result.FileSize = uploadResult.Bytes;
            }
        }
        catch (Exception)
        {
            // Логирование ошибки
            return result;
        }

        return result;
    }

    public async Task<DeletionResult> DeleteAssetAsync(string publicId)
    {
        var deletionParams = new DeletionParams(publicId);
        return await _cloudinary.DestroyAsync(deletionParams);
    }

    public async Task<DeletionResult> DeleteAssetWithThumbnailAsync(string publicId, string? thumbnailPublicId)
    {
        var mainDeletion = await DeleteAssetAsync(publicId);
        
        if (!string.IsNullOrEmpty(thumbnailPublicId))
        {
            await DeleteAssetAsync(thumbnailPublicId);
        }
        
        return mainDeletion;
    }

    public bool IsValidImageType(string contentType)
    {
        return _allowedImageTypes.Contains(contentType.ToLowerInvariant());
    }

    public bool IsValidDocumentType(string contentType)
    {
        return _allowedDocumentTypes.Contains(contentType.ToLowerInvariant());
    }

    public bool IsValidVideoType(string contentType)
    {
        return _allowedVideoTypes.Contains(contentType.ToLowerInvariant());
    }

    private AssetType GetAssetTypeFromFileName(string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        
        return extension switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" or ".bmp" => AssetType.Image,
            ".mp4" or ".avi" or ".mov" or ".wmv" or ".webm" => AssetType.Video,
            ".mp3" or ".wav" or ".ogg" or ".flac" => AssetType.Audio,
            ".pdf" or ".doc" or ".docx" or ".xls" or ".xlsx" or ".txt" => AssetType.Document,
            ".zip" or ".rar" or ".7z" => AssetType.Archive,
            _ when contentType.StartsWith("image/") => AssetType.Image,
            _ when contentType.StartsWith("video/") => AssetType.Video,
            _ when contentType.StartsWith("audio/") => AssetType.Audio,
            _ => AssetType.Other
        };
    }
}