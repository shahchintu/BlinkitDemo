using Blinkit.Application.Common;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Admin.Queries;

public record UserDto(string Id, string FullName, string Email, string Role, int OrderCount, DateTime CreatedAt);

public record GetAllUsersQuery(int Page, int PageSize, string? Search) : IRequest<PagedResult<UserDto>>;

public class GetAllUsersQueryHandler(UserManager<AppUser> userManager, IBlinkitDbContext db)
    : IRequestHandler<GetAllUsersQuery, PagedResult<UserDto>>
{
    public async Task<PagedResult<UserDto>> Handle(GetAllUsersQuery request, CancellationToken ct)
    {
        var query = userManager.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(s) || (u.Email != null && u.Email.ToLower().Contains(s)));
        }

        var total = await query.CountAsync(ct);
        var users = await query
            .OrderBy(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var userIds = users.Select(u => Guid.Parse(u.Id)).ToList();
        var orderCounts = await db.Orders
            .Where(o => userIds.Contains(o.UserId))
            .GroupBy(o => o.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var adminIds = new HashSet<string>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            if (roles.Contains("Admin")) adminIds.Add(user.Id);
        }

        var dtos = users.Select(u => new UserDto(
            u.Id,
            u.FullName,
            u.Email ?? string.Empty,
            adminIds.Contains(u.Id) ? "Admin" : "User",
            orderCounts.GetValueOrDefault(Guid.Parse(u.Id), 0),
            u.CreatedAt
        )).ToList();

        var totalPages = (int)Math.Ceiling(total / (double)request.PageSize);
        return new PagedResult<UserDto>(dtos, total, request.Page, request.PageSize, totalPages);
    }
}

public record GetUserOrdersQuery(string UserId) : IRequest<List<OrderDto>>;

public class GetUserOrdersQueryHandler(IBlinkitDbContext db) : IRequestHandler<GetUserOrdersQuery, List<OrderDto>>
{
    public async Task<List<OrderDto>> Handle(GetUserOrdersQuery request, CancellationToken ct)
    {
        var userId = Guid.Parse(request.UserId);
        var orders = await db.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .Include(o => o.Items).ThenInclude(i => i.Variant)
            .AsNoTracking()
            .ToListAsync(ct);

        return orders.Select(o =>
        {
            var names = o.Items.Select(i => i.Product.Name).ToList();
            var summary = names.Count <= 2 ? string.Join(", ", names)
                : string.Join(", ", names.Take(2)) + $" +{names.Count - 2} more";
            return new OrderDto
            {
                Id = o.Id, Status = o.Status.ToString(), PaymentStatus = o.PaymentStatus.ToString(),
                SubTotal = o.SubTotal, DeliveryFee = o.DeliveryFee, CouponCode = o.CouponCode,
                CouponDiscount = o.CouponDiscount, TotalAmount = o.TotalAmount,
                RazorpayPaymentId = o.RazorpayPaymentId, CreatedAt = o.CreatedAt,
                ItemCount = o.Items.Count, ItemsSummary = summary,
                Items = o.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id, ProductId = i.ProductId, ProductName = i.Product.Name,
                    ProductImageUrl = i.Product.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault() ?? string.Empty,
                    VariantId = i.VariantId, VariantUnit = i.Variant?.Unit ?? string.Empty,
                    Quantity = i.Quantity, UnitPrice = i.UnitPrice,
                }).ToList(),
            };
        }).ToList();
    }
}
