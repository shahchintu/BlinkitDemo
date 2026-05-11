using Blinkit.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Interfaces;

public interface IBlinkitDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductTag> ProductTags { get; }
    DbSet<DeliverySlot> DeliverySlots { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
