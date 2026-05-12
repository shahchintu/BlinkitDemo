using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Blinkit.Application.Account.Commands;

public record AccountUpdateCommand(string UserId, string FullName, string? Phone) : IRequest;

public class AccountUpdateCommandHandler(UserManager<AppUser> userManager) : IRequestHandler<AccountUpdateCommand>
{
    public async Task Handle(AccountUpdateCommand request, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found");

        user.FullName = request.FullName;
        user.PhoneNumber = request.Phone;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));
    }
}
