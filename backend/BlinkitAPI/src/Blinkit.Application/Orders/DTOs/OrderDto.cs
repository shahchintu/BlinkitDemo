using Blinkit.Domain.Entities;

namespace Blinkit.Application.Orders.DTOs;

public class OrderDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public string? CouponCode { get; set; }
    public decimal CouponDiscount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? RazorpayOrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public AddressDto? Address { get; set; }
    public List<OrderItemDto> Items { get; set; } = [];
}
