using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using MediatR;

namespace Blinkit.Application.Cart.Commands;

public record RemoveCartItemCommand(Guid UserId, Guid CartItemId) : IRequest<CartDto>;

public class RemoveCartItemCommandHandler(IRedisCartService cartService) : IRequestHandler<RemoveCartItemCommand, CartDto>
{
    public Task<CartDto> Handle(RemoveCartItemCommand request, CancellationToken cancellationToken)
        => cartService.RemoveItemAsync(request.UserId, request.CartItemId);
}
