using Blinkit.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Blinkit.Infrastructure.Services;

public sealed class ImageUploadService(
    IWebHostEnvironment env,
    ILogger<ImageUploadService> logger) : IImageUploadService
{
    private static readonly string[] AllowedTypes =
        ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    public bool IsValidImage(IFormFile file)
    {
        if (file is null || file.Length == 0) return false;
        if (file.Length > MaxFileSize) return false;
        if (!AllowedTypes.Contains(file.ContentType.ToLowerInvariant())) return false;
        return true;
    }

    public async Task<string> UploadProductImageAsync(IFormFile file, Guid productId)
    {
        var folder = Path.Combine(env.WebRootPath, "uploads", "products");
        Directory.CreateDirectory(folder);

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"product_{productId}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/products/{fileName}";
    }

    public async Task<string> UploadCategoryImageAsync(IFormFile file, Guid categoryId)
    {
        var folder = Path.Combine(env.WebRootPath, "uploads", "categories");
        Directory.CreateDirectory(folder);

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"category_{categoryId}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/categories/{fileName}";
    }

    public Task<bool> DeleteImageAsync(string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl) || !imageUrl.Contains("/uploads/"))
                return Task.FromResult(false);

            // Extract the path segment after the host when given an absolute URL
            var relativePart = imageUrl.Contains("://")
                ? "/" + string.Join("/", imageUrl.Split('/').Skip(3))
                : imageUrl;

            if (!relativePart.StartsWith("/uploads/"))
                return Task.FromResult(false);

            var filePath = Path.Combine(
                env.WebRootPath,
                relativePart.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (!File.Exists(filePath))
                return Task.FromResult(false);

            File.Delete(filePath);
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to delete image: {Url}", imageUrl);
            return Task.FromResult(false);
        }
    }

    public string GetImageUrl(HttpRequest request, string relativePath)
    {
        if (string.IsNullOrEmpty(relativePath))
            return relativePath;

        // Already absolute — CDN / Unsplash / Pexels / picsum
        if (relativePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            relativePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return relativePath;

        // Relative upload path → make absolute
        if (relativePath.StartsWith("/uploads/"))
            return $"{request.Scheme}://{request.Host}{relativePath}";

        return relativePath;
    }
}
