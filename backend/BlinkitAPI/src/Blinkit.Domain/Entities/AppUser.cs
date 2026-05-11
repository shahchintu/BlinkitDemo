using Microsoft.AspNetCore.Identity;

namespace Blinkit.Domain.Entities;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public bool HasBlinkitPlus { get; set; }
    public DateTime? BlinkitPlusExpiresAt { get; set; }
}
