using System.Security.Cryptography;
using System.Text;
using Blinkit.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Razorpay.Api;

namespace Blinkit.Infrastructure.Payment;

public class RazorpayService(IConfiguration configuration) : IRazorpayService
{
    private readonly string _keyId = configuration["Razorpay:KeyId"]
        ?? throw new InvalidOperationException("Razorpay:KeyId is not configured");

    private readonly string _keySecret = configuration["Razorpay:KeySecret"]
        ?? throw new InvalidOperationException("Razorpay:KeySecret is not configured");

    public Task<RazorpayOrderDto> CreateOrderAsync(decimal amount, string receipt)
    {
        var client = new RazorpayClient(_keyId, _keySecret);
        var options = new Dictionary<string, object>
        {
            { "amount", (int)(amount * 100) },
            { "currency", "INR" },
            { "receipt", receipt },
        };

        var order = client.Order.Create(options);
        var orderId = order["id"].ToString()!;
        return Task.FromResult(new RazorpayOrderDto(orderId, amount, "INR"));
    }

    public bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature)
    {
        var payload = $"{razorpayOrderId}|{razorpayPaymentId}";
        var keyBytes = Encoding.UTF8.GetBytes(_keySecret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(payloadBytes);
        var computed = Convert.ToHexString(hash).ToLower();

        return string.Equals(computed, signature, StringComparison.OrdinalIgnoreCase);
    }
}
