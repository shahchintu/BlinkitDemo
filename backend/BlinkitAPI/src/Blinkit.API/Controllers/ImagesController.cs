using Blinkit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController, Route("api/images"), AllowAnonymous]
public sealed class ImagesController(IUnsplashService unsplash) : ControllerBase
{
    [HttpGet("product")]
    public async Task<IActionResult> GetProductImage(
        [FromQuery] string name = "",
        [FromQuery] string category = "",
        [FromQuery] string seed = "default")
    {
        var query = $"{name} {category} product food";
        var url = await unsplash.GetImageUrlAsync(query, seed);
        return Ok(new { url });
    }

    [HttpGet("gallery")]
    public async Task<IActionResult> GetGallery(
        [FromQuery] string name = "",
        [FromQuery] string category = "",
        [FromQuery] string seed = "default",
        [FromQuery] int count = 4)
    {
        var query = $"{name} {category} food";
        var urls = await unsplash.GetGalleryUrlsAsync(query, seed, count);
        return Ok(new { urls });
    }

    [HttpGet("category")]
    public async Task<IActionResult> GetCategoryImage(
        [FromQuery] string name = "",
        [FromQuery] string seed = "default")
    {
        var url = await unsplash.GetCategoryImageUrlAsync(name, seed);
        return Ok(new { url });
    }
}
