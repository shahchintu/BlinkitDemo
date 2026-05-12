using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Orders.Commands;

public record AddItemRequest(Guid ProductId, Guid VariantId, int Qty);

public record AddItemsToOrderCommand(Guid OrderId, Guid UserId, List<AddItemRequest> Items) : IRequest;

public class AddItemsToOrderCommandHandler(IBlinkitDbContext db) : IRequestHandler<AddItemsToOrderCommand>
{
    public async Task Handle(AddItemsToOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found");

        if (order.UserId != request.UserId)
            throw new UnauthorizedAccessException("Access denied");

        if (order.Status != OrderStatus.Placed)
            throw new InvalidOperationException("Items can only be added while order is in Placed status");

        var variantIds = request.Items.Select(i => i.VariantId).ToList();
        var variants = await db.ProductVariants
            .Where(v => variantIds.Contains(v.Id) && v.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var req in request.Items)
        {
            var variant = variants.FirstOrDefault(v => v.Id == req.VariantId)
                ?? throw new InvalidOperationException($"Variant {req.VariantId} not found or inactive");

            if (variant.StockQty < req.Qty)
                throw new InvalidOperationException($"Insufficient stock for variant {req.VariantId}");

            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = req.ProductId,
                VariantId = req.VariantId,
                Quantity = req.Qty,
                UnitPrice = variant.DiscountPrice ?? variant.Price,
            });
        }

        order.SubTotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        order.DeliveryFee = order.SubTotal >= 199 ? 0m : 29m;
        order.TotalAmount = order.SubTotal - order.CouponDiscount + order.DeliveryFee;

        await db.SaveChangesAsync(cancellationToken);
    }
}
