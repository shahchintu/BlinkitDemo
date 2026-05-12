using System.Security.Claims;
using Blinkit.Application.Orders.Commands;
using Blinkit.Application.Orders.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public sealed class OrdersController(ISender sender) : ControllerBase
{
    private string UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var orders = await sender.Send(new GetOrdersQuery(UserId));
        return Ok(orders);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        try
        {
            var order = await sender.Send(new GetOrderByIdQuery(id, UserId));
            return Ok(order);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/add-items")]
    public async Task<IActionResult> AddItems(Guid id, [FromBody] AddItemsRequest req)
    {
        var userId = Guid.Parse(UserId);
        try
        {
            var items = req.Items
                .Select(i => new Application.Orders.Commands.AddItemRequest(i.ProductId, i.VariantId, i.Qty))
                .ToList();
            await sender.Send(new AddItemsToOrderCommand(id, userId, items));
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req)
    {
        try
        {
            await sender.Send(new UpdateOrderStatusCommand(id, req.Status));
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record AddItemsRequest(List<AddItemsRequestItem> Items);
public record AddItemsRequestItem(Guid ProductId, Guid VariantId, int Qty);
public record UpdateStatusRequest(string Status);
