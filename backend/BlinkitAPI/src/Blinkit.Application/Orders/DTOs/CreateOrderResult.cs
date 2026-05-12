namespace Blinkit.Application.Orders.DTOs;

public record CreateOrderResult(Guid OrderId, string RazorpayOrderId, decimal Amount, string Currency = "INR");
