using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Blinkit.Application.Cart.Commands;

public record SharedCartItemDto(
    string ProductId,
    string ProductName,
    string VariantId,
    string VariantUnit,
    string ImageUrl,
    int Quantity,
    decimal UnitPrice);

public record ShareCartResult(string Token, string ShareUrl);

public record ShareCartCommand(List<SharedCartItemDto> Items) : IRequest<ShareCartResult>;

public class ShareCartCommandHandler(IDistributedCache cache) : IRequestHandler<ShareCartCommand, ShareCartResult>
{
    public async Task<ShareCartResult> Handle(ShareCartCommand request, CancellationToken ct)
    {
        var token = Guid.NewGuid().ToString("N")[..8];
        var json = JsonSerializer.Serialize(request.Items);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7)
        };
        await cache.SetStringAsync($"cart:share:{token}", json, options, ct);
        return new ShareCartResult(token, $"http://localhost:4200/?cartShare={token}");
    }
}
