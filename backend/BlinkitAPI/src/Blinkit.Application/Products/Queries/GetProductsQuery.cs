using Blinkit.Application.Common;
using Blinkit.Application.Products.DTOs;
using MediatR;

namespace Blinkit.Application.Products.Queries;

public record GetProductsQuery(
    string? Search,
    Guid? CategoryId,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<ProductDto>>;
