using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetSimilarProductsQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetSimilarProductsQuery, List<ProductDto>>
{
    public async Task<List<ProductDto>> Handle(GetSimilarProductsQuery request, CancellationToken ct)
    {
        var categoryId = await db.Products
            .Where(p => p.Id == request.ProductId)
            .Select(p => p.CategoryId)
            .FirstOrDefaultAsync(ct);

        if (categoryId == Guid.Empty)
            return [];

        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .Where(p => p.CategoryId == categoryId
                && p.Id != request.ProductId
                && p.IsActive
                && !p.IsDeleted
                && p.Variants.Any(v => v.IsActive))
            .OrderByDescending(p => p.Variants
                .Where(v => v.IsActive && v.DiscountPrice.HasValue)
                .Any())
            .ThenBy(p => p.Name)
            .Take(request.Limit)
            .ToListAsync(ct);

        return products.Select(GetProductsQueryHandler.MapToDto).ToList();
    }
}
