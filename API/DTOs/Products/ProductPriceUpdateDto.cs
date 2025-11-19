using API.Entities;

namespace API.DTOs.Products;

public record PriceUpdateDto
{
    public Guid? Id { get; init; }
    public PriceKind Kind { get; init; }

    public string Currency { get; init; } = "RUB";
    public long Amount { get; init; }
    public int MinQty { get; init; } = 1;

    public DateTimeOffset ValidFrom { get; init; }
    public DateTimeOffset? ValidTo { get; init; }
}
