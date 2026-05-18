using Blinkit.Application.Cart.DTOs;

namespace Blinkit.Application.Interfaces;

public record MergeItemRequest(Guid ProductId, Guid VariantId, int Quantity);

public interface IRedisCartService
{
    Task<CartDto> GetCartAsync(Guid userId);
    Task<CartDto> AddItemAsync(Guid userId, Guid productId, Guid variantId, int quantity);
    Task<CartDto> UpdateItemAsync(Guid userId, Guid cartItemId, int quantity);
    Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId);
    Task ClearAsync(Guid userId);
    Task<CartDto> MergeItemsAsync(Guid userId, IReadOnlyList<MergeItemRequest> items);
}
