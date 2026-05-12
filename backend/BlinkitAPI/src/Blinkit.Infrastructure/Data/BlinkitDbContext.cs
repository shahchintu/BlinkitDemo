using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Infrastructure.Data;

public class BlinkitDbContext(DbContextOptions<BlinkitDbContext> options)
    : IdentityDbContext<AppUser>(options), IBlinkitDbContext
{
    public DbSet<BlinkitPlusSubscription> BlinkitPlusSubscriptions => Set<BlinkitPlusSubscription>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
    public DbSet<ProductTag> ProductTags => Set<ProductTag>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<DeliverySlot> DeliverySlots => Set<DeliverySlot>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<BlinkitPlusSubscription>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).IsRequired();
            e.Property(x => x.StartDate).IsRequired();
            e.Property(x => x.EndDate).IsRequired();
            e.Property(x => x.IsActive).IsRequired();
        });

        builder.Entity<Category>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(100);
            e.Property(x => x.IconUrl).HasMaxLength(500);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<Product>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(200);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.HasQueryFilter(x => !x.IsDeleted);

            e.HasOne(x => x.Category)
             .WithMany(x => x.Products)
             .HasForeignKey(x => x.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Variants)
             .WithOne(x => x.Product)
             .HasForeignKey(x => x.ProductId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Attributes)
             .WithOne(x => x.Product)
             .HasForeignKey(x => x.ProductId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Tags)
             .WithOne(x => x.Product)
             .HasForeignKey(x => x.ProductId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Images)
             .WithOne(x => x.Product)
             .HasForeignKey(x => x.ProductId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProductVariant>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Unit).IsRequired().HasMaxLength(100);
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.Property(x => x.DiscountPrice).HasPrecision(18, 2);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
        });

        builder.Entity<ProductAttribute>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).IsRequired().HasMaxLength(100);
            e.Property(x => x.Value).IsRequired().HasMaxLength(500);
        });

        builder.Entity<ProductTag>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Tag).IsRequired().HasMaxLength(100);
            e.HasIndex(x => new { x.ProductId, x.Tag });
        });

        builder.Entity<ProductImage>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ImageUrl).IsRequired().HasMaxLength(500);
        });

        builder.Entity<Coupon>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).IsRequired().HasMaxLength(50);
            e.Property(x => x.DiscountValue).HasPrecision(18, 2);
            e.Property(x => x.MinOrderAmount).HasPrecision(18, 2);
            e.Property(x => x.MaxDiscountAmount).HasPrecision(18, 2);
        });

        builder.Entity<DeliverySlot>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Label).IsRequired().HasMaxLength(100);
        });

        builder.Entity<Cart>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).IsRequired();
            e.HasIndex(x => x.UserId).IsUnique();

            e.HasMany(x => x.Items)
             .WithOne(x => x.Cart)
             .HasForeignKey(x => x.CartId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CartItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);

            e.HasOne(x => x.Product)
             .WithMany()
             .HasForeignKey(x => x.ProductId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Variant)
             .WithMany()
             .HasForeignKey(x => x.VariantId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Address>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).IsRequired();
            e.Property(x => x.Label).IsRequired().HasMaxLength(100);
            e.Property(x => x.Street).IsRequired().HasMaxLength(300);
            e.Property(x => x.City).IsRequired().HasMaxLength(100);
            e.Property(x => x.Pincode).IsRequired().HasMaxLength(20);
            e.Property(x => x.Lat).HasPrecision(10, 7);
            e.Property(x => x.Lng).HasPrecision(10, 7);
        });

        builder.Entity<Order>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).IsRequired();
            e.Property(x => x.SubTotal).HasPrecision(18, 2);
            e.Property(x => x.DeliveryFee).HasPrecision(18, 2);
            e.Property(x => x.CouponCode).HasMaxLength(50);
            e.Property(x => x.CouponDiscount).HasPrecision(18, 2);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.RazorpayOrderId).HasMaxLength(100);
            e.Property(x => x.RazorpayPaymentId).HasMaxLength(100);

            e.HasOne(x => x.Address)
             .WithMany()
             .HasForeignKey(x => x.AddressId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Items)
             .WithOne(x => x.Order)
             .HasForeignKey(x => x.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);

            e.HasOne(x => x.Product)
             .WithMany()
             .HasForeignKey(x => x.ProductId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Variant)
             .WithMany()
             .HasForeignKey(x => x.VariantId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
