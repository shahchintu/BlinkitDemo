namespace Blinkit.Application.Auth.DTOs;

public record ResetPasswordRequest(string Email, string NewPassword, string ConfirmPassword);
