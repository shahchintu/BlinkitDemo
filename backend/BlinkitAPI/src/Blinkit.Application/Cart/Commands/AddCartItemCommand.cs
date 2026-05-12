using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using MediatR;

namespace Blinkit.Application.Cart.Commands;

public record AddCartItemCommand(Guid UserId, Guid ProductId, Guid VariantId, int Quantity) : IRequest<CartDto>;

public class AddCartItemCommandHandler(IRedisCartService cartService) : IRequestHandler<AddCartItemCommand, CartDto>
{
    public Task<CartDto> Handle(AddCartItemCommand request, CancellationToken cancellationToken)
        => cartService.AddItemAsync(request.UserId, request.ProductId, request.VariantId, request.Quantity);
}
