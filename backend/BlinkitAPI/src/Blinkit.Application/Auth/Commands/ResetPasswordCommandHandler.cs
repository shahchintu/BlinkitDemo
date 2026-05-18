using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Auth.Commands;

public class ResetPasswordCommandHandler(
    UserManager<AppUser> userManager) : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException("Passwords do not match");

        if (request.NewPassword.Length < 8)
            throw new ArgumentException("Password must be at least 8 characters");

        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new KeyNotFoundException("No account found with this email address");

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!result.Succeeded)
            throw new ApplicationException(result.Errors.First().Description);
    }
}
