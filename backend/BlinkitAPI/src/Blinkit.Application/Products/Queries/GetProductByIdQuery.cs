using Blinkit.Application.Products.DTOs;
using MediatR;

namespace Blinkit.Application.Products.Queries;

public record GetProductByIdQuery(Guid Id) : IRequest<ProductDto>;
