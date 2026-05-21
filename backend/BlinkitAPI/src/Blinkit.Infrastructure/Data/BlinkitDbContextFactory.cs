using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Blinkit.Infrastructure.Data;

public class BlinkitDbContextFactory : IDesignTimeDbContextFactory<BlinkitDbContext>
{
    public BlinkitDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BlinkitDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=(localdb)\\MSSQLLocalDB;Database=BlinkitDemo;TrustServerCertificate=True;");
        return new BlinkitDbContext(optionsBuilder.Options);
    }
}
