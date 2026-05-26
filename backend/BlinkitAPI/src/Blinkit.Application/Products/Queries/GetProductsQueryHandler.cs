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
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder).ThenBy(v => v.DiscountPrice ?? v.Price))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .Where(p => !p.IsDeleted && p.IsActive && p.Variants.Any(v => v.IsActive))
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Name.Contains(request.Search));

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        if (request.MinPrice > 0 || request.MaxPrice < 999999)
            query = query.Where(p => p.Variants
                .Where(v => v.IsActive)
                .OrderBy(v => v.DisplayOrder)
                .ThenBy(v => v.DiscountPrice ?? v.Price)
                .Select(v => v.DiscountPrice ?? v.Price)
                .FirstOrDefault() >= request.MinPrice &&
                p.Variants
                .Where(v => v.IsActive)
                .OrderBy(v => v.DisplayOrder)
                .ThenBy(v => v.DiscountPrice ?? v.Price)
                .Select(v => v.DiscountPrice ?? v.Price)
                .FirstOrDefault() <= request.MaxPrice);

        // EF Core cannot translate a nested OrderBy inside a correlated subquery used as a sort key.
        // Use Min/Max aggregates instead — these translate cleanly to SQL MIN(...) / MAX(...).
        query = request.SortBy switch
        {
            "price_asc" => query.OrderBy(p =>
                p.Variants
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.DisplayOrder)
                    .ThenBy(v => v.DiscountPrice ?? v.Price)
                    .Select(v => v.DiscountPrice ?? v.Price)
                    .FirstOrDefault()),

            "price_desc" => query.OrderByDescending(p =>
                p.Variants
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.DisplayOrder)
                    .ThenBy(v => v.DiscountPrice ?? v.Price)
                    .Select(v => v.DiscountPrice ?? v.Price)
                    .FirstOrDefault()),

            "name_asc" => query.OrderBy(p => p.Name),

            "discount" => query.OrderByDescending(p =>
                p.Variants
                    .Where(v => v.IsActive && v.DiscountPrice.HasValue)
                    .OrderBy(v => v.DisplayOrder)
                    .ThenBy(v => v.DiscountPrice ?? v.Price)
                    .Select(v => (v.Price - v.DiscountPrice!.Value) / v.Price * 100)
                    .FirstOrDefault()),

            _ => query.OrderBy(p => p.Name)
        };

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        var products = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = products.Select(MapToDto).ToList();
        return new PagedResult<ProductDto>(dtos, totalCount, request.Page, request.PageSize, totalPages);
    }

    public static ProductDto MapToDto(Domain.Entities.Product p)
    {
        var firstImageUrl = p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? string.Empty;

        var variants = p.Variants
            .OrderBy(v => v.DisplayOrder)
            .ThenBy(v => v.DiscountPrice ?? v.Price)
            .Select((v, i) => new ProductVariantDto(
                v.Id, v.Unit, v.Price, v.DiscountPrice, v.StockQty,
                string.IsNullOrEmpty(v.ImageUrl) ? firstImageUrl : v.ImageUrl,
                v.DisplayOrder,
                ImageType(string.IsNullOrEmpty(v.ImageUrl) ? firstImageUrl : v.ImageUrl)))
            .ToList();

        var defaultVariant = variants.FirstOrDefault()
            ?? new ProductVariantDto(Guid.Empty, string.Empty, 0, null, 0, string.Empty, 0, "url");

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
            HasVariants: variants.Count > 1,
            ImageType: ImageType(p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? string.Empty)
        );
    }

    private static string ImageType(string imageUrl) =>
        imageUrl.Contains("/uploads/") ? "uploaded" : "url";
}
