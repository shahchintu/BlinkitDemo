using Blinkit.Application.Auth.DTOs;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Auth.Commands;

public class RegisterCommandHandler(
    UserManager<AppUser> userManager,
    IJwtTokenService jwtTokenService) : IRequestHandler<RegisterCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
            throw new ApplicationException("Email already in use");

        var user = new AppUser
        {
            FullName = request.FullName,
            Email = request.Email,
            UserName = request.Email,
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new ApplicationException(result.Errors.First().Description);

        await userManager.AddToRoleAsync(user, "User");

        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.GenerateAccessToken(user, roles);

        return new AuthResponse(token, 15 * 60, new AuthUserDto(user.Id, user.Email!, user.FullName, roles.FirstOrDefault() ?? "User"));
    }
}
