using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using Blinkit.Application.Cart.Commands;

namespace Blinkit.Application.Cart.Queries;

public record GetSharedCartQuery(string Token) : IRequest<List<SharedCartItemDto>?>;

public class GetSharedCartQueryHandler(IDistributedCache cache) : IRequestHandler<GetSharedCartQuery, List<SharedCartItemDto>?>
{
    public async Task<List<SharedCartItemDto>?> Handle(GetSharedCartQuery request, CancellationToken ct)
    {
        var json = await cache.GetStringAsync($"cart:share:{request.Token}", ct);
        if (json is null) return null;
        return JsonSerializer.Deserialize<List<SharedCartItemDto>>(json);
    }
}
