namespace Blinkit.Application.Interfaces;

public record RazorpayOrderDto(string RazorpayOrderId, decimal Amount, string Currency);

public interface IRazorpayService
{
    Task<RazorpayOrderDto> CreateOrderAsync(decimal amount, string receipt);
    bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature);
}
