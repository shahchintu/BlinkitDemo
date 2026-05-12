using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using MediatR;

namespace Blinkit.Application.Cart.Commands;

public record UpdateCartItemQuantityCommand(Guid UserId, Guid CartItemId, int Quantity) : IRequest<CartDto>;

public class UpdateCartItemQuantityCommandHandler(IRedisCartService cartService) : IRequestHandler<UpdateCartItemQuantityCommand, CartDto>
{
    public Task<CartDto> Handle(UpdateCartItemQuantityCommand request, CancellationToken cancellationToken)
        => cartService.UpdateItemAsync(request.UserId, request.CartItemId, request.Quantity);
}
