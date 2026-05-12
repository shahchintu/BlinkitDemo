using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Blinkit.Application.Products.Queries;

public class GetCategoriesQueryHandler(IBlinkitDbContext db, IDistributedCache cache)
    : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    private const string CacheKey = "categories:all:v2";

    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken ct)
    {
        var cached = await cache.GetStringAsync(CacheKey, ct);
        if (cached is not null)
            return JsonSerializer.Deserialize<List<CategoryDto>>(cached) ?? [];

        var categories = await db.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .AsNoTracking()
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.IconUrl, c.DisplayOrder,
                c.Products.Count(p => p.IsActive)))
            .ToListAsync(ct);

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
        };
        await cache.SetStringAsync(CacheKey, JsonSerializer.Serialize(categories), options, ct);

        return categories;
    }
}
