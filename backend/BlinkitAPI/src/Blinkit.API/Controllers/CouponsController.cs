using System.Security.Claims;
using Blinkit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CouponsController(ICouponRepository couponRepo) : ControllerBase
{
    [HttpGet("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] decimal subtotal)
    {
        var userId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? (Guid?)id : null;

        var result = await couponRepo.ValidateAsync(code, userId, 0, subtotal);
        return Ok(result);
    }
}
