namespace API.DTOs.Seeds;

public class ParsedProductSeedDto
{
    public string? Article { get; set; }
    public string? Name { get; set; }
    public double PackagedWeight { get; set; }
    public double PackagedVolume { get; set; }
    public ParsedSizeDto Size { get; set; } = new ParsedSizeDto();
    public string? SourceUrl { get; set; }
    public string? DefaultColor { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Price { get; set; }
    public List<ParsedAssetDto> Assets { get; set; } = new List<ParsedAssetDto>();
}
