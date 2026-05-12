using Blinkit.Application.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminUsersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetAllUsersQuery(page, pageSize, search), ct);
        return Ok(result);
    }

    [HttpGet("{id}/orders")]
    public async Task<IActionResult> GetUserOrders(string id, CancellationToken ct)
    {
        var orders = await sender.Send(new GetUserOrdersQuery(id), ct);
        return Ok(orders);
    }
}
