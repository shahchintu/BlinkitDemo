using Blinkit.Application.Auth.DTOs;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Auth.Commands;

public class RefreshTokenCommandHandler(
    UserManager<AppUser> userManager,
    IJwtTokenService jwtTokenService) : IRequestHandler<RefreshTokenCommand, AuthCommandResult>
{
    public async Task<AuthCommandResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var user = userManager.Users.SingleOrDefault(u => u.RefreshToken == request.RefreshToken)
            ?? throw new ApplicationException("Invalid refresh token");

        if (user.RefreshTokenExpiresAt <= DateTime.UtcNow)
            throw new ApplicationException("Invalid refresh token");

        var roles = await userManager.GetRolesAsync(user);
        var newAccessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await userManager.UpdateAsync(user);

        var auth = new AuthResponse(newAccessToken, 15 * 60, new AuthUserDto(user.Id, user.Email!, user.FullName, roles.FirstOrDefault() ?? "User"));
        return new AuthCommandResult(auth, newRefreshToken);
    }
}
