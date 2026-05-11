using Blinkit.Application.Products.DTOs;
using MediatR;

namespace Blinkit.Application.Products.Queries;

public record GetRelatedProductsQuery(Guid ProductId, int Limit = 12) : IRequest<List<ProductDto>>;
