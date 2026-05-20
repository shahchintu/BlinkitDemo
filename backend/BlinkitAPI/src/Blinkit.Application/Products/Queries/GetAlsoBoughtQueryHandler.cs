using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetAlsoBoughtQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetAlsoBoughtQuery, List<ProductDto>>
{
    public async Task<List<ProductDto>> Handle(GetAlsoBoughtQuery request, CancellationToken ct)
    {
        // Find orders that contain the requested product
        var orderIds = await db.OrderItems
            .Where(oi => oi.ProductId == request.ProductId)
            .Select(oi => oi.OrderId)
            .Distinct()
            .ToListAsync(ct);

        if (orderIds.Count == 0)
        {
            // Fallback: tag-based related products
            return await GetTagFallbackAsync(request.ProductId, request.Limit, ct);
        }

        // Co-purchased product ids ranked by frequency
        var alsoBoughtIds = await db.OrderItems
            .Where(oi => orderIds.Contains(oi.OrderId) && oi.ProductId != request.ProductId)
            .GroupBy(oi => oi.ProductId)
            .OrderByDescending(g => g.Count())
            .Take(request.Limit)
            .Select(g => g.Key)
            .ToListAsync(ct);

        if (alsoBoughtIds.Count == 0)
            return await GetTagFallbackAsync(request.ProductId, request.Limit, ct);

        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .Where(p => alsoBoughtIds.Contains(p.Id) && p.IsActive && !p.IsDeleted && p.Variants.Any(v => v.IsActive))
            .ToListAsync(ct);

        // Preserve frequency ordering
        return alsoBoughtIds
            .Select(id => products.FirstOrDefault(p => p.Id == id))
            .Where(p => p is not null)
            .Select(p => GetProductsQueryHandler.MapToDto(p!))
            .ToList();
    }

    private async Task<List<ProductDto>> GetTagFallbackAsync(
        Guid productId, int limit, CancellationToken ct)
    {
        var tags = await db.ProductTags
            .Where(t => t.ProductId == productId)
            .Select(t => t.Tag)
            .ToListAsync(ct);

        if (tags.Count == 0)
            return [];

        var relatedIds = await db.ProductTags
            .Where(t => tags.Contains(t.Tag) && t.ProductId != productId)
            .GroupBy(t => t.ProductId)
            .OrderByDescending(g => g.Count())
            .Take(limit)
            .Select(g => g.Key)
            .ToListAsync(ct);

        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .Where(p => relatedIds.Contains(p.Id) && p.IsActive && !p.IsDeleted && p.Variants.Any(v => v.IsActive))
            .ToListAsync(ct);

        return products.Select(GetProductsQueryHandler.MapToDto).ToList();
    }
}
