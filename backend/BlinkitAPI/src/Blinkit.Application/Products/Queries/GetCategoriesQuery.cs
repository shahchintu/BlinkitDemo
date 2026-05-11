using Blinkit.Application.Products.DTOs;
using MediatR;

namespace Blinkit.Application.Products.Queries;

public record GetCategoriesQuery : IRequest<List<CategoryDto>>;
