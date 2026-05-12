using Blinkit.Application.Orders.DTOs;

namespace Blinkit.Application.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string customerName, Guid orderId,
        decimal total, decimal deliveryFee, List<OrderItemDto> items);

    Task SendOrderStatusUpdateAsync(string toEmail, string customerName, Guid orderId, string newStatus);
}
