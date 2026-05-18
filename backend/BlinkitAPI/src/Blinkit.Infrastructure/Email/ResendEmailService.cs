using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;

namespace Blinkit.Infrastructure.Email;

public class ResendEmailService(IResend resend, IConfiguration configuration, ILogger<ResendEmailService> logger) : IEmailService
{
    private readonly string _from = string.IsNullOrWhiteSpace(configuration["Email:FromAddress"])
        ? "onboarding@resend.dev"
        : configuration["Email:FromAddress"]!;

    public async Task SendOrderConfirmationAsync(
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
        string deliverySlot)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) return;
        try
        {
            var shortId = orderId.Length >= 8 ? orderId[..8].ToUpper() : orderId.ToUpper();

            var itemRows = string.Join("", items.Select(i =>
                $"<tr>" +
                $"<td style='padding:12px;border-bottom:1px solid #F5F5F5'>" +
                $"<div style='font-weight:600;color:#1A1A1A;font-size:14px'>{i.ProductName}</div>" +
                $"<div style='color:#666;font-size:12px'>{i.VariantUnit}</div>" +
                $"</td>" +
                $"<td style='padding:12px;border-bottom:1px solid #F5F5F5;text-align:center;font-size:14px;color:#1A1A1A'>×{i.Quantity}</td>" +
                $"<td style='padding:12px;border-bottom:1px solid #F5F5F5;text-align:right;font-weight:600;font-size:14px;color:#1A1A1A'>₹{i.TotalPrice:F0}</td>" +
                $"</tr>"));

            var couponRow = couponDiscount > 0 && !string.IsNullOrEmpty(couponCode)
                ? $"<div style='display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#0C831F'>" +
                  $"<span>Coupon Discount ({couponCode})</span><span>-₹{couponDiscount:F0}</span></div>"
                : string.Empty;

            var deliveryDisplay = deliveryFee == 0
                ? "<span style='color:#0C831F'>FREE 🎉</span>"
                : $"₹{deliveryFee:F0}";

            var html = $@"<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; background: #F8F8F8; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
    .header {{ background: #0C831F; padding: 24px; text-align: center; }}
    .header h1 {{ color: #F8C200; font-size: 28px; font-weight: 900; margin: 0; font-style: italic; }}
    .header p {{ color: white; margin: 8px 0 0; font-size: 14px; }}
    .success-banner {{ background: #E8F5E9; padding: 20px; text-align: center; border-bottom: 1px solid #E0E0E0; }}
    .checkmark {{ font-size: 48px; }}
    .success-banner h2 {{ color: #0C831F; margin: 8px 0; font-size: 20px; }}
    .success-banner p {{ color: #666; margin: 0; font-size: 14px; }}
    .section {{ padding: 20px 24px; border-bottom: 1px solid #F5F5F5; }}
    .section h3 {{ font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0 0 12px; }}
    .order-id {{ background: #F8F8F8; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 16px; }}
    .order-id span {{ font-size: 12px; color: #666; }}
    .order-id strong {{ font-size: 16px; color: #1A1A1A; display: block; font-family: monospace; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th {{ background: #F8F8F8; padding: 10px 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; }}
    .price-breakdown {{ background: #F8F8F8; border-radius: 12px; padding: 16px; }}
    .eta-banner {{ background: #0C831F; color: white; text-align: center; padding: 16px; border-radius: 12px; margin-top: 16px; }}
    .eta-banner .time {{ font-size: 24px; font-weight: 900; }}
    .eta-banner .label {{ font-size: 13px; opacity: 0.9; }}
    .delivery-card {{ flex: 1; background: #F8F8F8; border-radius: 10px; padding: 12px; }}
    .footer {{ background: #1A1A1A; padding: 24px; text-align: center; }}
    .footer p {{ color: #999; font-size: 12px; margin: 4px 0; }}
    .footer .brand {{ color: #F8C200; font-weight: 900; font-style: italic; font-size: 20px; }}
  </style>
</head>
<body>
  <div class='container'>

    <div class='header'>
      <h1>blinkit</h1>
      <p>Fast delivery to your doorstep</p>
    </div>

    <div class='success-banner'>
      <div class='checkmark'>✅</div>
      <h2>Order Confirmed!</h2>
      <p>Hi {customerName}, your order has been placed successfully</p>
    </div>

    <div class='section'>
      <div class='order-id'>
        <span>Order ID</span>
        <strong>#{shortId}</strong>
      </div>
      <div class='eta-banner'>
        <div class='label'>⏱️ Estimated Delivery Time</div>
        <div class='time'>~10 Minutes</div>
        <div class='label'>From the nearest Blinkit dark store</div>
      </div>
    </div>

    <div class='section'>
      <h3>📦 Order Items ({items.Count} items)</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style='text-align:center'>Qty</th>
            <th style='text-align:right'>Price</th>
          </tr>
        </thead>
        <tbody>{itemRows}</tbody>
      </table>
    </div>

    <div class='section'>
      <h3>💰 Price Details</h3>
      <div class='price-breakdown'>
        <div style='display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#666'>
          <span>Subtotal ({items.Count} items)</span>
          <span>₹{subTotal:F0}</span>
        </div>
        {couponRow}
        <div style='display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#0C831F'>
          <span>Delivery Fee</span>
          <span>{deliveryDisplay}</span>
        </div>
        <div style='display:flex;justify-content:space-between;padding:12px 0 6px;font-size:16px;font-weight:700;color:#1A1A1A;border-top:1px solid #E0E0E0;margin-top:8px'>
          <span>Total Amount Paid</span>
          <span>₹{totalAmount:F0}</span>
        </div>
      </div>
    </div>

    <div class='section'>
      <h3>🚚 Delivery Details</h3>
      <div style='display:flex;gap:12px'>
        <div class='delivery-card'>
          <div style='font-size:11px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:4px'>Delivery Address</div>
          <div style='font-size:14px;color:#1A1A1A;font-weight:500'>{deliveryAddress}</div>
        </div>
        <div class='delivery-card'>
          <div style='font-size:11px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:4px'>Delivery Slot</div>
          <div style='font-size:14px;color:#1A1A1A;font-weight:500'>{deliverySlot}</div>
        </div>
      </div>
    </div>

    <div class='section'>
      <h3>👤 Customer Details</h3>
      <div style='display:flex;gap:12px'>
        <div class='delivery-card'>
          <div style='font-size:11px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:4px'>Name</div>
          <div style='font-size:14px;color:#1A1A1A;font-weight:500'>{customerName}</div>
        </div>
        <div class='delivery-card'>
          <div style='font-size:11px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:4px'>Email</div>
          <div style='font-size:14px;color:#1A1A1A;font-weight:500'>{toEmail}</div>
        </div>
      </div>
    </div>

    <div class='footer'>
      <div class='brand'>blinkit</div>
      <p>India's last minute app</p>
      <p style='margin-top:12px'>Questions? Contact us at support@blinkit.com</p>
      <p>© 2025 Blinkit Clone. All rights reserved.</p>
    </div>

  </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = _from,
                Subject = $"🎉 Order Confirmed! #{shortId} — Blinkit Clone",
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

            var html = $@"<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;padding:20px'>
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
