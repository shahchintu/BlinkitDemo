using Blinkit.Application.Coupons;

namespace Blinkit.Application.Interfaces;

public interface ICouponRepository
{
    Task<CouponValidationResult> ValidateAsync(string code, Guid? userId, int orderCount, decimal subtotal);
}
