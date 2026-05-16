using System.Text.Json;
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
    private const string UnsplashBaseUrl = "https://api.unsplash.com/search/photos";
    private const string PexelsBaseUrl   = "https://api.pexels.com/v1/search";

    private static readonly DistributedCacheEntryOptions CacheTtl = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(48),
    };

    private static readonly Dictionary<string, string> CategoryQueries = new()
    {
        { "Fruits & Vegetables", "fresh colorful vegetables fruits market" },
        { "Dairy & Eggs",        "dairy products milk eggs fresh" },
        { "Snacks",              "snacks chips crackers variety" },
        { "Beverages",           "beverages drinks bottles colorful" },
        { "Bakery",              "fresh bakery bread pastry" },
        { "Meat & Fish",         "fresh fish seafood market" },
        { "Personal Care",       "personal care products bathroom" },
        { "Household",           "household cleaning products" },
        { "Baby Care",           "baby care products gentle" },
        { "Pet Care",            "pet food dog cat supplies" },
        { "Pharma & Wellness",   "medicine health pharmacy" },
        { "Beauty & Skin",       "beauty products cosmetics skincare" },
        { "Frozen Foods",        "frozen food packaging ice" },
        { "Breakfast & Cereals", "breakfast cereal bowl morning" },
        { "Electronics",         "electronics accessories gadgets" },
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

        // 1. Try Pexels (primary)
        var pexelsKey = configuration["Pexels:ApiKey"];
        if (!string.IsNullOrWhiteSpace(pexelsKey))
        {
            try
            {
                var url = await FetchFromPexelsAsync(query, seed, pexelsKey);
                if (url is not null)
                {
                    await TryCacheAsync(cacheKey, url);
                    return url;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Pexels API call failed for query '{Query}'", query);
            }
        }

        // 2. Try Unsplash (secondary)
        var accessKey = configuration["Unsplash:AccessKey"];
        if (!string.IsNullOrWhiteSpace(accessKey))
        {
            try
            {
                var url = await FetchFromUnsplashAsync(query, seed, perPage: 10);
                if (url is not null)
                {
                    await TryCacheAsync(cacheKey, url);
                    return url;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Unsplash API call failed for query '{Query}'", query);
            }
        }

        // 3. DummyJSON fallback
        return GetFallback(query);
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

        // 1. Try Pexels (primary)
        var pexelsKey = configuration["Pexels:ApiKey"];
        if (!string.IsNullOrWhiteSpace(pexelsKey))
        {
            try
            {
                var urls = await FetchGalleryFromPexelsAsync(query, seed, count, pexelsKey);
                if (urls.Count > 0)
                {
                    await TryCacheAsync(cacheKey, JsonSerializer.Serialize(urls));
                    return urls;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Pexels gallery call failed for query '{Query}'", query);
            }
        }

        // 2. Try Unsplash (secondary)
        var accessKey = configuration["Unsplash:AccessKey"];
        if (!string.IsNullOrWhiteSpace(accessKey))
        {
            try
            {
                var results = await FetchUnsplashResultsAsync(query, perPage: 30);
                if (results.Count > 0)
                {
                    var baseIndex = Math.Abs(seed.GetHashCode());
                    var urls = Enumerable.Range(0, count)
                        .Select(i => results[(baseIndex + i) % results.Count].Urls.Regular)
                        .ToList();
                    await TryCacheAsync(cacheKey, JsonSerializer.Serialize(urls));
                    return urls;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Unsplash gallery call failed for query '{Query}'", query);
            }
        }

        // 3. DummyJSON fallback
        return Enumerable.Range(0, count).Select(_ => GetFallback(query)).ToList();
    }

    public Task<string> GetCategoryImageUrlAsync(string categoryName, string seed)
    {
        var q = CategoryQueries.GetValueOrDefault(categoryName, categoryName);
        return GetImageUrlAsync(q, seed);
    }

    // ── Pexels ────────────────────────────────────────────────────────────────

    private async Task<string?> FetchFromPexelsAsync(string query, string seed, string apiKey)
    {
        var photos = await FetchPexelsPhotosAsync(query, perPage: 15, apiKey);
        if (photos.Count == 0) return null;
        var index = Math.Abs(seed.GetHashCode()) % photos.Count;
        return photos[index].Src.Medium;
    }

    private async Task<List<string>> FetchGalleryFromPexelsAsync(
        string query, string seed, int count, string apiKey)
    {
        var photos = await FetchPexelsPhotosAsync(query, perPage: 30, apiKey);
        if (photos.Count == 0) return [];
        var baseIndex = Math.Abs(seed.GetHashCode());
        return Enumerable.Range(0, count)
            .Select(i => photos[(baseIndex + i) % photos.Count].Src.Medium)
            .ToList();
    }

    private async Task<List<PexelsPhoto>> FetchPexelsPhotosAsync(
        string query, int perPage, string apiKey)
    {
        var client = httpClientFactory.CreateClient("Pexels");
        var requestUrl =
            $"{PexelsBaseUrl}?query={Uri.EscapeDataString(query)}&per_page={perPage}&orientation=square";

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Add("Authorization", apiKey);

        using var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) return [];

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PexelsSearchResult>(json, JsonOptions);
        return result?.Photos ?? [];
    }

    // ── Unsplash ───────────────────────────────────────────────────────────────

    private async Task<string?> FetchFromUnsplashAsync(string query, string seed, int perPage)
    {
        var results = await FetchUnsplashResultsAsync(query, perPage);
        if (results.Count == 0) return null;
        var index = Math.Abs(seed.GetHashCode()) % results.Count;
        return results[index].Urls.Regular;
    }

    private async Task<List<UnsplashPhoto>> FetchUnsplashResultsAsync(string query, int perPage)
    {
        var accessKey = configuration["Unsplash:AccessKey"]!;
        var client = httpClientFactory.CreateClient("Unsplash");
        var requestUrl =
            $"{UnsplashBaseUrl}?query={Uri.EscapeDataString(query)}&per_page={perPage}&orientation=squarish";

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Add("Authorization", $"Client-ID {accessKey}");

        using var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) return [];

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<UnsplashSearchResult>(json, JsonOptions);
        return result?.Results ?? [];
    }

    // ── Cache helper ───────────────────────────────────────────────────────────

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

    // ── Pexels models ──────────────────────────────────────────────────────────

    private sealed class PexelsSearchResult
    {
        public List<PexelsPhoto> Photos { get; set; } = [];
    }

    private sealed class PexelsPhoto
    {
        public PexelsSrc Src { get; set; } = new();
    }

    private sealed class PexelsSrc
    {
        public string Medium { get; set; } = string.Empty;
    }

    // ── Unsplash models ────────────────────────────────────────────────────────

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
