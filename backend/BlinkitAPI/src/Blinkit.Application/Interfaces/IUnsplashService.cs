namespace Blinkit.Application.Interfaces;

public interface IUnsplashService
{
    Task<string> GetImageUrlAsync(string query, string seed);
    Task<List<string>> GetGalleryUrlsAsync(string query, string seed, int count);
    Task<string> GetCategoryImageUrlAsync(string categoryName, string seed);
}
