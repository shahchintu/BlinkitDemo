namespace Blinkit.Domain.Entities;

public class BlinkitPlusSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}
