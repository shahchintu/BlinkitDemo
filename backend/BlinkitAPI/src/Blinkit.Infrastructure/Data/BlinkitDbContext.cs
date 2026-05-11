using Blinkit.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Infrastructure.Data;

public class BlinkitDbContext(DbContextOptions<BlinkitDbContext> options)
    : IdentityDbContext<AppUser>(options)
{
    public DbSet<BlinkitPlusSubscription> BlinkitPlusSubscriptions => Set<BlinkitPlusSubscription>();

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
    }
}
