namespace Blinkit.Application.Products.DTOs;

public record ProductVariantDto(
    Guid Id,
    string Unit,
    decimal Price,
    decimal? DiscountPrice,
    int StockQty,
    string ImageUrl,
    int DisplayOrder
);
