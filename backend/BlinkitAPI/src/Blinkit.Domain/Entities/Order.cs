namespace Blinkit.Domain.Entities;

public enum OrderStatus { Placed, Packed, OutForDelivery, Delivered, Cancelled }
public enum PaymentStatus { Pending, Paid, Failed, Refunded }

public class Order
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AddressId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Placed;
    public decimal SubTotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public string? CouponCode { get; set; }
    public decimal CouponDiscount { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? RazorpayOrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? DarkStoreId { get; set; }
    public string? DeliveryPartnerName { get; set; }
    public string? DeliveryPartnerPhone { get; set; }
    public decimal? DeliveryPartnerLat { get; set; }
    public decimal? DeliveryPartnerLng { get; set; }
    public int? EstimatedDeliveryMinutes { get; set; }
    public Address Address { get; set; } = null!;
    public DarkStore? DarkStore { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
}
