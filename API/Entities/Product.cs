using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace API.Entities;

public class Product
{
    public long Id { get; set; }
    public string? Article { get; set; }
    public string Name { get; set; } = null!;
    public double PackagedWeight { get; set; } = 0;
    public double PackagedVolume { get; set; } = 0;
    public required Dimensions Size { get; set; }

    // public Price? Price { get; set; }

    [RegularExpression(@"^RAL\s?\d{4}$", ErrorMessage = "Значение цвета должно быть в формате 'RAL XXXX'.")]
    public string? DefaultColor { get; set; }

    public string? Category { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? SourceUrl { get; set; }
    
    [JsonIgnore]
    public List<Asset> Assets { get; set; } = [];
}

[Owned]
public class Dimensions
{
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public decimal DepthMm { get; set; }

    public Dimensions()
    {
        // Конструктор по умолчанию для EF Core
    }

    public Dimensions(decimal widthMm, decimal heightMm, decimal depthMm)
    {
        WidthMm = widthMm;
        HeightMm = heightMm;
        DepthMm = depthMm;
    }
}

public enum PriceKind
{
    COGS = 0, // себестоимость
    WHOLESALE = 1, // оптовая цена
    RETAIL = 2 // розничная цена
}

public class Price
{
    public Guid Id { get; set; }
    public PriceKind Kind { get; set; }

    public string Currency { get; set; } = "RUB";
    public long Amount { get; set; }
    public int MinQty { get; set; } = 1;

    public DateTimeOffset ValidFrom { get; set; }
    public DateTimeOffset? ValidTo { get; set; }

    public long ProductId { get; set; }
    [JsonIgnore]
    public Product? Product { get; set; }
}
