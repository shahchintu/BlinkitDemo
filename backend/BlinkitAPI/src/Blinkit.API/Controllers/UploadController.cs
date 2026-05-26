using Blinkit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/upload")]
[Authorize(Policy = "AdminOnly")]
public sealed class UploadController(IImageUploadService uploadService) : ControllerBase
{
    [HttpPost("product/{productId:guid}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadProductImage(Guid productId, IFormFile file)
    {
        if (!uploadService.IsValidImage(file))
            return BadRequest(new { message = "Invalid file. Use JPG/PNG/WebP, max 5 MB." });

        var relativePath = await uploadService.UploadProductImageAsync(file, productId);
        var fullUrl      = uploadService.GetImageUrl(Request, relativePath);

        return Ok(new { url = fullUrl, relativePath });
    }

    [HttpPost("category/{categoryId:guid}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCategoryImage(Guid categoryId, IFormFile file)
    {
        if (!uploadService.IsValidImage(file))
            return BadRequest(new { message = "Invalid file. Use JPG/PNG/WebP, max 5 MB." });

        var relativePath = await uploadService.UploadCategoryImageAsync(file, categoryId);
        var fullUrl      = uploadService.GetImageUrl(Request, relativePath);

        return Ok(new { url = fullUrl, relativePath });
    }

    [HttpPost("product/variant/{variantId:guid}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadVariantImage(Guid variantId, IFormFile file)
    {
        if (!uploadService.IsValidImage(file))
            return BadRequest(new { message = "Invalid file. Use JPG/PNG/WebP, max 5 MB." });

        // Variants share the products/ folder — use variantId as the productId
        var relativePath = await uploadService.UploadProductImageAsync(file, variantId);
        var fullUrl      = uploadService.GetImageUrl(Request, relativePath);

        return Ok(new { url = fullUrl, relativePath });
    }

    [HttpDelete("image")]
    public async Task<IActionResult> DeleteImage([FromQuery] string imageUrl)
    {
        if (!imageUrl.Contains("/uploads/"))
            return BadRequest(new { message = "Can only delete uploaded images, not external URLs." });

        var deleted = await uploadService.DeleteImageAsync(imageUrl);
        return Ok(new { deleted });
    }
}
