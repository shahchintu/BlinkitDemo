using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using MediatR;

namespace Blinkit.Application.Cart.Queries;

public record GetCartQuery(Guid UserId) : IRequest<CartDto>;

public class GetCartQueryHandler(IRedisCartService cartService) : IRequestHandler<GetCartQuery, CartDto>
{
    public Task<CartDto> Handle(GetCartQuery request, CancellationToken cancellationToken)
        => cartService.GetCartAsync(request.UserId);
}
