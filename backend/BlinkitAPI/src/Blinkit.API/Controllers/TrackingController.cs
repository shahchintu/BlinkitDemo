using System.Security.Claims;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Tracking.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/tracking")]
[Authorize]
public sealed class TrackingController(ISender sender, IBlinkitDbContext db) : ControllerBase
{
    private string UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();

    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> GetTracking(Guid orderId, CancellationToken ct)
    {
        try
        {
            var result = await sender.Send(new GetOrderTrackingQuery(orderId, UserId), ct);
            return Ok(result);
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

    [HttpPatch("{orderId:guid}/location")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdatePartnerLocation(
        Guid orderId,
        [FromBody] UpdatePartnerLocationRequest req,
        CancellationToken ct)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) return NotFound();

        order.DeliveryPartnerLat = req.Lat;
        order.DeliveryPartnerLng = req.Lng;
        await db.SaveChangesAsync(ct);

        try
        {
            var result = await sender.Send(new GetOrderTrackingQuery(orderId, order.UserId.ToString()), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}

public record UpdatePartnerLocationRequest(decimal Lat, decimal Lng);
