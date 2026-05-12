using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.BlinkitPlus.Queries;

public record BlinkitPlusStatusDto(bool IsActive, DateTime? ExpiresAt);

public record GetBlinkitPlusStatusQuery(string UserId) : IRequest<BlinkitPlusStatusDto>;

public class GetBlinkitPlusStatusQueryHandler(UserManager<AppUser> userManager)
    : IRequestHandler<GetBlinkitPlusStatusQuery, BlinkitPlusStatusDto>
{
    public async Task<BlinkitPlusStatusDto> Handle(GetBlinkitPlusStatusQuery request, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found");

        var isActive = user.HasBlinkitPlus && user.BlinkitPlusExpiresAt > DateTime.UtcNow;
        return new BlinkitPlusStatusDto(isActive, user.BlinkitPlusExpiresAt);
    }
}
