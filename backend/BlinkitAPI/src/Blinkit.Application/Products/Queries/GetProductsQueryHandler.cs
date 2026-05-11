using Blinkit.Application.Common;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetProductsQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken ct)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Name.Contains(request.Search));

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        var products = await query
            .OrderBy(p => p.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = products.Select(MapToDto).ToList();
        return new PagedResult<ProductDto>(dtos, totalCount, request.Page, request.PageSize, totalPages);
    }

    internal static ProductDto MapToDto(Domain.Entities.Product p)
    {
        var firstImageUrl = p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? string.Empty;

        var variants = p.Variants
            .OrderBy(v => v.DisplayOrder)
            .Select((v, i) => new ProductVariantDto(
                v.Id, v.Unit, v.Price, v.DiscountPrice, v.StockQty,
                string.IsNullOrEmpty(v.ImageUrl) ? firstImageUrl : v.ImageUrl,
                v.DisplayOrder))
            .ToList();

        var defaultVariant = variants.FirstOrDefault()
            ?? new ProductVariantDto(Guid.Empty, string.Empty, 0, null, 0, string.Empty, 0);

        return new ProductDto(
            Id: p.Id,
            CategoryId: p.CategoryId,
            CategoryName: p.Category?.Name ?? string.Empty,
            Name: p.Name,
            Slug: p.Slug,
            Description: p.Description,
            IsActive: p.IsActive,
            DefaultVariant: defaultVariant,
            Variants: variants,
            Attributes: p.Attributes
                .OrderBy(a => a.DisplayOrder)
                .Select(a => new ProductAttributeDto(a.Key, a.Value))
                .ToList(),
            RelatedTags: p.Tags.Select(t => t.Tag).ToList(),
            Images: p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
            HasVariants: variants.Count > 1
        );
    }
}
