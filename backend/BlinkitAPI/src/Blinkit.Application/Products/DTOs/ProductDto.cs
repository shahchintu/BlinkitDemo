namespace Blinkit.Application.Products.DTOs;

public record ProductDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Slug,
    string Description,
    bool IsActive,
    ProductVariantDto DefaultVariant,
    List<ProductVariantDto> Variants,
    List<ProductAttributeDto> Attributes,
    List<string> RelatedTags,
    List<string> Images,
    bool HasVariants
);
