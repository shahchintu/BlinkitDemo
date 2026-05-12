using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Orders.Queries;

public record GetOrdersQuery(string UserId) : IRequest<List<OrderDto>>;

public class GetOrdersQueryHandler(IBlinkitDbContext db) : IRequestHandler<GetOrdersQuery, List<OrderDto>>
{
    public async Task<List<OrderDto>> Handle(GetOrdersQuery request, CancellationToken ct)
    {
        var userId = Guid.Parse(request.UserId);

        var orders = await db.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .Include(o => o.Address)
            .AsNoTracking()
            .ToListAsync(ct);

        return orders.Select(o =>
        {
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
        }).ToList();
    }
}
