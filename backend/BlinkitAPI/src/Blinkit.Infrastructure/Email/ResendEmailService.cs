using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;

namespace Blinkit.Infrastructure.Email;

public class ResendEmailService(IResend resend, IConfiguration configuration, ILogger<ResendEmailService> logger) : IEmailService
{
    private readonly string _from = configuration["Email:FromAddress"]
        ?? "onboarding@resend.dev";

    public async Task SendOrderConfirmationAsync(string toEmail, string customerName, Guid orderId,
        decimal total, decimal deliveryFee, List<OrderItemDto> items)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) return;
        try
        {
            var itemRows = string.Join("", items.Select(i =>
                $"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{i.ProductName}</td>" +
                $"<td style='padding:8px;border-bottom:1px solid #eee;text-align:center'>{i.VariantUnit}</td>" +
                $"<td style='padding:8px;border-bottom:1px solid #eee;text-align:center'>{i.Quantity}</td>" +
                $"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>₹{i.UnitPrice * i.Quantity:0.00}</td></tr>"));

            var subTotal = total - deliveryFee;
            var deliveryDisplay = deliveryFee == 0 ? "FREE" : $"₹{deliveryFee:0}";

            var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family:Arial,sans-serif;background:#F8F8F8;margin:0;padding:20px'>
  <div style='max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)'>
    <div style='background:#0C831F;padding:24px;text-align:center'>
      <h1 style='color:#F8C200;margin:0;font-style:italic;font-size:28px'>blinkit</h1>
      <p style='color:#fff;margin:8px 0 0;font-size:16px'>🎉 Order Confirmed!</p>
    </div>
    <div style='padding:24px'>
      <p style='font-size:16px;color:#1A1A1A'>Hi {customerName}, your order is confirmed!</p>
      <p style='color:#666;font-size:13px'>Order ID: <strong>#{orderId}</strong></p>
      <div style='background:#E8F5E9;border-radius:8px;padding:12px;text-align:center;margin:16px 0'>
        <span style='color:#0C831F;font-weight:bold'>🕐 ~10 minutes delivery</span>
      </div>
      <table style='width:100%;border-collapse:collapse;font-size:14px'>
        <thead>
          <tr style='background:#F8F8F8'>
            <th style='padding:8px;text-align:left'>Item</th>
            <th style='padding:8px;text-align:center'>Unit</th>
            <th style='padding:8px;text-align:center'>Qty</th>
            <th style='padding:8px;text-align:right'>Price</th>
          </tr>
        </thead>
        <tbody>{itemRows}</tbody>
      </table>
      <div style='margin-top:16px;border-top:2px solid #eee;padding-top:12px;font-size:14px'>
        <div style='display:flex;justify-content:space-between;margin-bottom:6px'>
          <span>Subtotal</span><span>₹{subTotal:0.00}</span>
        </div>
        <div style='display:flex;justify-content:space-between;margin-bottom:6px'>
          <span>Delivery</span><span>{deliveryDisplay}</span>
        </div>
        <div style='display:flex;justify-content:space-between;font-weight:bold;font-size:16px;margin-top:8px;padding-top:8px;border-top:1px solid #eee'>
          <span>Total</span><span style='color:#0C831F'>₹{total:0.00}</span>
        </div>
      </div>
      <div style='text-align:center;margin-top:24px'>
        <a href='#' style='background:#0C831F;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;display:inline-block'>Track Order</a>
      </div>
    </div>
    <div style='background:#F8F8F8;padding:16px;text-align:center;font-size:12px;color:#666'>
      Blinkit Clone · Thank you for your order!
    </div>
  </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = _from,
                Subject = $"🎉 Order Confirmed! #{orderId} — Blinkit Clone",
                HtmlBody = html,
            };
            message.To.Add(toEmail);

            await resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send order confirmation email to {Email}", toEmail);
        }
    }

    public async Task SendOrderStatusUpdateAsync(string toEmail, string customerName, Guid orderId, string newStatus)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) return;
        try
        {
            var (subject, body) = newStatus switch
            {
                "Packed" => (
                    $"📦 Your order #{orderId} is being packed!",
                    $"<p>Hi {customerName}, your order <strong>#{orderId}</strong> is being packed and will be out for delivery soon.</p>"),
                "OutForDelivery" => (
                    $"🛵 Your order #{orderId} is out for delivery!",
                    $"<p>Hi {customerName}, your order <strong>#{orderId}</strong> is on the way! Estimated arrival: ~10 minutes.</p>"),
                "Delivered" => (
                    $"✅ Your order #{orderId} has been delivered!",
                    $"<p>Hi {customerName}, your order <strong>#{orderId}</strong> has been delivered. Enjoy your groceries!</p>"),
                _ => ($"Order #{orderId} update", $"<p>Your order #{orderId} status has been updated to {newStatus}.</p>"),
            };

            var html = $@"
<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;padding:20px'>
  <div style='max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E0E0E0;padding:24px'>
    <h2 style='color:#0C831F'>blinkit</h2>
    {body}
    <div style='text-align:center;margin-top:20px'>
      <a href='#' style='background:#0C831F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold'>View Order</a>
    </div>
  </div>
</body></html>";

            var message = new EmailMessage
            {
                From = _from,
                Subject = subject,
                HtmlBody = html,
            };
            message.To.Add(toEmail);

            await resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send status update email to {Email}", toEmail);
        }
    }
}
