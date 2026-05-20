using Blinkit.Application.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

/// <summary>
/// Public product endpoints — no authentication required.
/// Results are cached in Redis. Search and category filter are applied server-side.
/// </summary>
[ApiController]
[Route("api/products")]
public class ProductsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "relevance",
        [FromQuery] decimal minPrice = 0,
        [FromQuery] decimal maxPrice = 999999,
        CancellationToken ct = default)
    {
        var query = new GetProductsQuery(search, categoryId, page, pageSize, sortBy, minPrice, maxPrice);
        var result = await mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProduct(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/related")]
    public async Task<IActionResult> GetRelated(Guid id, [FromQuery] int limit = 12, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetRelatedProductsQuery(id, limit), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/similar")]
    public async Task<IActionResult> GetSimilar(Guid id, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetSimilarProductsQuery(id, limit), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/top-in-category")]
    public async Task<IActionResult> GetTopInCategory(Guid id, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetTopInCategoryQuery(id, limit), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/also-bought")]
    public async Task<IActionResult> GetAlsoBought(Guid id, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAlsoBoughtQuery(id, limit), ct);
        return Ok(result);
    }
}
