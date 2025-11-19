using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace API.Entities;

public class Member
{
    public string Id { get; set; } = null!;
    public DateOnly DateOfBirth { get; set; }
    public string? ImageUrl { get; set; }
    public required string DisplayName { get; set; }
    public string? Description { get; set; }
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public DateTime LastActive { get; set; } = DateTime.UtcNow;
    public required string Gender { get; set; }
    public required string City { get; set; }
    public required string Country { get; set; }

    [JsonIgnore]
    public List<Photo> Photos { get; set; } = [];
    
    [JsonIgnore]
    [ForeignKey("Id")]
    public AppUser AppUser { get; set; } = null!;
}
