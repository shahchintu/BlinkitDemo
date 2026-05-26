using System.Collections.Concurrent;
using System.Text.Json;
using Blinkit.Application.Cart.DTOs;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using Blinkit.Application.Products.Queries;
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

    // Per-user semaphores prevent concurrent read-modify-write races on the same cart.
    // Without this, two simultaneous requests (e.g. addItem + updateQty) both read the
    // same Redis snapshot, each append/modify, and the later write silently drops items.
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> UserLocks = new();
    private static SemaphoreSlim GetLock(Guid userId) =>
        UserLocks.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));

    private static string Key(Guid userId) => $"cart:{userId}";

    public async Task<CartDto> GetCartAsync(Guid userId)
    {
        CartDto cart;
        try
        {
            var json = await cache.GetStringAsync(Key(userId));
            if (json is not null)
            {
                cart = JsonSerializer.Deserialize<CartDto>(json) ?? new CartDto();
                goto Enrich;
            }
        }
        catch { /* Redis unavailable — fall through to DB */ }

        cart = await LoadFromDbAsync(userId);

    Enrich:
        if (cart.Items.Count > 0)
        {
            var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await db.Products
                .Include(p => p.Category)
                .Include(p => p.Variants)
                .Include(p => p.Attributes)
                .Include(p => p.Tags)
                .Include(p => p.Images)
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            var variantIds = cart.Items.Select(i => i.VariantId).Distinct().ToList();
            var variants = await db.ProductVariants
                .Include(v => v.Product)
                .Where(v => variantIds.Contains(v.Id))
                .ToListAsync();

            var enrichedItems = new List<CartItemDto>();
            foreach (var item in cart.Items)
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                var variant = variants.FirstOrDefault(v => v.Id == item.VariantId);
                if (product is not null && variant is not null)
                {
                    var firstImageUrl = product.Images.OrderBy(img => img.DisplayOrder).FirstOrDefault()?.ImageUrl ?? string.Empty;
                    item.ProductName = product.Name;
                    item.VariantUnit = variant.Unit;
                    item.VariantImageUrl = string.IsNullOrEmpty(variant.ImageUrl) ? firstImageUrl : variant.ImageUrl;
                    item.UnitPrice = variant.DiscountPrice ?? variant.Price;
                    item.Product = GetProductsQueryHandler.MapToDto(product);
                    var resolvedVariantImageUrl = string.IsNullOrEmpty(variant.ImageUrl) ? firstImageUrl : variant.ImageUrl;
                    item.Variant = new ProductVariantDto(
                        variant.Id,
                        variant.Unit,
                        variant.Price,
                        variant.DiscountPrice,
                        variant.StockQty,
                        resolvedVariantImageUrl,
                        variant.DisplayOrder,
                        resolvedVariantImageUrl.Contains("/uploads/") ? "uploaded" : "url"
                    );
                    enrichedItems.Add(item);
                }
            }
            cart.Items = enrichedItems;
        }

        return cart;
    }

    public async Task<CartDto> AddItemAsync(Guid userId, Guid productId, Guid variantId, int quantity)
    {
        var variant = await db.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId && v.IsActive)
            ?? throw new KeyNotFoundException("Product variant not found");

        if (variant.StockQty < quantity)
            throw new ArgumentException($"Only {variant.StockQty} unit(s) available");

        var sem = GetLock(userId);
        await sem.WaitAsync();
        try
        {
            // Reload inside the lock so we always work from the latest persisted cart,
            // not a snapshot that another concurrent request may have already modified.
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
        finally
        {
            sem.Release();
        }
    }

    public async Task<CartDto> UpdateItemAsync(Guid userId, Guid cartItemId, int quantity)
    {
        var sem = GetLock(userId);
        await sem.WaitAsync();
        try
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
        finally
        {
            sem.Release();
        }
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId)
    {
        var sem = GetLock(userId);
        await sem.WaitAsync();
        try
        {
            var cart = await GetCartAsync(userId);
            var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
                ?? throw new KeyNotFoundException("Cart item not found");

            cart.Items.Remove(item);
            await PersistAsync(userId, cart);
            return cart;
        }
        finally
        {
            sem.Release();
        }
    }

    public async Task<CartDto> MergeItemsAsync(Guid userId, IReadOnlyList<MergeItemRequest> items)
    {
        var sem = GetLock(userId);
        await sem.WaitAsync();
        try
        {
            // Load the existing cart once inside the lock — single read before all mutations
            var cart = await GetCartAsync(userId);

            foreach (var req in items)
            {
                var variant = await db.ProductVariants
                    .Include(v => v.Product)
                    .FirstOrDefaultAsync(v => v.Id == req.VariantId && v.ProductId == req.ProductId && v.IsActive);

                // Skip unknown or inactive variants silently — don't block the whole merge
                if (variant is null) continue;

                var existing = cart.Items.FirstOrDefault(i => i.VariantId == req.VariantId);
                if (existing is not null)
                {
                    var newQty = existing.Quantity + req.Quantity;
                    existing.Quantity = newQty > variant.StockQty ? variant.StockQty : newQty;
                }
                else
                {
                    var clampedQty = req.Quantity > variant.StockQty ? variant.StockQty : req.Quantity;
                    if (clampedQty > 0)
                    {
                        cart.Items.Add(new CartItemDto
                        {
                            Id = Guid.NewGuid(),
                            ProductId = req.ProductId,
                            ProductName = variant.Product.Name,
                            VariantId = req.VariantId,
                            VariantUnit = variant.Unit,
                            VariantImageUrl = variant.ImageUrl,
                            Quantity = clampedQty,
                            UnitPrice = variant.DiscountPrice ?? variant.Price,
                        });
                    }
                }
            }

            // Single write after all items processed
            await PersistAsync(userId, cart);
            return cart;
        }
        finally
        {
            sem.Release();
        }
    }

    public async Task ClearAsync(Guid userId)
    {
        var sem = GetLock(userId);
        await sem.WaitAsync();
        try
        {
            try { await cache.RemoveAsync(Key(userId)); } catch { }

            var dbCart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
            if (dbCart is not null)
            {
                db.CartItems.RemoveRange(dbCart.Items);
                await db.SaveChangesAsync();
            }
        }
        finally
        {
            sem.Release();
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
