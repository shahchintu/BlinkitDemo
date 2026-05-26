using Microsoft.AspNetCore.Http;

namespace Blinkit.Application.Interfaces;

public interface IImageUploadService
{
    Task<string> UploadProductImageAsync(IFormFile file, Guid productId);
    Task<string> UploadCategoryImageAsync(IFormFile file, Guid categoryId);
    Task<bool> DeleteImageAsync(string imageUrl);
    bool IsValidImage(IFormFile file);
    string GetImageUrl(HttpRequest request, string relativePath);
}
