using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using MediatR;

namespace Blinkit.Application.Cart.Commands;

public record MergeCartCommand(Guid UserId, IReadOnlyList<MergeItemRequest> Items) : IRequest<CartDto>;

public class MergeCartCommandHandler(IRedisCartService cartService) : IRequestHandler<MergeCartCommand, CartDto>
{
    public Task<CartDto> Handle(MergeCartCommand request, CancellationToken cancellationToken)
        => cartService.MergeItemsAsync(request.UserId, request.Items);
}
