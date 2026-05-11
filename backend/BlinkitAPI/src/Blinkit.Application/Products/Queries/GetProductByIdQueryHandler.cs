using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetProductByIdQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetProductByIdQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductByIdQuery request, CancellationToken ct)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.OrderBy(v => v.DisplayOrder))
            .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
            .Include(p => p.Tags)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Id, ct)
            ?? throw new KeyNotFoundException($"Product {request.Id} not found");

        return GetProductsQueryHandler.MapToDto(product);
    }
}
