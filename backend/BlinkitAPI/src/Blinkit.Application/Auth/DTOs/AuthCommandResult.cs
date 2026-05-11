namespace Blinkit.Application.Auth.DTOs;

public record AuthCommandResult(AuthResponse Auth, string RefreshToken);
