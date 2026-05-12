using System.Security.Claims;
using Blinkit.Application.Account.Commands;
using Blinkit.Application.Account.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public sealed class AccountController(ISender sender) : ControllerBase
{
    private string UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await sender.Send(new GetProfileQuery(UserId));
        return Ok(profile);
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        await sender.Send(new AccountUpdateCommand(UserId, req.FullName, req.Phone));
        return Ok();
    }
}

public record UpdateProfileRequest(string FullName, string? Phone);
