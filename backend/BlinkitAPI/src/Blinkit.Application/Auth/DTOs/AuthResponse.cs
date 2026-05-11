namespace Blinkit.Application.Auth.DTOs;

public record AuthResponse(string AccessToken, int ExpiresIn, AuthUserDto User);

public record AuthUserDto(string Id, string Email, string FullName, string Role);
