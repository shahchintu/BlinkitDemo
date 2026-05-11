using Blinkit.Application.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

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
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProductsQuery(search, categoryId, page, pageSize), ct);
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
}
