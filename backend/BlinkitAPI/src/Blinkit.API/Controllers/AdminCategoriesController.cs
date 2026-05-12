using Blinkit.Application.Admin.Commands;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminCategoriesController(ISender sender, IBlinkitDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var cats = await db.Categories
            .OrderBy(c => c.DisplayOrder)
            .AsNoTracking()
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.IconUrl, c.DisplayOrder,
                c.Products.Count(p => p.IsActive)))
            .ToListAsync(ct);
        return Ok(cats);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new CreateCategoryCommand(req.Name, req.Slug, req.IconUrl, req.DisplayOrder), ct);
        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CategoryRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateCategoryCommand(id, req.Name, req.Slug, req.IconUrl, req.DisplayOrder), ct);
        return Ok();
    }

    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<ReorderCategoryRequest> items, CancellationToken ct)
    {
        await sender.Send(new ReorderCategoriesCommand(
            items.Select(i => new ReorderCategoryItem(i.CategoryId, i.DisplayOrder)).ToList()), ct);
        return Ok();
    }

    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        await sender.Send(new ToggleCategoryActiveCommand(id), ct);
        return Ok();
    }
}

public record CategoryRequest(string Name, string Slug, string IconUrl, int DisplayOrder);
public record ReorderCategoryRequest(Guid CategoryId, int DisplayOrder);
