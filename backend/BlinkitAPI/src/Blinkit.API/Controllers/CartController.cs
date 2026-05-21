using System.Security.Claims;
using Blinkit.Application.Cart.Commands;
using Blinkit.Application.Cart.Queries;
using Blinkit.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

/// <summary>
/// Cart CRUD operations. All endpoints require authentication.
/// Cart state is stored in Redis (7-day TTL) with SQL Server as fallback.
/// Each mutating endpoint returns the full updated cart so Angular
/// can replace its local state in a single round-trip.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class CartController(ISender sender) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var cart = await sender.Send(new GetCartQuery(UserId));
        return Ok(cart);
    }

    [HttpGet("count")]
    public async Task<IActionResult> GetCartCount()
    {
        var cart = await sender.Send(new GetCartQuery(UserId));
        return Ok(new { count = cart.ItemCount });
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddItemRequest req)
    {
        var cart = await sender.Send(new AddCartItemCommand(UserId, req.ProductId, req.VariantId, req.Quantity));
        return Ok(cart);
    }

    [HttpPut("items/{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemRequest req)
    {
        var cart = await sender.Send(new UpdateCartItemQuantityCommand(UserId, id, req.Quantity));
        return Ok(cart);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> RemoveItem(Guid id)
    {
        var cart = await sender.Send(new RemoveCartItemCommand(UserId, id));
        return Ok(cart);
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        await sender.Send(new ClearCartCommand(UserId));
        return NoContent();
    }

    [HttpPost("merge")]
    public async Task<IActionResult> MergeCart([FromBody] MergeCartRequest req)
    {
        var cart = await sender.Send(new MergeCartCommand(UserId, req.Items));
        return Ok(cart);
    }

    [AllowAnonymous]
    [HttpPost("share")]
    public async Task<IActionResult> ShareCart([FromBody] List<SharedCartItemDto> items, CancellationToken ct)
    {
        var result = await sender.Send(new ShareCartCommand(items), ct);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("share/{token}")]
    public async Task<IActionResult> GetSharedCart(string token, CancellationToken ct)
    {
        var items = await sender.Send(new GetSharedCartQuery(token), ct);
        if (items is null) return NotFound();
        return Ok(items);
    }
}

public record AddItemRequest(Guid ProductId, Guid VariantId, int Quantity);
public record UpdateItemRequest(int Quantity);
public record MergeCartRequest(IReadOnlyList<MergeItemRequest> Items);
