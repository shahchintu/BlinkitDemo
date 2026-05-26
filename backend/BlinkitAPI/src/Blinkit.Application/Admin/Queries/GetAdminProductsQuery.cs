using Blinkit.Application.Common;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Admin.Queries;

public record GetAdminProductsQuery(
    int Page, int PageSize, string? Search, Guid? CategoryId, bool ActiveOnly)
    : IRequest<PagedResult<ProductDto>>;

public class GetAdminProductsQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetAdminProductsQuery, PagedResult<ProductDto>>
{
    public async Task<PagedResult<ProductDto>> Handle(GetAdminProductsQuery req, CancellationToken ct)
    {
        var query = db.Products
            .Include(p => p.Variants)
            .Include(p => p.Attributes)
            .Include(p => p.Tags)
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Where(p => !p.IsDeleted)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Search))
            query = query.Where(p => p.Name.ToLower().Contains(req.Search.ToLower()));
        if (req.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == req.CategoryId.Value);
        if (req.ActiveOnly)
            query = query.Where(p => p.IsActive);

        var total = await query.CountAsync(ct);
        var products = await query
            .OrderBy(p => p.Name)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var dtos = products.Select(p =>
        {
            var sortedVariants = p.Variants.OrderBy(v => v.DisplayOrder).ToList();
            var defaultVariant = sortedVariants.FirstOrDefault(v => v.IsActive) ?? sortedVariants.FirstOrDefault();
            var defDto = defaultVariant is null ? null : new ProductVariantDto(
                defaultVariant.Id, defaultVariant.Unit, defaultVariant.Price,
                defaultVariant.DiscountPrice, defaultVariant.StockQty,
                defaultVariant.ImageUrl, defaultVariant.DisplayOrder,
                ImageType(defaultVariant.ImageUrl));

            return new ProductDto(
                p.Id, p.CategoryId, p.Category?.Name ?? string.Empty, p.Name, p.Slug,
                p.Description, p.IsActive,
                defDto!,
                sortedVariants.Select(v => new ProductVariantDto(
                    v.Id, v.Unit, v.Price, v.DiscountPrice, v.StockQty, v.ImageUrl, v.DisplayOrder,
                    ImageType(v.ImageUrl))).ToList(),
                p.Attributes.Select(a => new ProductAttributeDto(a.Key, a.Value)).ToList(),
                p.Tags.Select(t => t.Tag).ToList(),
                p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
                sortedVariants.Count > 1,
                ImageType(p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? string.Empty)
            );
        }).ToList();

        var totalPages = (int)Math.Ceiling(total / (double)req.PageSize);
        return new PagedResult<ProductDto>(dtos, total, req.Page, req.PageSize, totalPages);
    }

    private static string ImageType(string imageUrl) =>
        imageUrl.Contains("/uploads/") ? "uploaded" : "url";
}
