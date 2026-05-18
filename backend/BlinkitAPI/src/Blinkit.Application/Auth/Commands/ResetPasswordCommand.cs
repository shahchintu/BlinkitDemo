using MediatR;

namespace Blinkit.Application.Auth.Commands;

public record ResetPasswordCommand(
    string Email,
    string NewPassword,
    string ConfirmPassword) : IRequest;
