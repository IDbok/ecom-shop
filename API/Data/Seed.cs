using System.Security.Cryptography;
using System.Text;
using API.DTOs.Seeds;
using API.Entities;

namespace API.Data;

public class Seed
{
    public static async Task SeedUsers(AppDbContext context)
    {
        if (context.Users.Any()) return;

        var memberData = await File.ReadAllTextAsync("Data/UserSeedData.json");
        var members = System.Text.Json.JsonSerializer.Deserialize<List<SeedUserDto>>(memberData);

        if (members == null) return;

        foreach (var member in members)
        {
            using var hmac = new HMACSHA512();
            var user = new AppUser
            {
                Id = member.Id,
                DisplayName = member.DisplayName,
                Email = member.Email.ToLower(),
                PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes("Pa$$w0rd")),
                PasswordSalt = hmac.Key,
                ImageUrl = member.ImageUrl,
                Member = new Member
                {
                    Id = member.Id,
                    DisplayName = member.DisplayName,
                    ImageUrl = member.ImageUrl,
                    Description = member.Description,
                    DateOfBirth = member.DateOfBirth,
                    Created = member.Created,
                    LastActive = member.LastActive,
                    Gender = member.Gender,
                    City = member.City,
                    Country = member.Country
                }
            };

            context.Users.Add(user);
        }

        await context.SaveChangesAsync();
        System.Console.WriteLine("Seeded users and members to the database");
    }

    public static async Task SeedProducts(AppDbContext context)
    {
        var logger = LoggerFactory.Create(builder => 
        {
            builder.AddConsole();
        }).CreateLogger("SeedProducts");

        logger.LogInformation("Starting product seeding process...");
        if (context.Products.Any()) {
            logger.LogInformation("Products already exist in the database. Seeding skipped.");
            return;
        };

        var productData = await File.ReadAllTextAsync("Data/parsed_products.json");
        var parsedProducts = System.Text.Json.JsonSerializer.Deserialize<List<ParsedProductSeedDto>>(productData, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (parsedProducts == null || parsedProducts.Count == 0) {
            logger.LogWarning("No products found in the seed data. Seeding aborted.");
            return;
        };

        long productId = 1; // Автогенерация ID, так как в parsed_products.json нет поля Id

        foreach (var parsedProduct in parsedProducts)
        {
            var product = new Product
            {
                Id = productId,
                Article = parsedProduct.Article,
                Name = parsedProduct.Name ?? string.Empty,
                PackagedWeight = parsedProduct.PackagedWeight,
                PackagedVolume = parsedProduct.PackagedVolume,
                // Mapping: JSON Width -> WidthMm, Height -> HeightMm, Depth -> DepthMm
                Size = new Dimensions(
                    Convert.ToDecimal(parsedProduct.Size.Width),
                    Convert.ToDecimal(parsedProduct.Size.Height),
                    Convert.ToDecimal(parsedProduct.Size.Depth)
                ),
                DefaultColor = parsedProduct.DefaultColor,
                Category = parsedProduct.Category,
                Description = parsedProduct.Description,
                ImageUrl = parsedProduct.ImageUrl,
                SourceUrl = parsedProduct.SourceUrl
            };

            // Обработка массива Assets
            foreach (var asset in parsedProduct.Assets)
            {
                if (string.IsNullOrWhiteSpace(asset.Url)) continue;

                product.Assets.Add(new Asset
                {
                    Url = asset.Url,
                    FileName = asset.FileName ??  $"seed_asset_{productId}_{Guid.NewGuid():N}",
                    FileSize = asset.FileSize,
                    Type = DetermineAssetTypeFromNumber(asset.Type) ?? DetermineAssetType(asset.Url),
                    ThumbnailUrl = asset.ThumbnailUrl,
                    Width = asset.Width,
                    Height = asset.Height,
                    ProductId = productId
                });
            }

            // check if product's ImageUrl asset is already in Assets, if not add it
            if (!string.IsNullOrWhiteSpace(product.ImageUrl) &&
                !product.Assets.Any(a => a.Url == product.ImageUrl))
            {
                product.Assets.Add(new Asset
                {
                    Url = product.ImageUrl,
                    FileName = GetFileNameFromUrl(product.ImageUrl) ?? $"seed_image_{productId}_{Guid.NewGuid():N}",
                    Type = DetermineAssetType(product.ImageUrl),
                    ProductId = productId
                });
            }

            context.Products.Add(product);
            productId++;
        }

        await context.SaveChangesAsync();
        logger.LogInformation($"Seeded {parsedProducts.Count} products to the database");
    }

    private static AssetType? DetermineAssetTypeFromNumber(int typeNumber)
    {
        return typeNumber switch
        {
            0 => AssetType.Image,
            1 => AssetType.Document,
            2 => AssetType.Video,
            3 => AssetType.Audio,
            4 => AssetType.Archive,
            5 => AssetType.Other,
            _ => null // Неизвестный тип, будет определен по URL
        };
    }

    private static AssetType DetermineAssetType(string url, string? typeHint = null)
    {
        if (!string.IsNullOrWhiteSpace(typeHint))
        {
            return typeHint.ToLower() switch
            {
                "image" => AssetType.Image,
                "document" => AssetType.Document,
                "video" => AssetType.Video,
                "audio" => AssetType.Audio,
                "archive" => AssetType.Archive,
                _ => AssetType.Other
            };
        }

        var extension = Path.GetExtension(url)?.ToLower();
        return extension switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".bmp" or ".webp" or ".svg" => AssetType.Image,
            ".pdf" or ".doc" or ".docx" or ".txt" or ".rtf" => AssetType.Document,
            ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" or ".webm" => AssetType.Video,
            ".mp3" or ".wav" or ".flac" or ".aac" or ".ogg" => AssetType.Audio,
            ".zip" or ".rar" or ".7z" or ".tar" or ".gz" => AssetType.Archive,
            _ => AssetType.Other
        };
    }

    private static string? GetFileNameFromUrl(string url)
    {
        try
        {
            var uri = new Uri(url);
            var fileName = Path.GetFileName(uri.LocalPath);
            return string.IsNullOrWhiteSpace(fileName) ? null : Uri.UnescapeDataString(fileName);
        }
        catch
        {
            return null;
        }
    }

}
