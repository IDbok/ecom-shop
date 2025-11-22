namespace API.DTOs.Seeds;

public class ParsedAssetDto
{
    public string? Url { get; set; }
    public string? Alt { get; set; }
    public int Type { get; set; } // Числовой тип из JSON
    public string? FileName { get; set; }
    public string? ThumbnailUrl { get; set; }
    public long FileSize { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
}
