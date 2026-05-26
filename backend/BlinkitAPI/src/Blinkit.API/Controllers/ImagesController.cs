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
            .Replace("Amul",      "", StringComparison.OrdinalIgnoreCase)
            .Replace("Britannia", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Parle",     "", StringComparison.OrdinalIgnoreCase)
            .Replace("Nestle",    "", StringComparison.OrdinalIgnoreCase)
            .Replace("Haldiram", "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Lay's",    "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Bingo",    "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Kurkure",  "",  StringComparison.OrdinalIgnoreCase)
            // Indian spice/oil/FMCG brands — must be stripped BEFORE keyword checks
            // to avoid partial matches (e.g. "Catch" → Contains("Cat") = true)
            .Replace("Catch",    "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Everest",  "",  StringComparison.OrdinalIgnoreCase)
            .Replace("MDH",      "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Tata",     "",  StringComparison.OrdinalIgnoreCase)
            .Replace("ITC",      "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Dabur",    "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Patanjali","",  StringComparison.OrdinalIgnoreCase)
            .Replace("Fortune",  "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Aashirvaad","", StringComparison.OrdinalIgnoreCase)
            .Replace("Saffola",  "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Marico",   "",  StringComparison.OrdinalIgnoreCase)
            .Replace("Sundrop",  "",  StringComparison.OrdinalIgnoreCase)
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
        // Pet food check — only after all brand names are stripped
        if (Contains(clean, " Dog ") || Contains(clean, " Cat ") ||
            clean.EndsWith(" Dog",  StringComparison.OrdinalIgnoreCase) ||
            clean.EndsWith(" Cat",  StringComparison.OrdinalIgnoreCase) ||
            clean.StartsWith("Dog ", StringComparison.OrdinalIgnoreCase) ||
            clean.StartsWith("Cat ", StringComparison.OrdinalIgnoreCase))
            return "pet food bowl dog cat";

        // Spices & masalas — Masala, Oil & More category
        if (Contains(clean, "Chilli") || Contains(clean, "Chili"))  return "red chilli powder spice bowl";
        if (Contains(clean, "Turmeric") || Contains(clean, "Haldi")) return "turmeric powder yellow spice";
        if (Contains(clean, "Pepper") || Contains(clean, "Mirch"))  return "black pepper spice grinder";
        if (Contains(clean, "Cumin") || Contains(clean, "Jeera"))   return "cumin seeds spice Indian";
        if (Contains(clean, "Coriander") || Contains(clean, "Dhaniya")) return "coriander powder spice";
        if (Contains(clean, "Cardamom") || Contains(clean, "Elaichi")) return "green cardamom spice pods";
        if (Contains(clean, "Clove") || Contains(clean, "Laung"))   return "cloves spice dried aromatic";
        if (Contains(clean, "Cinnamon") || Contains(clean, "Dalchini")) return "cinnamon sticks spice";
        if (Contains(clean, "Masala"))                               return "Indian spice masala powder mix";
        if (Contains(clean, "Mustard") || Contains(clean, "Sarson")) return "mustard seeds yellow spice";
        if (Contains(clean, "Fenugreek") || Contains(clean, "Methi")) return "fenugreek seeds spice";
        if (Contains(clean, "Saffron") || Contains(clean, "Kesar")) return "saffron threads golden spice";
        if (Contains(clean, "Vinegar"))                              return "vinegar bottle condiment";
        if (Contains(clean, "Salt"))                                 return "salt white crystals bowl";
        if (Contains(clean, "Sugar"))                                return "sugar white crystals bowl";

        return $"{category} {clean} food product".Trim();
    }

    private static bool Contains(string source, string value) =>
        source.Contains(value, StringComparison.OrdinalIgnoreCase);
}
