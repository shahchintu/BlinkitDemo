using System.Security.Claims;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public sealed class PaymentsController(ISender sender, IRazorpayService razorpayService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException());

    private string UserEmail => User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    private string UserName => User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken ct)
    {
        var command = new CreateOrderCommand(
            UserId,
            request.AddressId,
            request.DeliverySlotId,
            request.CouponCode,
            false);

        var result = await sender.Send(command, ct);
        return Ok(new
        {
            result.OrderId,
            result.RazorpayOrderId,
            result.Amount,
            result.Currency,
        });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request, CancellationToken ct)
    {
        var command = new VerifyPaymentCommand(
            request.OrderId,
            UserId,
            UserEmail,
            UserName,
            request.RazorpayPaymentId,
            request.RazorpaySignature);

        await sender.Send(command, ct);
        return Ok(new { success = true });
    }

    [HttpPost("webhook"), AllowAnonymous]
    public async Task<IActionResult> Webhook([FromBody] WebhookPayload payload,
        [FromHeader(Name = "X-Razorpay-Signature")] string? signature, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(signature)) return Ok();

        if (payload.Event == "payment.captured" && payload.Payload?.Payment?.Entity is { } entity)
        {
            var orderId = entity.Notes?.OrderId;
            if (!Guid.TryParse(orderId, out var parsedOrderId)) return Ok();

            var valid = razorpayService.VerifySignature(
                entity.OrderId ?? string.Empty,
                entity.Id ?? string.Empty,
                signature);

            if (!valid) return Ok();

            try
            {
                var command = new VerifyPaymentCommand(
                    parsedOrderId,
                    Guid.Empty,
                    string.Empty,
                    string.Empty,
                    entity.Id ?? string.Empty,
                    signature);
                await sender.Send(command, ct);
            }
            catch { }
        }

        return Ok();
    }
}

public record CreateOrderRequest(Guid AddressId, Guid? DeliverySlotId, string? CouponCode);
public record VerifyPaymentRequest(Guid OrderId, string RazorpayOrderId, string RazorpayPaymentId, string RazorpaySignature);

public class WebhookPayload
{
    public string? Event { get; set; }
    public WebhookPayloadWrapper? Payload { get; set; }
}

public class WebhookPayloadWrapper
{
    public WebhookPaymentWrapper? Payment { get; set; }
}

public class WebhookPaymentWrapper
{
    public WebhookPaymentEntity? Entity { get; set; }
}

public class WebhookPaymentEntity
{
    public string? Id { get; set; }
    public string? OrderId { get; set; }
    public WebhookNotes? Notes { get; set; }
}

public class WebhookNotes
{
    public string? OrderId { get; set; }
}
