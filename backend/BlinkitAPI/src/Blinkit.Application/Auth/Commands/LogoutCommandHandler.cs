using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Auth.Commands;

public class LogoutCommandHandler(UserManager<AppUser> userManager) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId);
        if (user is null) return;

        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await userManager.UpdateAsync(user);
    }
}
