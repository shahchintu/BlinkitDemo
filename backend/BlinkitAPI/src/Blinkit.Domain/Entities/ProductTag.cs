namespace Blinkit.Domain.Entities;

public class ProductTag
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Tag { get; set; } = string.Empty;

    public Product Product { get; set; } = null!;
}
