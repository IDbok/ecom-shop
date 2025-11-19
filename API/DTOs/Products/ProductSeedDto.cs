public class ProductSeedDto
{
    public long Id { get; set; }
    public string? Article { get; set; }
    public string? Name { get; set; }
    public double PackagedWeight { get; set; }
    public double PackagedVolume { get; set; }
    public SizeDto Size { get; set; } = new SizeDto();
    public string? DefaultColor { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

public class SizeDto
{
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}