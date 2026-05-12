using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Orders.Queries;

public record GetOrderByIdQuery(Guid OrderId, string UserId) : IRequest<OrderDto>;

public class GetOrderByIdQueryHandler(IBlinkitDbContext db) : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        var userId = Guid.Parse(request.UserId);

        var o = await db.Orders
            .Where(o => o.Id == request.OrderId)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .Include(o => o.Address)
            .AsNoTracking()
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Order not found");

        if (o.UserId != userId)
            throw new UnauthorizedAccessException("Access denied");

        var names = o.Items.Select(i => i.Product.Name).ToList();
        var summary = names.Count <= 2
            ? string.Join(", ", names)
            : string.Join(", ", names.Take(2)) + $" +{names.Count - 2} more";

        return new OrderDto
        {
            Id = o.Id,
            Status = o.Status.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            SubTotal = o.SubTotal,
            DeliveryFee = o.DeliveryFee,
            CouponCode = o.CouponCode,
            CouponDiscount = o.CouponDiscount,
            TotalAmount = o.TotalAmount,
            RazorpayOrderId = o.RazorpayOrderId,
            RazorpayPaymentId = o.RazorpayPaymentId,
            CreatedAt = o.CreatedAt,
            ItemCount = o.Items.Count,
            ItemsSummary = summary,
            Address = o.Address is null ? null : new AddressDto
            {
                Id = o.Address.Id,
                Label = o.Address.Label,
                Street = o.Address.Street,
                City = o.Address.City,
                Pincode = o.Address.Pincode,
            },
            Items = o.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                ProductImageUrl = i.Product.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault() ?? string.Empty,
                VariantId = i.VariantId,
                VariantUnit = i.Variant?.Unit ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
            }).ToList(),
        };
    }
}
