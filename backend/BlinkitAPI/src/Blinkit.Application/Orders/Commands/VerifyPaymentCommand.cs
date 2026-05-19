using Blinkit.Application.Cart.Commands;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Orders.Commands;

public record VerifyPaymentCommand(
    Guid OrderId,
    Guid UserId,
    string UserEmail,
    string CustomerName,
    string RazorpayPaymentId,
    string RazorpaySignature) : IRequest;

public class VerifyPaymentCommandHandler(
    IBlinkitDbContext db,
    IRazorpayService razorpayService,
    IEmailService emailService,
    ISender sender) : IRequestHandler<VerifyPaymentCommand>
{
    public async Task Handle(VerifyPaymentCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .Include(o => o.Address)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found");

        if (request.UserId != Guid.Empty && order.UserId != request.UserId)
            throw new UnauthorizedAccessException("Access denied");

        if (order.Status != OrderStatus.Placed || order.PaymentStatus != PaymentStatus.Pending)
            throw new InvalidOperationException("Order is not in a valid state for payment verification");

        var valid = razorpayService.VerifySignature(
            order.RazorpayOrderId!, request.RazorpayPaymentId, request.RazorpaySignature);

        if (!valid)
            throw new ApplicationException("Payment verification failed");

        order.PaymentStatus = PaymentStatus.Paid;
        order.RazorpayPaymentId = request.RazorpayPaymentId;

        var variantIds = order.Items.Select(i => i.VariantId).ToList();
        var variants = await db.ProductVariants
            .Where(v => variantIds.Contains(v.Id))
            .ToListAsync(cancellationToken);

        foreach (var item in order.Items)
        {
            var variant = variants.First(v => v.Id == item.VariantId);
            variant.StockQty = Math.Max(0, variant.StockQty - item.Quantity);
        }

        if (!string.IsNullOrEmpty(order.CouponCode))
        {
            var coupon = await db.Coupons
                .FirstOrDefaultAsync(c => c.Code == order.CouponCode, cancellationToken);
            if (coupon is not null)
                coupon.UsageCount++;
        }

        await db.SaveChangesAsync(cancellationToken);

        await sender.Send(new ClearCartCommand(request.UserId), cancellationToken);

        var emailItems = order.Items.Select(i => new OrderItemEmailDto
        {
            ProductName = i.Product.Name,
            VariantUnit = i.Variant.Unit,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            TotalPrice = i.UnitPrice * i.Quantity,
        }).ToList();

        var address = order.Address;
        var deliveryAddress = address is not null
            ? $"{address.Street}, {address.City} - {address.Pincode}"
            : "Not available";

        var capturedEmail       = request.UserEmail;
        var capturedName        = request.CustomerName;
        var capturedOrderId     = order.Id.ToString();
        var capturedSubTotal    = order.SubTotal;
        var capturedFee         = order.DeliveryFee;
        var capturedDiscount    = order.CouponDiscount;
        var capturedTotal       = order.TotalAmount;
        var capturedCoupon      = order.CouponCode;
        var capturedAddress     = deliveryAddress;
        const string deliverySlot = "Express Delivery (~10 mins)";

        try
        {
            await emailService.SendOrderConfirmationAsync(
                capturedEmail,
                capturedName,
                capturedOrderId,
                capturedSubTotal,
                capturedFee,
                capturedDiscount,
                capturedTotal,
                capturedCoupon,
                emailItems,
                capturedAddress,
                deliverySlot);
        }
        catch { }
    }
}
