using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Account.Queries;

public record ProfileDto(string FullName, string Email, string? Phone, string Role, bool HasBlinkitPlus);

public record GetProfileQuery(string UserId) : IRequest<ProfileDto>;

public class GetProfileQueryHandler(UserManager<AppUser> userManager) : IRequestHandler<GetProfileQuery, ProfileDto>
{
    public async Task<ProfileDto> Handle(GetProfileQuery request, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found");

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.Contains("Admin") ? "Admin" : "User";

        return new ProfileDto(user.FullName, user.Email!, user.PhoneNumber, role, user.HasBlinkitPlus);
    }
}
