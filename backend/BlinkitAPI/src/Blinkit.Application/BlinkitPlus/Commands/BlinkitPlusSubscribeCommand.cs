using Blinkit.Application.BlinkitPlus.Queries;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.BlinkitPlus.Commands;

public record BlinkitPlusSubscribeCommand(string UserId) : IRequest<BlinkitPlusStatusDto>;

public class BlinkitPlusSubscribeCommandHandler(UserManager<AppUser> userManager)
    : IRequestHandler<BlinkitPlusSubscribeCommand, BlinkitPlusStatusDto>
{
    public async Task<BlinkitPlusStatusDto> Handle(BlinkitPlusSubscribeCommand request, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found");

        var expiresAt = DateTime.UtcNow.AddDays(30);
        user.HasBlinkitPlus = true;
        user.BlinkitPlusExpiresAt = expiresAt;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        return new BlinkitPlusStatusDto(true, expiresAt);
    }
}
