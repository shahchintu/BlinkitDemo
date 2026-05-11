using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetRelatedProductsQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetRelatedProductsQuery, List<ProductDto>>
{
    public async Task<List<ProductDto>> Handle(GetRelatedProductsQuery request, CancellationToken ct)
    {
        var tags = await db.ProductTags
            .Where(t => t.ProductId == request.ProductId)
            .Select(t => t.Tag)
            .ToListAsync(ct);

        if (tags.Count == 0)
            return [];

        var relatedProductIds = await db.ProductTags
            .Where(t => tags.Contains(t.Tag) && t.ProductId != request.ProductId)
            .GroupBy(t => t.ProductId)
            .OrderByDescending(g => g.Count())
            .Take(request.Limit)
            .Select(g => g.Key)
            .ToListAsync(ct);

        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .Where(p => relatedProductIds.Contains(p.Id))
            .ToListAsync(ct);

        return products.Select(GetProductsQueryHandler.MapToDto).ToList();
    }
}
