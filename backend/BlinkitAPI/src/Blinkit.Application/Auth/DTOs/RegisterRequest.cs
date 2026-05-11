namespace Blinkit.Application.Auth.DTOs;

public record RegisterRequest(string FullName, string Email, string Phone, string Password);
