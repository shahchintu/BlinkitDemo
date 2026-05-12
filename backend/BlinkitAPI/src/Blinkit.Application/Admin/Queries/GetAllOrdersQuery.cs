using Blinkit.Application.Common;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Admin.Queries;

public record AdminOrderDto(
    Guid Id,
    string CustomerEmail,
    int ItemCount,
    decimal TotalAmount,
    string Status,
    string PaymentStatus,
    string ItemsSummary,
    DateTime CreatedAt,
    AddressDto? Address,
    List<OrderItemDto> Items,
    string? RazorpayPaymentId,
    decimal SubTotal,
    decimal DeliveryFee,
    string? CouponCode,
    decimal CouponDiscount);

public record GetAllOrdersQuery(int Page, int PageSize, string? Status) : IRequest<PagedResult<AdminOrderDto>>;

public class GetAllOrdersQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetAllOrdersQuery, PagedResult<AdminOrderDto>>
{
    public async Task<PagedResult<AdminOrderDto>> Handle(GetAllOrdersQuery request, CancellationToken ct)
    {
        var query = db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .Include(o => o.Address)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Status) &&
            Enum.TryParse<OrderStatus>(request.Status, out var statusFilter))
        {
            query = query.Where(o => o.Status == statusFilter);
        }

        var total = await query.CountAsync(ct);
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = orders.Select(o =>
        {
            var names = o.Items.Select(i => i.Product.Name).ToList();
            var summary = names.Count <= 2
                ? string.Join(", ", names)
                : string.Join(", ", names.Take(2)) + $" +{names.Count - 2} more";

            return new AdminOrderDto(
                o.Id,
                o.Address?.City ?? string.Empty,
                o.Items.Count,
                o.TotalAmount,
                o.Status.ToString(),
                o.PaymentStatus.ToString(),
                summary,
                o.CreatedAt,
                o.Address is null ? null : new AddressDto
                {
                    Id = o.Address.Id, Label = o.Address.Label, Street = o.Address.Street,
                    City = o.Address.City, Pincode = o.Address.Pincode,
                },
                o.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id, ProductId = i.ProductId,
                    ProductName = i.Product.Name,
                    ProductImageUrl = i.Product.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault() ?? string.Empty,
                    VariantId = i.VariantId, VariantUnit = i.Variant?.Unit ?? string.Empty,
                    Quantity = i.Quantity, UnitPrice = i.UnitPrice,
                }).ToList(),
                o.RazorpayPaymentId,
                o.SubTotal,
                o.DeliveryFee,
                o.CouponCode,
                o.CouponDiscount
            );
        }).ToList();

        var totalPages = (int)Math.Ceiling(total / (double)request.PageSize);
        return new PagedResult<AdminOrderDto>(dtos, total, request.Page, request.PageSize, totalPages);
    }
}
