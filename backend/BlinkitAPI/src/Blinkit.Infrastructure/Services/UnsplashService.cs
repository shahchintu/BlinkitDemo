using System.Text.Json;
using System.Text.Json.Serialization;
using Blinkit.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Blinkit.Infrastructure.Services;

public class UnsplashService(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    IDistributedCache cache,
    ILogger<UnsplashService> logger) : IUnsplashService
{
    private const string BaseUrl = "https://api.unsplash.com/search/photos";

    private static readonly DistributedCacheEntryOptions CacheTtl = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(48),
    };

    private static readonly Dictionary<string, string> CategoryQueries = new()
    {
        { "Fruits & Vegetables", "fresh fruits vegetables colorful" },
        { "Dairy & Eggs",        "milk dairy eggs fresh" },
        { "Snacks",              "chips snacks crisps" },
        { "Beverages",           "cold drinks beverage bottle" },
        { "Bakery",              "fresh bread bakery baked" },
        { "Meat & Fish",         "fresh meat chicken fish" },
        { "Personal Care",       "shampoo soap personal care" },
        { "Household",           "cleaning products household" },
        { "Baby Care",           "baby products care soft" },
        { "Pet Care",            "dog cat pet food" },
        { "Pharma & Wellness",   "medicine pharmacy health" },
        { "Beauty & Skin",       "beauty skincare cosmetics" },
        { "Frozen Foods",        "frozen food ice cream" },
        { "Breakfast & Cereals", "cereal oats breakfast" },
        { "Electronics",         "electronics gadgets tech" },
    };

    private static readonly Dictionary<string, string> FallbackColors = new()
    {
        { "Fruits",      "4CAF50" },
        { "Dairy",       "FFC107" },
        { "Snacks",      "FF9800" },
        { "Beverages",   "2196F3" },
        { "Bakery",      "795548" },
        { "Meat",        "F44336" },
        { "Personal",    "E91E63" },
        { "Household",   "607D8B" },
        { "Baby",        "F8BBD9" },
        { "Pet",         "8D6E63" },
        { "Pharma",      "00BCD4" },
        { "Beauty",      "9C27B0" },
        { "Frozen",      "90CAF9" },
        { "Breakfast",   "FF8F00" },
        { "Electronics", "37474F" },
    };

    public async Task<string> GetImageUrlAsync(string query, string seed)
    {
        var cacheKey = $"unsplash:{seed}:{query}";

        try
        {
            var cached = await cache.GetStringAsync(cacheKey);
            if (cached is not null) return cached;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable for cache read");
        }

        var accessKey = configuration["Unsplash:AccessKey"];
        if (string.IsNullOrWhiteSpace(accessKey))
            return GetFallback(query);

        try
        {
            var url = await FetchFromUnsplashAsync(query, seed, perPage: 10);
            if (url is null) return GetFallback(query);

            await TryCacheAsync(cacheKey, url);
            return url;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unsplash API call failed for query '{Query}'", query);
            return GetFallback(query);
        }
    }

    public async Task<List<string>> GetGalleryUrlsAsync(string query, string seed, int count)
    {
        var cacheKey = $"unsplash:gallery:{seed}:{count}";

        try
        {
            var cached = await cache.GetStringAsync(cacheKey);
            if (cached is not null)
                return JsonSerializer.Deserialize<List<string>>(cached) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable for gallery cache read");
        }

        var accessKey = configuration["Unsplash:AccessKey"];
        if (string.IsNullOrWhiteSpace(accessKey))
            return Enumerable.Range(0, count).Select(_ => GetFallback(query)).ToList();

        try
        {
            var results = await FetchResultsAsync(query, perPage: 30);
            if (results.Count == 0)
                return Enumerable.Range(0, count).Select(_ => GetFallback(query)).ToList();

            var baseIndex = Math.Abs(seed.GetHashCode());
            var urls = Enumerable.Range(0, count)
                .Select(i => results[(baseIndex + i) % results.Count].Urls.Regular)
                .ToList();

            await TryCacheAsync(cacheKey, JsonSerializer.Serialize(urls));
            return urls;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unsplash gallery call failed for query '{Query}'", query);
            return Enumerable.Range(0, count).Select(_ => GetFallback(query)).ToList();
        }
    }

    public Task<string> GetCategoryImageUrlAsync(string categoryName, string seed)
    {
        var q = CategoryQueries.GetValueOrDefault(categoryName, categoryName);
        return GetImageUrlAsync(q, seed);
    }

    private async Task<string?> FetchFromUnsplashAsync(string query, string seed, int perPage)
    {
        var results = await FetchResultsAsync(query, perPage);
        if (results.Count == 0) return null;

        var index = Math.Abs(seed.GetHashCode()) % results.Count;
        return results[index].Urls.Regular;
    }

    private async Task<List<UnsplashPhoto>> FetchResultsAsync(string query, int perPage)
    {
        var accessKey = configuration["Unsplash:AccessKey"]!;
        var client = httpClientFactory.CreateClient("Unsplash");
        var requestUrl = $"{BaseUrl}?query={Uri.EscapeDataString(query)}&per_page={perPage}&orientation=squarish";

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Add("Authorization", $"Client-ID {accessKey}");

        using var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) return [];

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<UnsplashSearchResult>(json, JsonOptions);
        return result?.Results ?? [];
    }

    private async Task TryCacheAsync(string key, string value)
    {
        try
        {
            await cache.SetStringAsync(key, value, CacheTtl);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable for cache write");
        }
    }

    private static string GetFallback(string category)
    {
        var color = FallbackColors
            .FirstOrDefault(k => category.Contains(k.Key, StringComparison.OrdinalIgnoreCase))
            .Value ?? "0C831F";
        var label = category.Length > 8 ? category[..8] : category;
        var text = Uri.EscapeDataString(label);
        return $"https://dummyjson.com/image/200x200/{color}/ffffff?text={text}";
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed class UnsplashSearchResult
    {
        public List<UnsplashPhoto> Results { get; set; } = [];
    }

    private sealed class UnsplashPhoto
    {
        public UnsplashUrls Urls { get; set; } = new();
    }

    private sealed class UnsplashUrls
    {
        public string Regular { get; set; } = string.Empty;
    }
}
