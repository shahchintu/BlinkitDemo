namespace Blinkit.Domain.Entities;

public class Address
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public decimal? Lat { get; set; }
    public decimal? Lng { get; set; }
    public bool IsDefault { get; set; }
}
