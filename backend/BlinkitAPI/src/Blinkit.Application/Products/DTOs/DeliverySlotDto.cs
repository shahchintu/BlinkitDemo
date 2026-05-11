namespace Blinkit.Application.Products.DTOs;

public record DeliverySlotDto(
    Guid Id,
    string Label,
    string StartTime,
    string EndTime
);
