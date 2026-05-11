namespace Blinkit.Domain.Entities;

public class DeliverySlot
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int MaxOrders { get; set; }
    public bool IsActive { get; set; } = true;
}
