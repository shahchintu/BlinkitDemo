using Blinkit.Application.Coupons;
using Blinkit.Domain.Entities;

namespace Blinkit.Application.Interfaces;

public interface ICouponRepository
{
    Task<CouponValidationResult> ValidateAsync(string code, Guid? userId, int orderCount, decimal subtotal);
    Task<List<Coupon>> GetAllActiveAsync();
}
