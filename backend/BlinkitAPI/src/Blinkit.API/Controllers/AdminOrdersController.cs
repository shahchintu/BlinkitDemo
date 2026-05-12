using Blinkit.Application.Admin.Queries;
using Blinkit.Application.Orders.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminOrdersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetAllOrdersQuery(page, pageSize, status), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var orders = await sender.Send(new GetAllOrdersQuery(1, int.MaxValue, null), ct);
        var order = orders.Items.FirstOrDefault(o => o.Id == id);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateOrderStatusCommand(id, req.Status), ct);
        return Ok();
    }
}
