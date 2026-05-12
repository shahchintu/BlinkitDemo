using System.Text.Json;
using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Blinkit.Infrastructure.Services;

public class RedisCartService(IDistributedCache cache, IBlinkitDbContext db) : IRedisCartService
{
    private static readonly DistributedCacheEntryOptions CartTtl = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7)
    };

    private static string Key(Guid userId) => $"cart:{userId}";

    public async Task<CartDto> GetCartAsync(Guid userId)
    {
        try
        {
            var json = await cache.GetStringAsync(Key(userId));
            if (json is not null)
                return JsonSerializer.Deserialize<CartDto>(json) ?? new CartDto();
        }
        catch { /* Redis unavailable — fall through to DB */ }

        return await LoadFromDbAsync(userId);
    }

    public async Task<CartDto> AddItemAsync(Guid userId, Guid productId, Guid variantId, int quantity)
    {
        var variant = await db.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId && v.IsActive)
            ?? throw new KeyNotFoundException("Product variant not found");

        if (variant.StockQty < quantity)
            throw new ArgumentException($"Only {variant.StockQty} unit(s) available");

        var cart = await GetCartAsync(userId);

        var existing = cart.Items.FirstOrDefault(i => i.VariantId == variantId);
        if (existing is not null)
        {
            existing.Quantity += quantity;
        }
        else
        {
            cart.Items.Add(new CartItemDto
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                ProductName = variant.Product.Name,
                VariantId = variantId,
                VariantUnit = variant.Unit,
                VariantImageUrl = variant.ImageUrl,
                Quantity = quantity,
                UnitPrice = variant.DiscountPrice ?? variant.Price,
            });
        }

        await PersistAsync(userId, cart);
        return cart;
    }

    public async Task<CartDto> UpdateItemAsync(Guid userId, Guid cartItemId, int quantity)
    {
        var cart = await GetCartAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new KeyNotFoundException("Cart item not found");

        if (quantity <= 0)
            cart.Items.Remove(item);
        else
            item.Quantity = quantity;

        await PersistAsync(userId, cart);
        return cart;
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId)
    {
        var cart = await GetCartAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new KeyNotFoundException("Cart item not found");

        cart.Items.Remove(item);
        await PersistAsync(userId, cart);
        return cart;
    }

    public async Task ClearAsync(Guid userId)
    {
        try { await cache.RemoveAsync(Key(userId)); } catch { }

        var dbCart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
        if (dbCart is not null)
        {
            db.CartItems.RemoveRange(dbCart.Items);
            await db.SaveChangesAsync();
        }
    }

    private async Task PersistAsync(Guid userId, CartDto cart)
    {
        var json = JsonSerializer.Serialize(cart);
        try
        {
            await cache.SetStringAsync(Key(userId), json, CartTtl);
        }
        catch
        {
            await PersistToDbAsync(userId, cart);
        }
    }

    private async Task<CartDto> LoadFromDbAsync(Guid userId)
    {
        var dbCart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .Include(c => c.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (dbCart is null) return new CartDto();

        return new CartDto
        {
            Items = dbCart.Items.Select(i => new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                VariantId = i.VariantId,
                VariantUnit = i.Variant.Unit,
                VariantImageUrl = i.Variant.ImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
            }).ToList(),
        };
    }

    private async Task PersistToDbAsync(Guid userId, CartDto cartDto)
    {
        var dbCart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
        if (dbCart is null)
        {
            dbCart = new Cart { Id = Guid.NewGuid(), UserId = userId };
            await db.Carts.AddAsync(dbCart);
        }

        db.CartItems.RemoveRange(dbCart.Items);
        dbCart.Items = cartDto.Items.Select(dto => new CartItem
        {
            Id = dto.Id,
            CartId = dbCart.Id,
            ProductId = dto.ProductId,
            VariantId = dto.VariantId,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
        }).ToList();

        dbCart.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }
}
