using Blinkit.Application.Admin.Commands;
using Blinkit.Application.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminProductsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null, [FromQuery] Guid? categoryId = null,
        [FromQuery] bool activeOnly = false, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetAdminProductsQuery(page, pageSize, search, categoryId, activeOnly), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new CreateProductCommand(
            req.Name, req.CategoryId, req.Description,
            req.Variants.Select(v => new VariantInput(v.Unit, v.Price, v.DiscountPrice, v.StockQty, v.ImageUrl, v.DisplayOrder)).ToList(),
            req.Attributes.Select(a => new AttributeInput(a.Key, a.Value)).ToList(),
            req.Tags, req.Images), ct);
        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateProductRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateProductCommand(
            id, req.Name, req.CategoryId, req.Description,
            req.Variants.Select(v => new VariantInput(v.Unit, v.Price, v.DiscountPrice, v.StockQty, v.ImageUrl, v.DisplayOrder)).ToList(),
            req.Attributes.Select(a => new AttributeInput(a.Key, a.Value)).ToList(),
            req.Tags, req.Images), ct);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeleteProductCommand(id), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        await sender.Send(new ToggleProductActiveCommand(id), ct);
        return Ok();
    }

    // Variants
    [HttpGet("{productId:guid}/variants")]
    public async Task<IActionResult> GetVariants(Guid productId, CancellationToken ct)
    {
        var result = await sender.Send(new GetAdminProductsQuery(1, 1, null, null, false), ct);
        return Ok(new { productId });
    }

    [HttpPost("{productId:guid}/variants")]
    public async Task<IActionResult> AddVariant(Guid productId, [FromBody] VariantRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new AddVariantCommand(productId,
            new VariantInput(req.Unit, req.Price, req.DiscountPrice, req.StockQty, req.ImageUrl, req.DisplayOrder)), ct);
        return CreatedAtAction(nameof(GetVariants), new { productId }, new { id });
    }

    [HttpPut("{productId:guid}/variants/{variantId:guid}")]
    public async Task<IActionResult> UpdateVariant(Guid productId, Guid variantId, [FromBody] VariantRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateVariantCommand(variantId,
            new VariantInput(req.Unit, req.Price, req.DiscountPrice, req.StockQty, req.ImageUrl, req.DisplayOrder)), ct);
        return Ok();
    }

    [HttpDelete("{productId:guid}/variants/{variantId:guid}")]
    public async Task<IActionResult> DeleteVariant(Guid productId, Guid variantId, CancellationToken ct)
    {
        await sender.Send(new DeleteVariantCommand(variantId), ct);
        return NoContent();
    }

    [HttpPatch("{productId:guid}/variants/reorder")]
    public async Task<IActionResult> ReorderVariants(Guid productId, [FromBody] List<ReorderVariantRequest> items, CancellationToken ct)
    {
        await sender.Send(new ReorderVariantsCommand(productId,
            items.Select(i => new ReorderVariantItem(i.VariantId, i.DisplayOrder)).ToList()), ct);
        return Ok();
    }
}

public record VariantRequest(string Unit, decimal Price, decimal? DiscountPrice, int StockQty, string ImageUrl, int DisplayOrder);
public record AttributeRequest(string Key, string Value);
public record CreateProductRequest(
    string Name, Guid CategoryId, string Description,
    List<VariantRequest> Variants, List<AttributeRequest> Attributes,
    List<string> Tags, List<string> Images);
public record ReorderVariantRequest(Guid VariantId, int DisplayOrder);
