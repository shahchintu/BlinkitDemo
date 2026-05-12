using Blinkit.Application.Coupons;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Infrastructure.Repositories;

public class CouponRepository(IBlinkitDbContext db) : ICouponRepository
{
    public async Task<List<Domain.Entities.Coupon>> GetAllActiveAsync() =>
        await db.Coupons.Where(c => c.IsActive).OrderBy(c => c.Code).ToListAsync();

    public async Task<CouponValidationResult> ValidateAsync(string code, Guid? userId, int orderCount, decimal subtotal)
    {
        var coupon = await db.Coupons
            .FirstOrDefaultAsync(c => c.Code.ToUpper() == code.ToUpper() && c.IsActive);

        if (coupon is null)
            return new CouponValidationResult(false, 0, "Invalid coupon code");

        if (coupon.ValidFor == CouponValidFor.NewUsers && orderCount > 0)
            return new CouponValidationResult(false, 0, "This coupon is valid for first order only");

        if (subtotal < coupon.MinOrderAmount)
            return new CouponValidationResult(false, 0, $"Minimum order amount is ₹{coupon.MinOrderAmount:0}");

        if (coupon.MaxUsage.HasValue && coupon.UsageCount >= coupon.MaxUsage.Value)
            return new CouponValidationResult(false, 0, "Coupon usage limit has been reached");

        decimal discount;
        string message;

        if (coupon.Code == "FREESHIP")
        {
            discount = 29; // standard delivery fee
            message = "Free delivery unlocked!";
        }
        else if (coupon.DiscountType == DiscountType.Percent)
        {
            discount = Math.Round(subtotal * coupon.DiscountValue / 100, 2);
            if (coupon.MaxDiscountAmount.HasValue)
                discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);
            message = $"You save ₹{discount:0}!";
        }
        else
        {
            discount = coupon.DiscountValue;
            message = $"You save ₹{discount:0}!";
        }

        return new CouponValidationResult(true, discount, message);
    }
}
