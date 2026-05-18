using Blinkit.Application.Orders.DTOs;

namespace Blinkit.Application.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(
        string toEmail,
        string customerName,
        string orderId,
        decimal subTotal,
        decimal deliveryFee,
        decimal couponDiscount,
        decimal totalAmount,
        string? couponCode,
        List<OrderItemEmailDto> items,
        string deliveryAddress,
        string deliverySlot);

    Task SendOrderStatusUpdateAsync(string toEmail, string customerName, Guid orderId, string newStatus);
}
