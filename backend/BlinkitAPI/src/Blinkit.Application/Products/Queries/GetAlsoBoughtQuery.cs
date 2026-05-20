using Blinkit.Application.Products.DTOs;
using MediatR;

namespace Blinkit.Application.Products.Queries;

public record GetAlsoBoughtQuery(Guid ProductId, int Limit = 10) : IRequest<List<ProductDto>>;
