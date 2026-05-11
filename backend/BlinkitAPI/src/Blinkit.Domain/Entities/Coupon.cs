namespace Blinkit.Domain.Entities;

public enum DiscountType { Percent, Flat }
public enum CouponValidFor { All, NewUsers, Category }

public class Coupon
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public CouponValidFor ValidFor { get; set; }
    public Guid? CategoryId { get; set; }
    public bool IsActive { get; set; } = true;
    public int UsageCount { get; set; }
    public int? MaxUsage { get; set; }
}
