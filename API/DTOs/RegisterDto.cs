using System.ComponentModel.DataAnnotations;

namespace API.DTOs;

public record RegisterDto
{
    [Required]
    public string DisplayName { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required]
    [StringLength(16, MinimumLength = 4)]
    public string Password { get; set; } = string.Empty;

}
