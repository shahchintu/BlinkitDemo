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
        const decimal handlingCharge = 2m;
        var totalAmount = discountedSubTotal + deliveryFee + handlingCharge;

        var receipt = "BLK-" + Guid.NewGuid().ToString()[..6].ToUpper();
        var razorpayOrder = await razorpayService.CreateOrderAsync(totalAmount, receipt);

        var address = await db.Addresses
            .FirstOrDefaultAsync(a => a.Id == request.AddressId, cancellationToken);

        var darkStores = await db.DarkStores
            .Where(s => s.IsActive)
            .ToListAsync(cancellationToken);

        DarkStore? nearestStore = null;
        if (darkStores.Count > 0)
        {
            var userLat = address?.Lat ?? 23.0225m;
            var userLng = address?.Lng ?? 72.5714m;
            nearestStore = darkStores
                .OrderBy(s => Haversine(userLat, userLng, s.Lat, s.Lng))
                .First();
        }

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
            DarkStoreId = nearestStore?.Id,
            DeliveryPartnerName = PickPartnerName(),
            DeliveryPartnerPhone = PickPartnerPhone(),
            DeliveryPartnerLat = nearestStore?.Lat,
            DeliveryPartnerLng = nearestStore?.Lng,
            EstimatedDeliveryMinutes = 8,
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

    private static double Haversine(decimal lat1, decimal lng1, decimal lat2, decimal lng2)
    {
        var dLat = (double)(lat2 - lat1) * Math.PI / 180;
        var dLng = (double)(lng2 - lng1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos((double)lat1 * Math.PI / 180)
              * Math.Cos((double)lat2 * Math.PI / 180)
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return 6371 * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static string PickPartnerName()
    {
        string[] names = ["Rahul Kumar", "Arjun Singh", "Priya Sharma",
                          "Amit Patel", "Suresh Verma", "Deepak Yadav",
                          "Ravi Gupta", "Sanjay Mehta"];
        return names[Random.Shared.Next(names.Length)];
    }

    private static string PickPartnerPhone() =>
        "98" + Random.Shared.Next(10_000_000, 99_999_999).ToString();
}
