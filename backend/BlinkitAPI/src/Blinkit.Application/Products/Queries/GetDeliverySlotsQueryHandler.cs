using Blinkit.Application.Interfaces;
using Blinkit.Application.Products.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Products.Queries;

public class GetDeliverySlotsQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetDeliverySlotsQuery, List<DeliverySlotDto>>
{
    public async Task<List<DeliverySlotDto>> Handle(GetDeliverySlotsQuery request, CancellationToken ct)
    {
        return await db.DeliverySlots
            .Where(s => s.IsActive)
            .AsNoTracking()
            .Select(s => new DeliverySlotDto(
                s.Id,
                s.Label,
                s.StartTime.ToString("HH:mm"),
                s.EndTime.ToString("HH:mm")
            ))
            .ToListAsync(ct);
    }
}
