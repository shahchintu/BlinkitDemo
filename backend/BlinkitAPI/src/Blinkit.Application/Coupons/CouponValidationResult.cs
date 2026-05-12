namespace Blinkit.Application.Coupons;

public record CouponValidationResult(bool IsValid, decimal DiscountAmount, string Message);
