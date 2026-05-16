using Blinkit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;

namespace Blinkit.API.Controllers;

[ApiController, Route("api/images")]
public sealed class ImagesController(IUnsplashService unsplash, IConnectionMultiplexer redis) : ControllerBase
{
    [HttpGet("product"), AllowAnonymous]
    public async Task<IActionResult> GetProductImage(
        [FromQuery] string name = "",
        [FromQuery] string category = "",
        [FromQuery] string seed = "default")
    {
        var query = BuildSearchQuery(name, category);
        var url = await unsplash.GetImageUrlAsync(query, seed);
        return Ok(new { url });
    }

    [HttpGet("gallery"), AllowAnonymous]
    public async Task<IActionResult> GetGallery(
        [FromQuery] string name = "",
        [FromQuery] string category = "",
        [FromQuery] string seed = "default",
        [FromQuery] int count = 4)
    {
        var query = BuildSearchQuery(name, category);
        var urls = await unsplash.GetGalleryUrlsAsync(query, seed, count);
        return Ok(new { urls });
    }

    [HttpGet("category"), AllowAnonymous]
    public async Task<IActionResult> GetCategoryImage(
        [FromQuery] string name = "",
        [FromQuery] string seed = "default")
    {
        var url = await unsplash.GetCategoryImageUrlAsync(name, seed);
        return Ok(new { url });
    }

    [HttpDelete("cache"), Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ClearImageCache()
    {
        var server = redis.GetServer(redis.GetEndPoints()[0]);
        var keys = server.Keys(pattern: "unsplash:*").ToArray();
        if (keys.Length > 0)
            await redis.GetDatabase().KeyDeleteAsync(keys);
        return Ok(new { cleared = true, message = $"Image cache cleared ({keys.Length} keys)" });
    }

    private static string BuildSearchQuery(string productName, string category)
    {
        var clean = productName
            .Replace("Amul", "",      StringComparison.OrdinalIgnoreCase)
            .Replace("Britannia", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Parle", "",     StringComparison.OrdinalIgnoreCase)
            .Replace("Nestle", "",    StringComparison.OrdinalIgnoreCase)
            .Replace("Haldiram", "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Lay's", "",     StringComparison.OrdinalIgnoreCase)
            .Replace("Bingo", "",     StringComparison.OrdinalIgnoreCase)
            .Replace("Kurkure", "",   StringComparison.OrdinalIgnoreCase)
            .Trim();

        if (Contains(clean, "Milk") || Contains(clean, "Toned"))   return "fresh milk glass bottle white";
        if (Contains(clean, "Butter"))                              return "butter yellow creamy dairy";
        if (Contains(clean, "Paneer"))                              return "paneer cottage cheese Indian";
        if (Contains(clean, "Curd") || Contains(clean, "Dahi"))    return "curd yogurt white bowl";
        if (Contains(clean, "Chips") || Contains(clean, "Crisps")) return "potato chips snack crispy";
        if (Contains(clean, "Bread"))                               return "fresh bread loaf bakery";
        if (Contains(clean, "Egg"))                                 return "fresh eggs brown white";
        if (Contains(clean, "Rice"))                                return "white rice grains basmati";
        if (Contains(clean, "Atta") || Contains(clean, "Flour"))   return "wheat flour atta";
        if (Contains(clean, "Oil"))                                 return "cooking oil bottle kitchen";
        if (Contains(clean, "Biscuit") || Contains(clean, "Cookie")) return "biscuits cookies snack";
        if (Contains(clean, "Juice"))                               return "fresh juice glass fruit";
        if (Contains(clean, "Water"))                               return "mineral water bottle clear";
        if (Contains(clean, "Cola") || Contains(clean, "Soft Drink")) return "cola cold drink bottle";
        if (Contains(clean, "Chocolate"))                           return "chocolate bar dark sweet";
        if (Contains(clean, "Coffee"))                              return "coffee beans cup";
        if (Contains(clean, "Tea"))                                 return "tea cup leaves warm";
        if (Contains(clean, "Soap"))                                return "soap bar bathroom clean";
        if (Contains(clean, "Shampoo"))                             return "shampoo bottle hair care";
        if (Contains(clean, "Toothpaste"))                          return "toothpaste tube mint";
        if (Contains(clean, "Diaper") || Contains(clean, "Pamper")) return "baby diaper soft white";
        if (Contains(clean, "Dog") || Contains(clean, "Cat"))      return "pet food bowl dog cat";

        return $"{category} {clean} food product".Trim();
    }

    private static bool Contains(string source, string value) =>
        source.Contains(value, StringComparison.OrdinalIgnoreCase);
}
