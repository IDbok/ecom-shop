using System.Security.Cryptography;
using System.Text;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.SignalR;

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

        var productData = await File.ReadAllTextAsync("Data/ProductSeedData.json");
        var products = System.Text.Json.JsonSerializer.Deserialize<List<ProductSeedDto>>(productData, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (products == null || products.Count == 0) {
            logger.LogWarning("No products found in the seed data. Seeding aborted.");
            return;
        };

        foreach (var p in products)
        {
            var product = new Product
            {
                Id = p.Id,
                Article = p.Article,
                Name = p.Name ?? string.Empty,
                PackagedWeight = p.PackagedWeight,
                PackagedVolume = p.PackagedVolume,
                // Mapping: JSON Length -> DepthMm, Width -> WidthMm, Height -> HeightMm
                Size = new Dimensions(
                    Convert.ToDecimal(p.Size.Width),
                    Convert.ToDecimal(p.Size.Height),
                    Convert.ToDecimal(p.Size.Length)
                ),
                DefaultColor = p.DefaultColor,
                Category = p.Category,
                Description = p.Description,
                ImageUrl = p.ImageUrl
            };

            if (!string.IsNullOrWhiteSpace(p.ImageUrl))
            {
                product.Photos.Add(new Photo
                {
                    Url = p.ImageUrl,
                    ProductId = p.Id
                });
            }

            context.Products.Add(product);
        }

        await context.SaveChangesAsync();
        System.Console.WriteLine("Seeded products to the database");
    }

}
