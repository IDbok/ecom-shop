using System.ComponentModel.DataAnnotations;
using API.Entities;

namespace API.DTOs.Products;

public class ProductUpdateDto
{
    public long Id { get; set; }
    public string? Article { get; set; }
    public string? Name { get; set; }
    public double? PackagedWeight { get; set; }
    public double? PackagedVolume { get; set; }
    public Dimensions? Size { get; set; }

    [RegularExpression(@"^RAL\s?\d{4}$", ErrorMessage = "Значение цвета должно быть в формате 'RAL XXXX'.")]
    public string? DefaultColor { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
}
