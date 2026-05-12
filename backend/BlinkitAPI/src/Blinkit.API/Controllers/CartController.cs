using System.Security.Claims;
using Blinkit.Application.Cart.Commands;
using Blinkit.Application.Cart.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

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
}

public record AddItemRequest(Guid ProductId, Guid VariantId, int Quantity);
public record UpdateItemRequest(int Quantity);
