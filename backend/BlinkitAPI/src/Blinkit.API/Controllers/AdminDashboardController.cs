using Blinkit.Application.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminDashboardController(ISender sender) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var stats = await sender.Send(new GetDashboardStatsQuery(), ct);
        return Ok(stats);
    }
}
