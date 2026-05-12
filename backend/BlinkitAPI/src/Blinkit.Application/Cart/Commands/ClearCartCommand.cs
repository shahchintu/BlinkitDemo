using Blinkit.Application.Interfaces;
using MediatR;

namespace Blinkit.Application.Cart.Commands;

public record ClearCartCommand(Guid UserId) : IRequest;

public class ClearCartCommandHandler(IRedisCartService cartService) : IRequestHandler<ClearCartCommand>
{
    public Task Handle(ClearCartCommand request, CancellationToken cancellationToken)
        => cartService.ClearAsync(request.UserId);
}
