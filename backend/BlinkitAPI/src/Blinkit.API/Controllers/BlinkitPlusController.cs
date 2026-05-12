using System.Security.Claims;
using Blinkit.Application.BlinkitPlus.Commands;
using Blinkit.Application.BlinkitPlus.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/blinkit-plus")]
[Authorize]
public sealed class BlinkitPlusController(ISender sender) : ControllerBase
{
    private string UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var status = await sender.Send(new GetBlinkitPlusStatusQuery(UserId));
        return Ok(status);
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe()
    {
        var status = await sender.Send(new BlinkitPlusSubscribeCommand(UserId));
        return Ok(status);
    }
}
