namespace Blinkit.Application.Orders.DTOs;

public class OrderItemEmailDto
{
    public string ProductName { get; set; } = string.Empty;
    public string VariantUnit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}
