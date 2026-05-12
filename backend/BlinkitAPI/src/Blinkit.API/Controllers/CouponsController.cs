using System.Security.Claims;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

public sealed record CouponDto(
    string Code,
    string DiscountType,
    decimal DiscountValue,
    decimal MinOrderAmount,
    decimal? MaxDiscountAmount,
    string ValidFor);

[ApiController]
[Route("api/[controller]")]
public sealed class CouponsController(ICouponRepository couponRepo) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var coupons = await couponRepo.GetAllActiveAsync();
        var dtos = coupons.Select(c => new CouponDto(
            c.Code,
            c.DiscountType.ToString(),
            c.DiscountValue,
            c.MinOrderAmount,
            c.MaxDiscountAmount,
            c.ValidFor.ToString()
        ));
        return Ok(dtos);
    }

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
