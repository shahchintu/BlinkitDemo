namespace Blinkit.Application.Products.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string IconUrl,
    int DisplayOrder
);
