namespace Blinkit.Application.Cart.DTOs;

public class CartDto
{
    public List<CartItemDto> Items { get; set; } = [];
    public decimal SubTotal => Items.Sum(i => i.UnitPrice * i.Quantity);
    public int ItemCount => Items.Sum(i => i.Quantity);
}
