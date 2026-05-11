using Blinkit.Application.Auth.DTOs;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Auth.Commands;

public class LoginCommandHandler(
    UserManager<AppUser> userManager,
    IJwtTokenService jwtTokenService) : IRequestHandler<LoginCommand, AuthCommandResult>
{
    public async Task<AuthCommandResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new ApplicationException("Invalid credentials");

        var valid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            throw new ApplicationException("Invalid credentials");

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var refreshToken = jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await userManager.UpdateAsync(user);

        var auth = new AuthResponse(accessToken, 15 * 60, new AuthUserDto(user.Id, user.Email!, user.FullName, roles.FirstOrDefault() ?? "User"));
        return new AuthCommandResult(auth, refreshToken);
    }
}
