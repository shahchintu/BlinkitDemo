using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Admin.Queries;

public record TopProductDto(string ProductId, string Name, string ImageUrl, int SoldCount);

public record DashboardStatsDto(
    int TotalOrders,
    decimal TotalRevenue,
    int PendingOrders,
    int DeliveredOrders,
    List<TopProductDto> TopProducts);

public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

public class GetDashboardStatsQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        var totalOrders = await db.Orders.CountAsync(ct);
        var totalRevenue = await db.Orders
            .Where(o => o.PaymentStatus == PaymentStatus.Paid)
            .SumAsync(o => o.TotalAmount, ct);
        var pendingOrders = await db.Orders
            .CountAsync(o => o.Status == OrderStatus.Placed || o.Status == OrderStatus.Packed, ct);
        var deliveredOrders = await db.Orders
            .CountAsync(o => o.Status == OrderStatus.Delivered, ct);

        var topProducts = await db.OrderItems
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, SoldCount = g.Sum(i => i.Quantity) })
            .OrderByDescending(x => x.SoldCount)
            .Take(5)
            .Join(db.Products, x => x.ProductId, p => p.Id,
                (x, p) => new { x.ProductId, p.Name, x.SoldCount, p.Images })
            .ToListAsync(ct);

        var topDtos = topProducts.Select(x => new TopProductDto(
            x.ProductId.ToString(),
            x.Name,
            x.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault() ?? string.Empty,
            x.SoldCount
        )).ToList();

        return new DashboardStatsDto(totalOrders, totalRevenue, pendingOrders, deliveredOrders, topDtos);
    }
}
