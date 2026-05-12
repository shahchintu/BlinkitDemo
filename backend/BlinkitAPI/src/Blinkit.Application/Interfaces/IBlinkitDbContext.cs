using Blinkit.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using CartEntity = Blinkit.Domain.Entities.Cart;
using CartItemEntity = Blinkit.Domain.Entities.CartItem;

namespace Blinkit.Application.Interfaces;

public interface IBlinkitDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductTag> ProductTags { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<DeliverySlot> DeliverySlots { get; }
    DbSet<CartEntity> Carts { get; }
    DbSet<CartItemEntity> CartItems { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
