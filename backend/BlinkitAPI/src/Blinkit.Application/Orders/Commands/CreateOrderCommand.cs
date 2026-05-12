using Blinkit.Application.Coupons;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Orders.Commands;

public record CreateOrderCommand(
    Guid UserId,
    Guid AddressId,
    Guid? DeliverySlotId,
    string? CouponCode,
    bool HasBlinkitPlus) : IRequest<CreateOrderResult>;

public class CreateOrderCommandHandler(
    IBlinkitDbContext db,
    IRedisCartService cartService,
    ICouponRepository couponRepo,
    IRazorpayService razorpayService) : IRequestHandler<CreateOrderCommand, CreateOrderResult>
{
    public async Task<CreateOrderResult> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var cart = await cartService.GetCartAsync(request.UserId);
        if (cart.Items.Count == 0)
            throw new InvalidOperationException("Cart is empty");

        var variantIds = cart.Items.Select(i => i.VariantId).ToList();
        var variants = await db.ProductVariants
            .Where(v => variantIds.Contains(v.Id) && v.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var item in cart.Items)
        {
            var variant = variants.FirstOrDefault(v => v.Id == item.VariantId)
                ?? throw new InvalidOperationException($"Variant {item.VariantId} not found or inactive");

            if (variant.StockQty < item.Quantity)
                throw new InvalidOperationException($"Insufficient stock for {item.ProductName}");
        }

        var subTotal = cart.Items.Sum(i => i.UnitPrice * i.Quantity);

        decimal couponDiscount = 0;
        string? appliedCouponCode = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var orderCount = await db.Orders.CountAsync(o => o.UserId == request.UserId, cancellationToken);
            var validation = await couponRepo.ValidateAsync(request.CouponCode, request.UserId, orderCount, subTotal);
            if (validation.IsValid)
            {
                couponDiscount = validation.DiscountAmount;
                appliedCouponCode = request.CouponCode.ToUpper();
            }
        }

        var discountedSubTotal = subTotal - couponDiscount;
        var deliveryFee = (discountedSubTotal >= 199 || request.HasBlinkitPlus) ? 0m : 29m;
        var totalAmount = discountedSubTotal + deliveryFee;

        var receipt = "BLK-" + Guid.NewGuid().ToString()[..6].ToUpper();
        var razorpayOrder = await razorpayService.CreateOrderAsync(totalAmount, receipt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            AddressId = request.AddressId,
            Status = OrderStatus.Placed,
            SubTotal = subTotal,
            DeliveryFee = deliveryFee,
            CouponCode = appliedCouponCode,
            CouponDiscount = couponDiscount,
            TotalAmount = totalAmount,
            PaymentStatus = PaymentStatus.Pending,
            RazorpayOrderId = razorpayOrder.RazorpayOrderId,
            CreatedAt = DateTime.UtcNow,
            Items = cart.Items.Select(i => new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = i.ProductId,
                VariantId = i.VariantId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
            }).ToList(),
        };

        await db.Orders.AddAsync(order, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateOrderResult(order.Id, razorpayOrder.RazorpayOrderId, totalAmount);
    }
}
