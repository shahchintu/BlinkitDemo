using Blinkit.Application.Admin.Commands;
using Blinkit.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/admin/coupons")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminCouponsController(ISender sender, IBlinkitDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var coupons = await db.Coupons.AsNoTracking().OrderBy(c => c.Code).ToListAsync(ct);
        return Ok(coupons.Select(c => new
        {
            id = c.Id,
            code = c.Code,
            discountType = c.DiscountType.ToString(),
            discountValue = c.DiscountValue,
            minOrderAmount = c.MinOrderAmount,
            maxDiscountAmount = c.MaxDiscountAmount,
            validFor = c.ValidFor.ToString(),
            isActive = c.IsActive,
            usageCount = c.UsageCount,
            maxUsage = c.MaxUsage,
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CouponRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new CreateCouponCommand(
            req.Code, req.DiscountType, req.DiscountValue,
            req.MinOrderAmount, req.MaxDiscountAmount, req.ValidFor, req.MaxUsage), ct);
        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CouponRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateCouponCommand(
            id, req.Code, req.DiscountType, req.DiscountValue,
            req.MinOrderAmount, req.MaxDiscountAmount, req.ValidFor, req.MaxUsage), ct);
        return Ok();
    }

    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        await sender.Send(new ToggleCouponActiveCommand(id), ct);
        return Ok();
    }
}

public record CouponRequest(
    string Code, string DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, decimal? MaxDiscountAmount,
    string ValidFor, int? MaxUsage);
