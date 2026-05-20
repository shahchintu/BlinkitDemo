using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetTopInCategoryQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetTopInCategoryQuery, List<ProductDto>>
{
    public async Task<List<ProductDto>> Handle(GetTopInCategoryQuery request, CancellationToken ct)
    {
        var categoryId = await db.Products
            .Where(p => p.Id == request.ProductId)
            .Select(p => p.CategoryId)
            .FirstOrDefaultAsync(ct);

        if (categoryId == Guid.Empty)
            return [];

        // Products in same category ordered by order frequency
        var topProductIds = await db.OrderItems
            .Where(oi => oi.Product.CategoryId == categoryId && oi.ProductId != request.ProductId)
            .GroupBy(oi => oi.ProductId)
            .OrderByDescending(g => g.Count())
            .Take(request.Limit)
            .Select(g => g.Key)
            .ToListAsync(ct);

        // Fallback to highest-discount products when no order data exists
        if (topProductIds.Count == 0)
        {
            return await GetFallbackAsync(categoryId, request.ProductId, request.Limit, ct);
        }

        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .Where(p => topProductIds.Contains(p.Id) && p.IsActive && !p.IsDeleted && p.Variants.Any(v => v.IsActive))
            .ToListAsync(ct);

        // Preserve the order-frequency ordering
        return topProductIds
            .Select(id => products.FirstOrDefault(p => p.Id == id))
            .Where(p => p is not null)
            .Select(p => GetProductsQueryHandler.MapToDto(p!))
            .ToList();
    }

    private async Task<List<ProductDto>> GetFallbackAsync(
        Guid categoryId, Guid excludeId, int limit, CancellationToken ct)
    {
        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .Where(p => p.CategoryId == categoryId
                && p.Id != excludeId
                && p.IsActive
                && !p.IsDeleted
                && p.Variants.Any(v => v.IsActive))
            .OrderByDescending(p => p.Variants
                .Where(v => v.IsActive && v.DiscountPrice.HasValue)
                .Select(v => (v.Price - v.DiscountPrice!.Value) / v.Price * 100)
                .Max())
            .Take(limit)
            .ToListAsync(ct);

        return products.Select(GetProductsQueryHandler.MapToDto).ToList();
    }
}
