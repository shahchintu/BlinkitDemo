using Blinkit.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using CartEntity = Blinkit.Domain.Entities.Cart;
using CartItemEntity = Blinkit.Domain.Entities.CartItem;
using OrderEntity = Blinkit.Domain.Entities.Order;

namespace Blinkit.Application.Interfaces;

public interface IBlinkitDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductTag> ProductTags { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductAttribute> ProductAttributes { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<DeliverySlot> DeliverySlots { get; }
    DbSet<CartEntity> Carts { get; }
    DbSet<CartItemEntity> CartItems { get; }
    DbSet<Address> Addresses { get; }
    DbSet<OrderEntity> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
