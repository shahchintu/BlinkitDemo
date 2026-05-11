using Blinkit.Application.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/delivery")]
public class DeliveryController(IMediator mediator) : ControllerBase
{
    [HttpGet("slots")]
    public async Task<IActionResult> GetSlots(CancellationToken ct)
    {
        var result = await mediator.Send(new GetDeliverySlotsQuery(), ct);
        return Ok(result);
    }

    [HttpGet("check")]
    public IActionResult CheckServiceability([FromQuery] string pincode)
    {
        return Ok(new { serviceable = true, pincode, etaMinutes = 8 });
    }
}
